import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConstellationCanvas } from "@/components/effects/ConstellationCanvas";
import { CustomCursor } from "@/components/effects/CustomCursor";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClubOps AI — Autonomous Operations Command Center",
  description: "AI-native event operations command center with real-time risk intelligence, automated runbooks, and autonomous volunteer orchestration.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${monoFont.variable} h-full antialiased font-sans dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0b1329] text-[#f8fafc] selection:bg-[#b9a8ec]/30 selection:text-[#f8fafc]">
        {/* Ambient 3D Particle Constellation Canvas */}
        <ConstellationCanvas />

        {/* Custom Lavender Glowing Cursor */}
        <CustomCursor />

        {/* App Content */}
        <div className="relative z-10 min-h-full flex flex-col flex-1">
          {children}
        </div>

        {/* Notification Toasts styled for nocturnal luxury spa theme */}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#131e38",
              border: "1px solid #1c294d",
              color: "#f8fafc",
            },
          }}
        />
      </body>
    </html>
  );
}
