"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, GitFork, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const GITHUB_URL = "https://github.com/Blockchain-Oracle/kwala-mcp";

const navLinks = [
  { href: "#tools", label: "Tools" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#install", label: "Install" },
  { href: "https://kwala.network", label: "Kwala Network", external: true },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-border",
        "bg-background/90 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 hover:opacity-80 transition-opacity shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div className="size-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">K</span>
          </div>
          <span className="font-mono text-sm sm:text-base font-bold tracking-[0.12em] text-foreground">
            kwala-mcp
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
              >
                {label}
                <ArrowUpRight className="size-3 opacity-60" aria-hidden="true" />
              </a>
            ) : (
              <a
                key={href}
                href={href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
              >
                {label}
              </a>
            ),
          )}

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 flex items-center gap-1.5 px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
            aria-label="GitHub"
          >
            <GitFork className="size-4" />
          </a>

          <ThemeToggle />

          <a
            href="#install"
            className={cn(
              "ml-2 inline-flex items-center",
              "rounded-full border border-border bg-card px-4 py-1.5",
              "font-mono text-[11px] tracking-[0.12em] font-semibold uppercase",
              "text-foreground transition-all duration-150",
              "hover:bg-foreground hover:text-background hover:border-foreground/20",
            )}
          >
            Get Started
          </a>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center justify-center size-9 rounded-md text-foreground hover:bg-muted/60 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 top-16 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 md:hidden border-b border-border bg-background shadow-lg"
            >
              <div className="flex flex-col px-4 py-4 gap-0.5">
                {navLinks.map(({ href, label, external }) =>
                  external ? (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                    >
                      <span>{label}</span>
                    </a>
                  ) : (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 text-sm text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                    >
                      {label}
                    </a>
                  ),
                )}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted/60 rounded-lg transition-colors"
                >
                  <GitFork className="size-4" />
                  GitHub
                </a>
                <a
                  href="#install"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "mt-3 flex items-center justify-center",
                    "rounded-full border border-border bg-card px-4 py-3",
                    "font-mono text-xs tracking-[0.12em] font-semibold uppercase",
                    "text-foreground transition-all",
                    "hover:bg-foreground hover:text-background",
                  )}
                >
                  Get Started
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
