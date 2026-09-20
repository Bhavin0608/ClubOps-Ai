"use client";

import React from "react";
import Link from "next/link";

export function AuthFooter() {
  return (
    <div className="text-center pt-0">
      <p className="text-[11px] sm:text-xs text-[#4B4038]">
        Need an organizer access permit?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#202940] hover:text-[#4B4038] underline underline-offset-4 decoration-[#CAAA98] hover:decoration-[#202940] transition-colors"
        >
          Request enrollment
        </Link>
      </p>
    </div>
  );
}
