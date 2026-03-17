import { Router, Request, Response } from "express";
import { windsorAccessTokenModel } from "../models/WindsorAccessToken";
import { AccountMembership } from "../models/AccountMembership";
import { IUser } from "../models/User";
import { config } from "../config";
import { logger } from "../logger";

const router = Router();

const WINDSOR_CO_USER_LOGIN_URL = config.WINDSOR_CO_USER_LOGIN_URL;

/**
 * Verify a Windsor access token by hitting the co-user-login URL.
 * Returns true if the token is valid (200 response), false otherwise.
 */
async function verifyWindsorToken(token: string): Promise<boolean> {
  try {
    const url = `${WINDSOR_CO_USER_LOGIN_URL}?access_token=${encodeURIComponent(token)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    // Treat 200 and 3xx redirects as valid
    return response.status >= 200 && response.status < 400;
  } catch (err) {
    logger.warn({ err }, "Failed to verify Windsor token (network error)");
    // On network error, still allow redirect — let Windsor handle it
    return true;
  }
}

/**
 * Render a minimal error page when no tokens are available.
 */
function renderErrorPage(res: Response, message: string): void {
  res.status(503).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Connection Unavailable — MAXED</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #1e293b; }
        .card { background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        p { font-size: 14px; color: #64748b; line-height: 1.6; }
        a { color: #4f46e5; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Connection Unavailable</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `);
}

// GET /api/connect-accounts?accountId=...
router.get("/", async (req: Request, res: Response) => {
  try {
    // 1. Validate accountId
    const accountId = req.query.accountId as string;
    if (!accountId) {
      return res.status(400).json({ error: "accountId query parameter is required" });
    }

    // 2. Verify user has membership to this account
    const user = req.user as IUser;
    if (user.role !== "admin") {
      const membership = await AccountMembership.findOne({
        userId: user._id,
        accountId,
      });
      if (!membership) {
        return res.status(403).json({ error: "Access denied to this account" });
      }
    }

    // 3. Check for existing assigned token
    const existingToken = await windsorAccessTokenModel.findByAccountId(accountId);

    if (existingToken) {
      // 4a. Verify existing token with Windsor
      const isValid = await verifyWindsorToken(existingToken.access_token);
      if (isValid) {
        // 4b. Token is valid — redirect to Windsor
        const redirectUrl = `${WINDSOR_CO_USER_LOGIN_URL}?access_token=${encodeURIComponent(existingToken.access_token)}`;
        return res.redirect(redirectUrl);
      }

      // 4c. Token is invalid — mark it and proceed to get a new one
      logger.info({ accountId, token: existingToken.access_token }, "Windsor token invalid, marking and reassigning");
      await windsorAccessTokenModel.markInvalid(existingToken.access_token);
    }

    // 5. No valid token — fetch an available one from the pool
    const availableToken = await windsorAccessTokenModel.findFirstAvailable();

    if (!availableToken) {
      // 5b. No tokens available
      logger.warn({ accountId }, "No Windsor access tokens available in pool");
      return renderErrorPage(
        res,
        "No connection tokens are available. Please contact support at <a href=\"mailto:support@maxedmarketing.com\">support@maxedmarketing.com</a>."
      );
    }

    // 5c. Assign the token to this account
    await windsorAccessTokenModel.assignToAccount(availableToken.access_token, accountId);
    logger.info({ accountId, token: availableToken.access_token }, "Assigned Windsor token to account");

    // 5d. Verify the newly assigned token
    const isNewTokenValid = await verifyWindsorToken(availableToken.access_token);

    if (!isNewTokenValid) {
      // 5e. New token also invalid — mark it and show error
      await windsorAccessTokenModel.markInvalid(availableToken.access_token);
      logger.warn({ accountId, token: availableToken.access_token }, "Newly assigned Windsor token is invalid");
      return renderErrorPage(
        res,
        "The assigned connection token is invalid. Please contact support at <a href=\"mailto:support@maxedmarketing.com\">support@maxedmarketing.com</a>."
      );
    }

    // 5d. Redirect to Windsor
    const redirectUrl = `${WINDSOR_CO_USER_LOGIN_URL}?access_token=${encodeURIComponent(availableToken.access_token)}`;
    return res.redirect(redirectUrl);
  } catch (err: any) {
    logger.error({ err, message: err?.message, stack: err?.stack }, "Error in connect-accounts endpoint");
    return renderErrorPage(
      res,
      "An unexpected error occurred. Please try again or contact support at <a href=\"mailto:support@maxedmarketing.com\">support@maxedmarketing.com</a>."
    );
  }
});

export default router;
