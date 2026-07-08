import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import ClientErrorLogger from "@/components/ClientErrorLogger";
import MaintenanceGate from "@/components/MaintenanceGate";

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
        <AuthProvider><ClientErrorLogger /><MaintenanceGate>{children}</MaintenanceGate></AuthProvider>
      </body>
    </html>
  );
}
