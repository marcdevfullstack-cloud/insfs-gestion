import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Photos depuis le backend Railway
      {
        protocol: "https",
        hostname: "*.railway.app",
        pathname: "/storage/**",
      },
      // Développement local
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
