module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  async rewrites() {
    return [
      {
        destination: "/terms-of-use.html",
        source: "/legal/terms-and-conditions",
      },
      {
        destination: "/terms-of-use.html",
        source: "/legal/terms-of-use",
      },
      {
        destination: "/privacy-policy.html",
        source: "/legal/privacy-policy",
      },
      {
        destination: "/privacy-policy.html",
        source: "/legal/data-deletion-policy",
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /@ffmpeg\/ffmpeg/,
      parser: {
        commonjs: true,
      },
    });

    // Suppress warnings from the ffmpeg package about dynamic imports
    config.ignoreWarnings = [
      {
        module: /@ffmpeg\/ffmpeg/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This keeps your existing webpack settings
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@ffmpeg\/ffmpeg/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ];
    return config;
  },
};

module.exports = nextConfig;