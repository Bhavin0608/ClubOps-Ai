"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterBrandHeader } from "@/components/auth/RegisterBrandHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed. Please check your details.");

      // Trigger arrow slide & background color sweep animation
      setIsSuccess(true);
      toast.success("Account created successfully! Welcome to ClubOps AI.");

      // Transition to events after animation sequence plays
      setTimeout(() => {
        router.push("/events");
      }, 750);
    } catch (err: any) {
      toast.error(err.message || "Failed to register account");
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 z-20 selection:bg-[#CAAA98]/40 selection:text-[#202940] transition-all duration-700 ${
        isSuccess ? "opacity-95 scale-[1.01]" : "opacity-100 scale-100"
      }`}
    >
      {/* Editorial Architectural Background (#CAAA98, #9A8678, #4B4038, #202940) */}
      <AuthBackground />

      {/* Page Exit Luminous Transition Curtain */}
      <div
        className={`fixed inset-0 z-40 pointer-events-none transition-all duration-700 ease-in-out ${
          isSuccess
            ? "opacity-100 backdrop-blur-xs bg-gradient-to-r from-transparent via-[#CAAA98]/15 to-[#FAF8F5]/60"
            : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Centered Frosted Architectural Glassmorphism Card with Interactive 3D Tilt */}
      <AuthCard>
        <RegisterBrandHeader />
        <RegisterForm
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleRegister}
          loading={loading}
          isSuccess={isSuccess}
        />
      </AuthCard>
    </div>
  );
}
