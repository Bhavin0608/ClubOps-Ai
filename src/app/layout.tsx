import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConstellationCanvas } from "@/components/effects/ConstellationCanvas";
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
      className={`${jakartaSans.variable} ${monoFont.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#4B4038] selection:bg-[#CAAA98]/40 selection:text-[#202940]">
        {/* Ambient 3D Architectural Node Canvas */}
        <ConstellationCanvas />

        {/* App Content */}
        <div className="relative z-10 min-h-full flex flex-col flex-1">
          {children}
        </div>

        {/* Notification Toasts styled for architectural glassmorphism */}
        <Toaster
          position="top-right"
          theme="light"
          toastOptions={{
            style: {
              background: "rgba(250, 248, 245, 0.95)",
              border: "1px solid rgba(202, 170, 152, 0.6)",
              color: "#202940",
              boxShadow: "0 10px 25px -5px rgba(32, 41, 64, 0.1)",
              backdropFilter: "blur(16px)",
            },
          }}
        />
      </body>
    </html>
  );
}
