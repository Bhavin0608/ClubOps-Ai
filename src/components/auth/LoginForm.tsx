"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Institutional Email Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#4B4038]">Institutional Email</label>
          <span className="text-[10px] text-[#9A8678] font-mono">AUTHORIZED ID</span>
        </div>
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 text-[#9A8678] absolute left-3.5 pointer-events-none transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="organizer@university.edu"
            required
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium"
          />
        </div>
      </div>

      {/* Password / Access Key Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#4B4038]">Access Key</label>
          <button
            type="button"
            className="text-[11px] text-[#9A8678] hover:text-[#202940] font-medium transition-colors cursor-pointer"
            onClick={() => alert("Password reset link has been dispatched to your institution admin.")}
          >
            Forgot key?
          </button>
        </div>
        <div className="relative flex items-center">
          <Lock className="w-4 h-4 text-[#9A8678] absolute left-3.5 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            className="w-full h-11 pl-10 pr-11 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[#9A8678] hover:text-[#4B4038] p-1 rounded-md transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Deep Midnight Navy Primary Action CTA */}
      <button
        type="submit"
        disabled={loading}
        className="group relative w-full h-12 mt-3 rounded-xl bg-[#202940] hover:bg-[#182033] text-[#FAF8F5] font-semibold text-sm shadow-lg shadow-[#202940]/20 hover:shadow-xl hover:shadow-[#202940]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none border border-[#CAAA98]/30 overflow-hidden"
      >
        {/* Subtle Warm Sandstone Top Light Sheen */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />

        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#CAAA98]" />
            <span className="tracking-wide">Authenticating Identity...</span>
          </>
        ) : (
          <>
            <span className="tracking-wide">Authorize & Enter Command</span>
            <ArrowRight className="w-4 h-4 text-[#CAAA98] transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
