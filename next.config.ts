import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
    inlineCss: true,
  },
};

export default nextConfig;
