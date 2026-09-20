"use client";

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
  isSuccess?: boolean;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  isSuccess = false,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-2.5 sm:space-y-3">
      {/* Institutional Email Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[11px] sm:text-xs text-[#4B4038]">Institutional Email</label>
          <span className="text-[9px] text-[#9A8678] font-mono">AUTHORIZED ID</span>
        </div>
        <div className="relative flex items-center">
          <Mail className="w-3.5 h-3.5 text-[#9A8678] absolute left-3 pointer-events-none transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="organizer@university.edu"
            required
            disabled={loading || isSuccess}
            className="w-full h-9 sm:h-9.5 pl-9 pr-3 text-xs sm:text-sm rounded-lg sm:rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password / Access Key Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[11px] sm:text-xs text-[#4B4038]">Access Key</label>
          <button
            type="button"
            className="text-[10px] sm:text-[11px] text-[#9A8678] hover:text-[#202940] font-medium transition-colors cursor-pointer"
            onClick={() => alert("Password reset link has been dispatched to your institution admin.")}
          >
            Forgot key?
          </button>
        </div>
        <div className="relative flex items-center">
          <Lock className="w-3.5 h-3.5 text-[#9A8678] absolute left-3 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            disabled={loading || isSuccess}
            className="w-full h-9 sm:h-9.5 pl-9 pr-10 text-xs sm:text-sm rounded-lg sm:rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#9A8678] hover:text-[#4B4038] p-1 rounded transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Deep Midnight Navy Primary Action CTA */}
      <button
        type="submit"
        disabled={loading || isSuccess}
        className={`group relative w-full h-10 sm:h-10.5 mt-1 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all duration-300 flex items-center justify-center cursor-pointer disabled:pointer-events-none border overflow-hidden select-none ${
          isSuccess
            ? "bg-[#202940] border-[#CAAA98] shadow-xl shadow-[#CAAA98]/35 scale-[1.01]"
            : "bg-[#202940] hover:bg-[#182033] border-[#CAAA98]/35 text-[#FAF8F5] shadow-[#202940]/20 hover:shadow-lg hover:shadow-[#202940]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        }`}
      >
        {/* Subtle Warm Sandstone Top Light Sheen */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/70 to-transparent pointer-events-none" />

        {/* Dynamic Sandstone Glow overlay when authenticated */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#CAAA98]/10 via-[#CAAA98]/20 to-[#CAAA98]/10 transition-opacity duration-300 pointer-events-none ${
            isSuccess ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Button Content */}
        <div className="relative z-10 w-full flex items-center justify-center px-4">
          {loading && !isSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CAAA98]" />
              <span className="tracking-wide text-[#FAF8F5]">Authenticating Identity...</span>
            </div>
          ) : isSuccess ? (
            <div className="flex items-center justify-center gap-2 text-[#CAAA98] animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#CAAA98]" />
              <span className="tracking-wider uppercase text-[11px] font-bold font-mono">
                Access Verified // Entering Portal
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[#FAF8F5]">
              <span className="tracking-wide">Authorize & Enter Command</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#CAAA98] transition-transform group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </button>
    </form>
  );
}
