"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { FlippableAuthCard } from "@/components/auth/FlippableAuthCard";
import { WelcomeCardFace } from "@/components/auth/WelcomeCardFace";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { DemoRoleSelector } from "@/components/auth/DemoRoleSelector";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function LoginPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      toast.error("Please provide both email and access key.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication rejected. Invalid credentials.");
      }

      toast.success("Identity verified. Welcome to ClubOps AI.");

      // Spatial Portal Zoom Sequence
      // 1. Button reflects verified status
      setIsSuccess(true);

      // 2. Card initiates 3D spatial forward zoom with optical depth blur
      setTimeout(() => {
        setIsExiting(true);
      }, 70);

      // 3. Navigate through portal directly into /events
      setTimeout(() => {
        router.push("/events");

        // Fallback guard to guarantee navigation never freezes
        setTimeout(() => {
          if (window.location.pathname !== "/events") {
            window.location.assign("/events");
          }
        }, 350);
      }, 360);
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  const handleDemoSelect = (selectedEmail: string, roleTitle: string) => {
    if (isSuccess || isExiting) return;
    setEmail(selectedEmail);
    setPassword("demo1234");
    toast.info(`Assigned demo credentials for ${roleTitle}`, {
      description: `Preset email: ${selectedEmail}`,
    });
  };

  return (
    <div className="relative min-h-screen h-screen max-h-screen w-full flex items-center justify-center p-2.5 sm:p-4 z-20 selection:bg-[#CAAA98]/40 selection:text-[#202940] overflow-hidden">
      {/* Editorial Architectural Background with Portal Ambient Expansion */}
      <div className={`fixed inset-0 pointer-events-none ${isExiting ? "animate-portal-bg" : ""}`}>
        <AuthBackground />
      </div>

      {/* 3D Flippable Frosted Architectural Card */}
      <FlippableAuthCard
        isFlipped={isFlipped}
        onFlipBack={() => setIsFlipped(false)}
        isExiting={isExiting}
        frontContent={
          <WelcomeCardFace onGetStarted={() => setIsFlipped(true)} />
        }
        backContent={
          <>
            <AuthBrandHeader />
            <DemoRoleSelector activeEmail={email} onSelect={handleDemoSelect} />
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLogin}
              loading={loading}
              isSuccess={isSuccess}
            />
            <AuthFooter />
          </>
        }
      />
    </div>
  );
}
