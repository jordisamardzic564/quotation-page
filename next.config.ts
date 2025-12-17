import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zneejoqfgrqzvutkituy.supabase.co",
      },
      // Payment icons (payments-icons-library)
      {
        protocol: "https",
        hostname: "cashfreelogo.cashfree.com",
      },
    ],
  },
};

export default nextConfig;
