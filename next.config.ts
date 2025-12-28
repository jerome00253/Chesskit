import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  // output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined, // Removed for dynamic server (API/Auth)
  trailingSlash: true, // Recommended for static exports on S3
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // Workaround for Node.js v23.x crash on Windows
  },
  images: {
    unoptimized: true,
  },
  headers:
    phase === PHASE_PRODUCTION_BUILD
      ? undefined
      : async () => [
          // Temporarily disabled strict COOP/COEP for debugging
          // {
          //   source: "/:path*",
          //   headers: [
          //     { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          //     { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          //   ],
          // },
          {
            source: "/engines/:blob*",
            headers: [
              {
                key: "Cross-Origin-Embedder-Policy",
                value: "require-corp",
              },
              {
                key: "Cross-Origin-Opener-Policy",
                value: "same-origin",
              },
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
              {
                key: "Age",
                value: "181921",
              },
            ],
          },
        ],
});

export default withSentryConfig(nextConfig, {
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  org: process.env.SENTRY_ORG,
  project: "javascript-nextjs",

  // Désactiver l'upload des sourcemaps (pas de token auth configuré)
  silent: true, // Supprime les warnings pendant le build

  // Sourcemaps configuration
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN, // Désactive si pas de token
    deleteSourcemapsAfterUpload: true, // Supprime après upload
  },

  // Désactiver la télémétrie
  telemetry: false,

  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  hideSourceMaps: true,
  disableLogger: true,
});
