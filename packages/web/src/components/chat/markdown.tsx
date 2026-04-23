"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
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
    return (
      <code
        className={cn(
          "block p-3 rounded-lg bg-muted font-mono text-sm overflow-x-auto",
          className
        )}
      >
        {children}
      </code>
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
