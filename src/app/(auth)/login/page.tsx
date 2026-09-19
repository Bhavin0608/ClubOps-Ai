"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      toast.success("Welcome back!");
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen bg-[#0b1329]/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#b9a8ec] to-[#9b88d8] shadow-xl shadow-[#b9a8ec]/25 text-[#0b1329] mb-2">
            <Shield className="w-6 h-6 text-[#0b1329]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">ClubOps AI</h1>
          <p className="text-xs text-[#94a3b8]">
            Autonomous operations command center for collegiate events
          </p>
        </div>

        {/* Demo Fast Logins for Hackathon Judges */}
        <div className="p-3.5 rounded-xl bg-[#131e38] border border-[#b9a8ec]/30 space-y-2.5">
          <div className="text-xs font-semibold text-[#b9a8ec] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#b9a8ec]" />
            Hackathon Demo Logins (1-Click)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoLogin("organizer@clubops.demo")}
              className="border-[#1c294d] bg-[#0b1329]/80 hover:bg-[#1c294d] text-xs text-left h-auto py-2 flex flex-col items-start cursor-pointer"
            >
              <span className="font-semibold text-[#f8fafc]">Aman (Lead)</span>
              <span className="text-[10px] text-[#b9a8ec]">Organizer Role</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoLogin("rahul@clubops.demo")}
              className="border-[#1c294d] bg-[#0b1329]/80 hover:bg-[#1c294d] text-xs text-left h-auto py-2 flex flex-col items-start cursor-pointer"
            >
              <span className="font-semibold text-[#f8fafc]">Rahul</span>
              <span className="text-[10px] text-[#87a997]">Volunteer Role</span>
            </Button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-[#131e38]/85 border border-[#1c294d] space-y-4 shadow-xl backdrop-blur-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@clubops.demo"
              className="bg-[#0b1329] border-[#1c294d] text-sm text-[#f8fafc]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#0b1329] border-[#1c294d] text-sm text-[#f8fafc]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] font-semibold text-xs h-10 mt-2 cursor-pointer shadow-lg shadow-[#b9a8ec]/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Sign In to Command Center
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/register"
              className="text-xs text-[#94a3b8] hover:text-[#b9a8ec] transition-colors"
            >
              Don&apos;t have an account? <span className="text-[#b9a8ec] font-medium">Create one</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
