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
 * GET /api/shopify/auth
 *
 * Entry point for Shopify OAuth. Shopify sends merchants here with a `shop` param.
 * We generate a nonce, store it, and redirect to Shopify's OAuth consent screen.
 */
router.get("/auth", (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop || !/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return res.status(400).send("Invalid shop parameter");
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

    // Redirect to the embedded app in Shopify admin
    res.redirect(`https://${shop}/admin/apps/${SHOPIFY_API_KEY}`);
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
