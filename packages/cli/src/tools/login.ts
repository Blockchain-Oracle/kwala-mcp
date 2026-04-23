import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { getConfig, updateConfig } from "../lib/wallet.js";
import { logger } from "../lib/logger.js";

const KWALA_API = "https://kwala-test.kalp.network";
const GOOGLE_AUTH_URL = `${KWALA_API}/auth/google/login`;

export function registerLoginTool(server: McpServer): void {
  server.registerTool(
    "kwala-login",
    {
      title: "Login to Kwala",
      description:
        "Authenticate with Kwala via Google OAuth to enable workflow activation. Opens Google login in the browser — after login, Kwala returns a JWT token. Pass the token back here to store it. Required for full workflow deployment.",
      inputSchema: z.object({
        jwt: z
          .string()
          .optional()
          .describe("JWT token from Kwala after Google OAuth login."),
      }),
    },
    async (params) => {
      logger.debug("kwala-login invoked");

      // If JWT provided, validate and store
      if (params.jwt) {
        try {
          const res = await fetch(`${KWALA_API}/auth/profile`, {
            headers: { Authorization: `Bearer ${params.jwt}` },
          });

          if (!res.ok) {
            return err("JWT token is invalid or expired. Open the login URL again and sign in.", {
              suggestion: "The token may have expired. Get a fresh one from the login URL.",
            });
          }

          const profile = (await res.json()) as Record<string, unknown>;
          updateConfig({
            auth: {
              jwt: params.jwt,
              email: profile.email as string | undefined,
              expires: Math.floor(Date.now() / 1000) + 86400,
            },
          });

          return ok({
            authenticated: true,
            email: profile.email ?? "unknown",
            message: "Logged in successfully. All future workflow deployments will be fully activated.",
          });
        } catch (e) {
          return err(`Failed to validate JWT: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Check if already logged in
      const config = getConfig();
      if (config.auth?.jwt && config.auth.expires && config.auth.expires > Date.now() / 1000) {
        return ok({
          authenticated: true,
          email: config.auth.email ?? "unknown",
          message: "Already logged in.",
          expires: new Date(config.auth.expires * 1000).toISOString(),
        });
      }

      // Return login URL — the AI agent should open this for the user
      return ok({
        authenticated: false,
        action_required: "google_login",
        login_url: GOOGLE_AUTH_URL,
        instructions:
          "Open the login_url in the user's browser. After Google sign-in, the Kwala dashboard will show a JWT token or set it as a cookie. Extract it from the browser's cookies (name: 'token' or 'jwt') or the URL, then call kwala-login again with the jwt parameter.",
        tip: "On the web UI (/chat), this happens automatically via the frontend OAuth flow.",
      });
    },
  );
}
