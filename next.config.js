/** @type {import('next').NextConfig} */
const distDir = process.env.NEXT_DIST_DIR || '.next';

const nextConfig = {
  distDir,
  reactStrictMode: true,
  devIndicators: false,
  // Enable modern React features
  experimental: {
    // Work around Next.js dev-only Segment Explorer manifest bug.
    devtoolSegmentExplorer: false,
  },
}

module.exports = nextConfig
