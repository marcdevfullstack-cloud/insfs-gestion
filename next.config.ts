import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.railway.app", pathname: "/storage/**" },
      { protocol: "http",  hostname: "localhost",     port: "8000", pathname: "/storage/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
