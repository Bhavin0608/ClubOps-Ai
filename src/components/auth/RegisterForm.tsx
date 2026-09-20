"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

interface RegisterFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  isSuccess?: boolean;
}

export function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  isSuccess = false,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Full Name Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#4B4038]">Full Name</label>
          <span className="text-[10px] text-[#9A8678] font-mono">OPERATOR ID</span>
        </div>
        <div className="relative flex items-center">
          <User className="w-4 h-4 text-[#9A8678] absolute left-3.5 pointer-events-none transition-colors" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Aman Verma"
            required
            minLength={2}
            disabled={loading || isSuccess}
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium disabled:opacity-60"
          />
        </div>
      </div>

      {/* Institutional Email Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#4B4038]">University Email</label>
          <span className="text-[10px] text-[#9A8678] font-mono">PRIMARY CONTACT</span>
        </div>
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 text-[#9A8678] absolute left-3.5 pointer-events-none transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="organizer@university.edu"
            required
            disabled={loading || isSuccess}
            className="w-full h-11 pl-10 pr-4 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password / Access Key Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#4B4038]">Create Access Key</label>
          <span className="text-[10px] text-[#9A8678] font-mono">MIN 6 CHARS</span>
        </div>
        <div className="relative flex items-center">
          <Lock className="w-4 h-4 text-[#9A8678] absolute left-3.5 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            minLength={6}
            disabled={loading || isSuccess}
            className="w-full h-11 pl-10 pr-11 text-sm rounded-xl glass-architectural-input placeholder:text-[#9A8678]/70 font-medium disabled:opacity-60"
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

      {/* Deep Midnight Navy Primary Action CTA with Dynamic Arrow & Background Sweep */}
      <button
        type="submit"
        disabled={loading || isSuccess}
        className={`group relative w-full h-12 mt-3 rounded-xl bg-[#202940] text-[#FAF8F5] font-semibold text-sm shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer disabled:pointer-events-none border border-[#CAAA98]/35 overflow-hidden select-none ${
          isSuccess
            ? "shadow-xl shadow-[#CAAA98]/40 border-[#202940]"
            : "hover:bg-[#182033] shadow-[#202940]/20 hover:shadow-xl hover:shadow-[#202940]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        }`}
      >
        {/* Dynamic Expanding Color Background Wave (#CAAA98) */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#9A8678] via-[#dfc4b3] to-[#CAAA98] transition-transform duration-700 ease-out pointer-events-none ${
            isSuccess ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden="true"
        />

        {/* Leading Specular Light Beam on Sweep */}
        <div
          className={`absolute top-0 bottom-0 w-12 bg-white/40 blur-xs transition-all duration-700 ease-out pointer-events-none ${
            isSuccess ? "right-0 opacity-100" : "-left-12 opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Subtle Warm Sandstone Top Light Sheen */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAAA98]/60 to-transparent pointer-events-none" />

        {/* Button Content */}
        <div className="relative z-10 w-full flex items-center justify-center px-4">
          {loading && !isSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#CAAA98]" />
              <span className="tracking-wide text-[#FAF8F5]">Creating Credentials...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2.5 w-full">
              <span
                className={`tracking-wide transition-colors duration-500 ${
                  isSuccess ? "text-[#202940] font-bold" : "text-[#FAF8F5]"
                }`}
              >
                {isSuccess ? "Account Enrolled // Entering" : "Register Account & Enter"}
              </span>

              <div
                className={`flex items-center transition-all duration-700 ease-out ${
                  isSuccess
                    ? "translate-x-8 sm:translate-x-14 scale-125 text-[#202940]"
                    : "translate-x-0 text-[#CAAA98] group-hover:translate-x-1.5"
                }`}
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Clean Sign In Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#4B4038]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#202940] hover:text-[#4B4038] underline underline-offset-4 decoration-[#CAAA98] hover:decoration-[#202940] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
