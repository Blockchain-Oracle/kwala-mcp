import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ok } from "../lib/format.js";
import { TEMPLATES } from "../lib/templates.js";
import { logger } from "../lib/logger.js";

export function registerListTemplatesTool(server: McpServer): void {
  server.registerTool(
    "kwala-list-templates",
    {
      title: "Workflow Templates",
      description:
        "Browse pre-built Kwalang workflow templates. Filter by category or search by keyword.",
      inputSchema: z.object({
        category: z
          .enum(["alerts", "defi", "nft", "monitoring", "notifications", "all"])
          .optional()
          .describe("Filter by category. Default: all"),
        search: z
          .string()
          .optional()
          .describe(
            "Search templates by keyword (e.g., 'telegram', 'price', 'USDC').",
          ),
      }),
    },
    async ({ category, search }) => {
      logger.debug({ category, search }, "kwala-list-templates invoked");

      let results = TEMPLATES;

      if (category && category !== "all") {
        results = results.filter((t) => t.category === category);
      }

      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.yaml.toLowerCase().includes(q),
        );
      }

      return ok({
        count: results.length,
        templates: results.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          description: t.description,
          trigger_type: t.trigger_type,
          actions: t.actions,
          chains: t.chains,
          yaml: t.yaml,
        })),
      });
    },
  );
}
