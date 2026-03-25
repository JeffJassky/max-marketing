import { Router, Request, Response } from "express";
import crypto from "crypto";
import { config } from "../config";
import { ShopifySession } from "../models/ShopifySession";
import { logger } from "../logger";

const router = Router();

const SHOPIFY_API_KEY = config.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = config.SHOPIFY_API_SECRET;
const SCOPES = "read_orders,read_products,read_customers";

/**
 * Verify Shopify HMAC signature on incoming requests.
 */
function verifyHmac(query: Record<string, any>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const sortedParams = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const computed = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(hmac as string, "hex"),
  );
}

/**
 * Verify a Shopify session token (JWT) and extract the shop domain.
 * Returns the shop domain if valid, null otherwise.
 */
function verifySessionToken(token: string): string | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    // Verify signature
    const signInput = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac("sha256", SHOPIFY_API_SECRET)
      .update(signInput)
      .digest("base64url");

    if (expectedSig !== signatureB64) return null;

    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString(),
    );

    // Verify expiry
    if (payload.exp && payload.exp < Date.now() / 1000) return null;

    // Verify audience matches our API key
    if (payload.aud !== SHOPIFY_API_KEY) return null;

    // Extract shop from dest (e.g. "https://mystore.myshopify.com")
    const dest = payload.dest as string;
    if (!dest) return null;
    const url = new URL(dest);
    return url.hostname; // e.g. "mystore.myshopify.com"
  } catch {
    return null;
  }
}

/**
 * GET /api/shopify/auth
 *
 * Entry point for Shopify app loading. Handles two flows:
 *
 * 1. Embedded (id_token present): Verify the session token JWT and exchange
 *    it for an offline access token via Shopify's token exchange grant.
 *    Then serve the app inside the Shopify admin iframe.
 *
 * 2. Non-embedded (no id_token): Traditional OAuth redirect flow.
 */
router.get("/auth", async (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop || !/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return res.status(400).send("Invalid shop parameter");
  }

  const idToken = req.query.id_token as string | undefined;

  // --- Embedded flow: exchange session token for access token ---
  if (idToken) {
    const tokenShop = verifySessionToken(idToken);
    if (!tokenShop || tokenShop !== shop) {
      logger.warn({ shop, tokenShop }, "Shopify: Session token verification failed");
      return res.status(403).send("Invalid session token");
    }

    // Check if we already have a valid session for this shop
    const existing = await ShopifySession.findOne({ shop });
    if (existing?.accessToken) {
      logger.info({ shop }, "Shopify: Existing session found, serving app");
      return res.redirect(`${config.APP_URL}?shop=${shop}`);
    }

    // Exchange the session token for an offline access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          subject_token: idToken,
          subject_token_type: "urn:ietf:params:oauth:token-type:id-token",
          requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(
        { shop, status: tokenResponse.status, error: errorText },
        "Shopify: Token exchange failed",
      );
      return res.status(502).send("Failed to exchange token with Shopify");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      scope: string;
    };

    await ShopifySession.findOneAndUpdate(
      { shop },
      {
        shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        installedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    logger.info(
      { shop, scope: tokenData.scope },
      "Shopify: App installed via token exchange",
    );

    return res.redirect(`${config.APP_URL}?shop=${shop}`);
  }

  // --- Non-embedded flow ---
  const existing = await ShopifySession.findOne({ shop });
  if (existing?.accessToken) {
    // Session exists — serve the app. If we're in an iframe (embedded), serve
    // the SPA directly. Don't redirect back to Shopify admin or it loops.
    logger.info({ shop }, "Shopify: Existing session found, serving app");
    return res.redirect(`${config.APP_URL}?shop=${shop}`);
  }

  const nonce = crypto.randomBytes(16).toString("hex");

  // Store nonce in session for CSRF verification
  (req as any).session.shopifyNonce = nonce;
  (req as any).session.shopifyShop = shop;

  const redirectUri = `${config.APP_URL}/api/shopify/auth/callback`;
  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  res.redirect(authUrl);
});

/**
 * GET /api/shopify/auth/callback
 *
 * Shopify redirects here after the merchant approves.
 * We verify HMAC + nonce, exchange the code for an access token, and store it.
 */
router.get("/auth/callback", async (req: Request, res: Response) => {
  try {
    const { shop, code, state, hmac } = req.query as Record<string, string>;

    // Verify HMAC
    if (!verifyHmac(req.query as Record<string, any>)) {
      logger.warn({ shop }, "Shopify OAuth: HMAC verification failed");
      return res.status(403).send("HMAC verification failed");
    }

    // Verify nonce (CSRF protection)
    const expectedNonce = (req as any).session.shopifyNonce;
    if (!state || state !== expectedNonce) {
      logger.warn({ shop }, "Shopify OAuth: Nonce mismatch");
      return res.status(403).send("State/nonce mismatch");
    }

    // Validate shop
    if (!shop || !/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
      return res.status(400).send("Invalid shop parameter");
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(
        { shop, status: tokenResponse.status, error: errorText },
        "Shopify OAuth: Token exchange failed",
      );
      return res.status(502).send("Failed to exchange token with Shopify");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      scope: string;
    };

    // Upsert the session
    await ShopifySession.findOneAndUpdate(
      { shop },
      {
        shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        installedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    logger.info(
      { shop, scope: tokenData.scope },
      "Shopify OAuth: App installed successfully",
    );

    // Clean up session nonce
    delete (req as any).session.shopifyNonce;
    delete (req as any).session.shopifyShop;

    // Redirect to the app
    res.redirect(`${config.APP_URL}?shop=${shop}`);
  } catch (error) {
    logger.error({ err: error }, "Shopify OAuth: Callback error");
    res.status(500).send("OAuth callback failed");
  }
});

/**
 * GET /api/shopify/sessions
 *
 * List all installed Shopify shops (admin use).
 * Protected by requireAuth in index.ts.
 */
router.get("/sessions", async (_req: Request, res: Response) => {
  const sessions = await ShopifySession.find(
    {},
    { shop: 1, scope: 1, installedAt: 1, clientAccountId: 1 },
  );
  res.json(sessions);
});

export default router;
