import { promises as fs } from "node:fs";
import path from "node:path";
import { SkillContent } from "@/components/skill-content";

export const metadata = {
  title: "Skill - Kwala AI",
  description:
    "Install the Kwala AI skill in Claude Code, Cursor, or any MCP-compatible agent. Teaches AI agents when and how to use Kwala automation tools.",
};

async function loadSkillContent(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "skill.md");
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "# skill.md not found\n\nRun pnpm build in the web package.";
  }
}

export default async function SkillPage() {
  const content = await loadSkillContent();

  return (
    <main className="flex flex-1 flex-col">
      <div className="w-full bg-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            Agent Skill
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-[0.9]">
            The skill.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg">
            Install Kwala AI as an Agent Skill in Claude Code, Cursor, Windsurf,
            or any MCP-compatible host. The skill teaches your agent when and how
            to use Kwala automation tools — including decision trees, trigger
            types, and example workflows.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <SkillContent content={content} />
      </div>
    </main>
  );
}
