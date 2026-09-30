import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep a visited page's data in the browser for 30s so flicking back and
    // forth between Books and Shows is instant. Adding, deleting, rating and
    // marking items all call revalidatePath(), which clears this cache, so
    // the lists never show stale data after a change.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
