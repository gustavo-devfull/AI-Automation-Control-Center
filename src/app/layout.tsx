import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ControlCenterProvider } from "@/lib/store-context";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Automation Control Center",
  description:
    "Operational dashboard for autonomous AI agents: execution, logs, cost, permissions, errors, retries, and human approval.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#05070c] text-slate-200`}>
        <ControlCenterProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </ControlCenterProvider>
      </body>
    </html>
  );
}
