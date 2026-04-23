import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["@rainbow-me/rainbowkit"],
};

export default nextConfig;
