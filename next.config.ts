import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zneejoqfgrqzvutkituy.supabase.co",
      },
    ],
  },
};

export default nextConfig;
