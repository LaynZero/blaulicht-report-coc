import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "Blaulicht Report COC",
  description: "Live-Meldungen für den Kreis Cochem-Zell",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Blaulicht COC",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
