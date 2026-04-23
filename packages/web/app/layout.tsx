import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
 
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
 
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
 
export const metadata: Metadata = {
  title: "Kwala MCP — Deploy Kwala Workflows with AI",
  description:
    "Give your AI agent end-to-end ability to create, verify, deploy and monitor Kwala blockchain automations through natural language. No dashboard needed.",
  keywords: ["Kwala", "MCP", "AI", "blockchain", "automation", "YAML", "Web3"],
};
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
