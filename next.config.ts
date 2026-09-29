import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["artplayer", "artplayer-plugin-danmuku"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
