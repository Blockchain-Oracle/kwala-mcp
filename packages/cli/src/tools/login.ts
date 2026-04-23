import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { getConfig, updateConfig } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";
import http from "node:http";

const KWALA_API = "https://kwala-test.kalp.network";
const GOOGLE_AUTH_URL = `${KWALA_API}/auth/google/login`;

/**
 * Start a temporary local HTTP server to capture the OAuth callback.
 * Opens the browser for Google login, captures the JWT from the redirect.
 */
async function captureOAuthToken(timeoutMs = 120_000): Promise<{ jwt: string; raw: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      // Serve a simple page that extracts the token from the Kwala redirect
      if (url.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html>
<html><head><title>Kwala Login</title></head>
<body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff">
<div style="text-align:center;max-width:500px">
<h1>Kwala MCP Login</h1>
<p>Redirecting to Google login...</p>
<p style="color:#888">This window will close automatically after login.</p>
</div>
<script>window.location.href="${GOOGLE_AUTH_URL}";</script>
</body></html>`);
        return;
      }

      // Capture the callback with token
      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token") ?? url.searchParams.get("jwt");
        const raw = url.toString();

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html>
<html><head><title>Kwala Login</title></head>
<body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#22c55e">
<div style="text-align:center">
<h1>Login Successful</h1>
<p>You can close this window now.</p>
<p style="color:#888">Token captured by kwala-mcp.</p>
</div></body></html>`);

        server.close();
        clearTimeout(timeout);

        if (token) {
          resolve({ jwt: token, raw });
        } else {
          // The token might be in the URL fragment or body — return raw for inspection
          resolve({ jwt: "", raw });
        }
        return;
      }

      // Catch-all: check if Kwala redirected here with token in any format
      const allParams = Object.fromEntries(url.searchParams.entries());
      const possibleToken = allParams.token ?? allParams.jwt ?? allParams.access_token;

      if (possibleToken) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#22c55e"><h1>Login Successful!</h1></body></html>`);
        server.close();
        clearTimeout(timeout);
        resolve({ jwt: possibleToken, raw: url.toString() });
        return;
      }

      // Log unexpected paths for debugging
      logger.debug({ path: url.pathname, params: allParams }, "unexpected callback path");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fbbf24">
<div style="text-align:center"><h1>Capturing...</h1><p>Path: ${url.pathname}</p><p>Params: ${JSON.stringify(allParams)}</p>
<p style="color:#888">If you see this, copy the full URL from your browser and pass it to kwala-login with the jwt parameter.</p></div></body></html>`);
    });

    let port = 9876;
    server.listen(port, () => {
      logger.info({ port }, "OAuth callback server started");
    });
    server.on("error", () => {
      port = 9877;
      server.listen(port);
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Login timed out after 2 minutes. Try again or pass the JWT manually."));
    }, timeoutMs);
  });
}

export function registerLoginTool(server: McpServer): void {
  server.registerTool(
    "kwala-login",
    {
      title: "Login to Kwala",
      description:
        "Authenticate with Kwala via Google OAuth to enable workflow activation. Either opens a browser for login, or accepts a JWT token directly if you already have one. Login is required to fully activate deployed workflows.",
      inputSchema: z.object({
        jwt: z
          .string()
          .optional()
          .describe("JWT token if you already have one (skip browser login)."),
        browser: z
          .boolean()
          .optional()
          .describe("Open browser for Google OAuth login. Default: true if no jwt provided."),
      }),
    },
    async (params) => {
      logger.debug("kwala-login invoked");

      // If JWT provided directly, store it
      if (params.jwt) {
        // Validate it works
        try {
          const res = await fetch(`${KWALA_API}/auth/workflow/deploy`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${params.jwt}`,
            },
            body: JSON.stringify({ workflow_id: "test_validation" }),
          });
          const body = await res.text();

          // If we get anything other than "invalid token", the JWT is valid
          if (body.includes("Invalid token") || body.includes("invalid")) {
            return err("JWT token is invalid or expired. Try logging in again via browser.", {
              suggestion: "Call kwala-login with browser=true to open Google OAuth.",
            });
          }

          updateConfig({ auth: { jwt: params.jwt, expires: Math.floor(Date.now() / 1000) + 86400 } });

          return ok({
            authenticated: true,
            message: "JWT stored. Workflow deployments will now include backend activation.",
            note: "Token saved to config. Future deploys will auto-use it.",
          });
        } catch (e) {
          return err(`Failed to validate JWT: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Browser login flow
      const config = getConfig();

      // Check if already logged in
      if (config.auth?.jwt && config.auth.expires && config.auth.expires > Date.now() / 1000) {
        return ok({
          authenticated: true,
          message: "Already logged in. Token is still valid.",
          expires: new Date(config.auth.expires * 1000).toISOString(),
        });
      }

      return ok({
        action_required: "browser_login",
        login_url: GOOGLE_AUTH_URL,
        instructions: [
          "1. Open the login_url in your browser",
          "2. Sign in with your Google account",
          "3. After redirect, copy the JWT token from the URL or page",
          "4. Call kwala-login again with jwt=<your_token>",
        ],
        note: "The Kwala dashboard uses Google OAuth. After login, the browser will redirect with a token. Copy it and pass it back here.",
      });
    },
  );
}
