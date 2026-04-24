"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Terminal, ExternalLink } from "lucide-react";

interface BaseCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
  explorerLink?: string;
}

const variantStyles = {
  default: {
    container: "border-border bg-card",
    header: "border-border bg-muted/30",
    icon: "text-primary",
  },
  success: {
    container: "border-green-500/30 bg-green-500/5",
    header: "border-green-500/20 bg-green-500/10",
    icon: "text-green-400",
  },
  warning: {
    container: "border-yellow-500/30 bg-yellow-500/5",
    header: "border-yellow-500/20 bg-yellow-500/10",
    icon: "text-yellow-400",
  },
  error: {
    container: "border-red-500/30 bg-red-500/5",
    header: "border-red-500/20 bg-red-500/10",
    icon: "text-red-400",
  },
};

export function BaseCard({
  title,
  icon,
  children,
  className,
  variant = "default",
  explorerLink,
}: BaseCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group rounded-xl border overflow-hidden transition-all duration-300",
        styles.container,
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b",
          styles.header
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              variant === "default" ? "bg-primary/10" : ""
            )}
          >
            {icon ? (
              <span className={cn("w-4 h-4", styles.icon)}>{icon}</span>
            ) : (
              <Terminal className={cn("w-4 h-4", styles.icon)} />
            )}
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-foreground">
            {title}
          </h3>
        </div>

        {explorerLink && (
          <a
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary hover:opacity-80 transition-colors"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-3 text-sm overflow-hidden">{children}</div>
    </div>
  );
}
