"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { DemoRoleSelector } from "@/components/auth/DemoRoleSelector";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (selectedEmail: string, roleTitle: string) => {
    setEmail(selectedEmail);
    setPassword("demo1234");
    toast.info(`Assigned demo credentials for ${roleTitle}`, {
      description: `Preset email: ${selectedEmail}`,
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 z-20 selection:bg-[#CAAA98]/40 selection:text-[#202940]">
      {/* Editorial Architectural Background (#CAAA98, #9A8678, #4B4038, #202940) */}
      <AuthBackground />

      {/* Centered Frosted Architectural Glassmorphism Card with Interactive 3D Tilt */}
      <AuthCard>
        <AuthBrandHeader />
        <DemoRoleSelector activeEmail={email} onSelect={handleDemoSelect} />
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleLogin}
          loading={loading}
        />
        <AuthFooter />
      </AuthCard>
    </div>
  );
}
