"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Sparkles, Loader2, UserCheck, KeyRound } from "lucide-react";
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
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 text-white mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ClubOps AI</h1>
          <p className="text-xs text-slate-400">
            Autonomous operations command center for collegiate events
          </p>
        </div>

        {/* Demo Fast Logins for Hackathon Judges */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-2.5">
          <div className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Hackathon Demo Logins (1-Click)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoLogin("organizer@clubops.demo")}
              className="border-slate-700 bg-slate-950/80 hover:bg-slate-800 text-xs text-left h-auto py-2 flex flex-col items-start"
            >
              <span className="font-semibold text-white">Aman (Lead)</span>
              <span className="text-[10px] text-blue-400">Organizer Role</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoLogin("rahul@clubops.demo")}
              className="border-slate-700 bg-slate-950/80 hover:bg-slate-800 text-xs text-left h-auto py-2 flex flex-col items-start"
            >
              <span className="font-semibold text-white">Rahul</span>
              <span className="text-[10px] text-purple-400">Volunteer Role</span>
            </Button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@clubops.demo"
              className="bg-slate-950 border-slate-700 text-sm"
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
              className="bg-slate-950 border-slate-700 text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Sign In to Command Center
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/register"
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              Don&apos;t have an account? <span className="text-blue-400 font-medium">Create one</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
