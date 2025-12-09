import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined,
  trailingSlash: true, // Recommended for static exports on S3
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  headers:
    phase === PHASE_PRODUCTION_BUILD
      ? undefined
      : async () => [
          {
            source: "/:path*", // Wildcard to apply COOP/COEP to everything or specific routes? Let's be specific but inclusive of locales.
            // Actually, applying to everything might be safer for workers, but let's target localized routes + root.
            headers: [
               { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
               { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
            ],
            // Note: In Next.js headers, :path* matches everything but we can be more specific if needed.
            // But let's keep the existing structure and ADD localized variants.
          },
          {
             // Match root and locales
             source: "/:locale?",
             headers: [
               { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
               { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
             ]
          },
          {
             source: "/:locale/play",
             headers: [
               { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
               { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
             ]
          },
          {
             source: "/:locale/database",
             headers: [
               { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
               { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
             ]
          },
          // Keep existing specific ones just in case or for non-locale paths if accessed directly
          {
            source: "/play",
            headers: [
              { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
              { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            ],
          },
          {
            source: "/database",
            headers: [
              { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
              { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            ],
          },
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
