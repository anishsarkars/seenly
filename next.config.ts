import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["seenly.tech", "*.seenly.tech"],
    },
  },
};

export default nextConfig;
