"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Account created successfully!");
      router.push("/events");
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1329]/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#b9a8ec] to-[#9b88d8] shadow-xl shadow-[#b9a8ec]/25 text-[#0b1329] mb-2">
            <Shield className="w-6 h-6 text-[#0b1329]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">Create ClubOps Account</h1>
          <p className="text-xs text-[#94a3b8]">Join as an event organizer or volunteer</p>
        </div>

        <form onSubmit={handleRegister} className="p-6 rounded-2xl bg-[#131e38]/85 border border-[#1c294d] space-y-4 shadow-xl backdrop-blur-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Your Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aman Verma"
              className="bg-[#0b1329] border-[#1c294d] text-sm text-[#f8fafc]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aman@technova.edu"
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
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b9a8ec] hover:bg-[#9b88d8] text-[#0b1329] font-semibold text-xs h-10 mt-2 cursor-pointer shadow-lg shadow-[#b9a8ec]/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Register Account
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs text-[#94a3b8] hover:text-[#b9a8ec] transition-colors"
            >
              Already have an account? <span className="text-[#b9a8ec] font-medium">Sign in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
