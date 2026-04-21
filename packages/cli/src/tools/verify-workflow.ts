import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok, err } from "../lib/format.js";
import { kwalaPost } from "../lib/api.js";
import { getAddress } from "../lib/wallet.js";
import { validateWorkflow } from "../lib/schema.js";
import type { VerifyResponse } from "../lib/types.js";
import { logger } from "../lib/logger.js";

export function registerVerifyWorkflowTool(server: McpServer): void {
  server.registerTool(
    "kwala-verify-workflow",
    {
      title: "Verify Workflow",
      description:
        "Verify a Kwalang YAML workflow against Kwala's backend API. This is the same compilation step the Kwala dashboard uses. If valid, the workflow is deployable.",
      inputSchema: z.object({
        yaml: z.string().describe("The Kwalang YAML workflow to verify."),
      }),
    },
    async ({ yaml }) => {
      logger.debug("kwala-verify-workflow invoked");

      // Client-side validation first (fast, detailed errors)
      const local = validateWorkflow(yaml);
      if (!local.valid) {
        return err("Local validation failed", {
          suggestion: `Fix these issues: ${local.errors?.join("; ")}`,
        });
      }

      try {
        const address = getAddress();
        const result = await kwalaPost<VerifyResponse>("/workflow/verify", {
          yaml,
          user_address: address,
        });

        if (result.syntax_check && result.schema_validation) {
          return ok({
            verified: true,
            syntax_check: true,
            schema_validation: true,
            workflow_name: local.parsed?.Name,
            ready_to_deploy: true,
          });
        }

        return err("Kwala verification failed", {
          suggestion: result.error ?? "Check the YAML structure against the Kwalang schema.",
        });
      } catch (e) {
        logger.error({ err: e }, "kwala-verify-workflow error");
        return err(
          `Verification failed: ${e instanceof Error ? e.message : String(e)}`,
          { retry_safe: true },
        );
      }
    },
  );
}
