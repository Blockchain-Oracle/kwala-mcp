"use client";

import { memo, useState, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
}

function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "absolute top-2 right-2 p-1.5 rounded-md transition-all",
        "opacity-0 group-hover/codeblock:opacity-100",
        copied
          ? "text-green-400 bg-green-400/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

const components: Partial<Components> = {
  a: ({ href, children }) => (
    <a
      href={href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-4 my-2">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-4 my-2">{children}</ul>
  ),
  li: ({ children }) => <li className="py-0.5">{children}</li>,
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-primary">
          {children}
        </code>
      );
    }

    // Extract language from className (e.g. "language-yaml")
    const language = className?.replace("language-", "") ?? "";
    const codeText =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.join("")
          : String(children ?? "");

    return (
      <div className="relative group/codeblock">
        {language && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border-b border-border rounded-t-lg">
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              {language}
            </span>
          </div>
        )}
        <CodeBlockCopyButton code={codeText} />
        <code
          className={cn(
            "block p-3 bg-muted font-mono text-sm overflow-x-auto",
            language ? "rounded-b-lg" : "rounded-lg",
            className
          )}
        >
          {children}
        </code>
      </div>
    );
  },
  pre: ({ children }) => <>{children}</>,
  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/50 pl-4 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-sm border border-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-foreground border-b border-border/50">
      {children}
    </td>
  ),
  hr: () => <hr className="my-4 border-border" />,
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-foreground mt-4 mb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-foreground mt-3 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-3 mb-1">
      {children}
    </h3>
  ),
};

export const Markdown = memo(function Markdown({ content }: MarkdownProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
