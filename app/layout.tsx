import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import ClientErrorLogger from "@/components/ClientErrorLogger";
import MaintenanceGate from "@/components/MaintenanceGate";
import RulesGate from "@/components/RulesGate";
import DeviceBanGate from "@/components/DeviceBanGate";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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
        <AuthProvider><ClientErrorLogger /><ServiceWorkerRegister /><DeviceBanGate><MaintenanceGate><RulesGate>{children}</RulesGate></MaintenanceGate></DeviceBanGate></AuthProvider>
      </body>
    </html>
  );
}
