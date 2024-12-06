import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
    ppr: true,
    inlineCss: true,
  },
};

export default nextConfig;
