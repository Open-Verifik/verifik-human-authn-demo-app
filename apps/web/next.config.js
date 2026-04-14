const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../.."),
  },
  async redirects() {
    return [
      {
        source: "/demos/compare-live",
        destination: "/demos/face-comparison-liveness",
        permanent: true,
      },
    ];
  },
  transpilePackages: ['@humanauthn/design-tokens', '@humanauthn/api-client', '@vladmandic/face-api'],
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@vladmandic\/face-api|@tensorflow\/tfjs/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ];

    /**
     * TensorFlow.js / face-api bundles may reference Node core modules; the browser build must not bundle them.
     * Webpack 5 no longer polyfills Node core modules for the client.
     */
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'cdn.verifik.co' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
