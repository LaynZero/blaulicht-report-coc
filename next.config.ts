import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (specifically firebase-admin/auth -> jwks-rsa -> jose) ships
  // an ESM-only dependency that Turbopack cannot bundle for CommonJS server
  // routes. Marking it external makes Next.js load it via Node's native
  // require/import at runtime instead of bundling it, which avoids
  // ERR_REQUIRE_ESM crashes in API routes that use firebase-admin/auth.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
