import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { kwalaPost } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { validateWorkflow } from "../lib/schema.js";
import { fullDeploy, extractWorkflowName } from "../lib/deployer.js";
import { invalidateCacheAll } from "../lib/cache.js";
import type { VerifyResponse } from "../lib/types.js";
import { logger } from "../lib/logger.js";

export function registerDeployWorkflowTool(server: McpServer): void {
  server.registerTool(
    "kwala-deploy-workflow",
    {
      title: "Deploy Workflow",
      description:
        "Deploy a Kwalang YAML workflow end-to-end on the KWALA chain. Verifies first, then performs on-chain transactions: save -> deploy -> activate. Returns step-by-step progress with transaction hashes.",
      inputSchema: z.object({
        yaml: z
          .string()
          .describe("The Kwalang YAML workflow to deploy (should be verified first via kwala-verify-workflow)."),
        auto_activate: z
          .boolean()
          .optional()
          .describe("Activate immediately after deploying. Default: true."),
      }),
    },
    async ({ yaml, auto_activate }) => {
      logger.debug("kwala-deploy-workflow invoked");

      // Step 0: Local validation
      const local = validateWorkflow(yaml);
      if (!local.valid) {
        return err("Local validation failed before deployment", {
          suggestion: `Fix: ${local.errors?.join("; ")}`,
        });
      }

      // Step 1: API verification
      try {
        const address = getAddress();
        const verifyResult = await kwalaPost<VerifyResponse>("/workflow/verify", {
          yaml,
          user_address: address,
        });

        if (!verifyResult.syntax_check || !verifyResult.schema_validation) {
          return err("Kwala verification failed — cannot deploy", {
            suggestion: verifyResult.error ?? "Fix the YAML and try again.",
          });
        }
      } catch (e) {
        return err(
          `Verification step failed: ${e instanceof Error ? e.message : String(e)}`,
          { retry_safe: true },
        );
      }

      // Step 2-4: On-chain deployment
      try {
        const result = await fullDeploy(yaml, {
          autoActivate: auto_activate ?? true,
        });

        invalidateCacheAll();

        if (result.deployed) {
          return ok({
            deployed: true,
            workflow_id: result.workflow_id,
            workflow_name: extractWorkflowName(yaml),
            chaincode_address: result.chaincode_address,
            status: result.chaincode_address ? "active" : "deployed",
            steps: result.steps,
          });
        }

        return err(`Deployment failed: ${result.error ?? "Unknown error"}`, {
          suggestion:
            "Ensure your wallet has funds on KWALA chain (1905). Check the steps array for which step failed.",
        });
      } catch (e) {
        logger.error({ err: e }, "kwala-deploy-workflow error");
        return err(
          `Deployment failed: ${e instanceof Error ? e.message : String(e)}`,
          {
            suggestion:
              "Ensure your wallet is funded on KWALA chain (1905, RPC: https://rpc-ohio.kwala.network).",
            retry_safe: false,
          },
        );
      }
    },
  );
}
