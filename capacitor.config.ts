import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.itspan.blaulichtreportcoc",
  appName: "Blaulicht Report COC",
  // Loads the real, live Next.js app instead of a bundled copy — the same
  // principle as the Android TWA. This is required because the app relies on
  // server-side API routes (rate limiting, admin actions, push) that can't be
  // shipped as static files inside the app bundle.
  server: {
    url: "https://blaulichtreport.it-span.de",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#020617",
  },
};

export default config;
