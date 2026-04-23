import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { kwalaPost } from "../lib/api.js";
import { validateWorkflow } from "../lib/schema.js";
import { prepareDeploy, extractWorkflowName } from "../lib/deployer.js";
import type { VerifyResponse } from "../lib/types.js";
import { logger } from "../lib/logger.js";

export function registerPrepareDeployTool(server: McpServer): void {
  server.registerTool(
    "kwala-prepare-deploy",
    {
      title: "Prepare Deployment",
      description:
        "Prepare unsigned transactions for deploying a workflow. Returns encoded calldata that a browser wallet (MetaMask) can sign and broadcast. Use this instead of kwala-deploy-workflow when the user has a connected wallet in the UI.",
      inputSchema: z.object({
        yaml: z
          .string()
          .describe("The Kwalang YAML workflow to deploy."),
        user_address: z
          .string()
          .describe("The connected wallet address that will sign the transactions."),
      }),
    },
    async ({ yaml, user_address }) => {
      logger.debug("kwala-prepare-deploy invoked");

      // Validate locally
      const local = validateWorkflow(yaml);
      if (!local.valid) {
        return err("Validation failed", {
          suggestion: `Fix: ${local.errors?.join("; ")}`,
        });
      }

      // Verify via API
      try {
        const verifyResult = await kwalaPost<VerifyResponse>("/workflow/verify", {
          yaml,
          user_address,
        });

        if (!verifyResult.syntax_check || !verifyResult.schema_validation) {
          return err("Kwala verification failed", {
            suggestion: verifyResult.error ?? "Fix the YAML and try again.",
          });
        }
      } catch (e) {
        return err(
          `Verification failed: ${e instanceof Error ? e.message : String(e)}`,
          { retry_safe: true },
        );
      }

      // Prepare unsigned transactions
      try {
        const prepared = prepareDeploy(yaml, user_address);

        return ok({
          prepared: true,
          ...prepared,
          instructions: [
            "Sign each transaction with your wallet in order: save, then deploy.",
            "After deploy, wait for CLAIMED status, then sign the activate transaction.",
            "The activate transaction calldata will be provided after chaincode is fetched.",
          ],
          note: "These are unsigned transactions. The browser wallet will sign and broadcast them to KWALA chain (1905).",
        });
      } catch (e) {
        return err(
          `Failed to prepare: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
  );
}
