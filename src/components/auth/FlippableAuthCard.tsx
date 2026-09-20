"use client";

import React, { ReactNode, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

interface FlippableAuthCardProps {
  isFlipped: boolean;
  onFlipBack: () => void;
  isExiting?: boolean;
  frontContent: ReactNode;
  backContent: ReactNode;
}

export function FlippableAuthCard({
  isFlipped,
  onFlipBack,
  isExiting = false,
  frontContent,
  backContent,
}: FlippableAuthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExiting) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    const maxTilt = 8; // degrees
    const rotateX = -normY * maxTilt;
    const rotateY = normX * maxTilt;

    setTilt({
      rotateX,
      rotateY,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      isHovered: false,
    });
  };

  return (
    <div
      style={{ perspective: 1400 }}
      className={`relative w-full max-w-[430px] my-auto ${
        isExiting ? "animate-portal-zoom pointer-events-none" : "animate-card-in"
      }`}
    >
      {/* Interactive 3D Weight Tilt Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isExiting
            ? undefined
            : tilt.isHovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(8px) scale3d(1.015, 1.015, 1.015)`
            : "rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)",
          transformStyle: "preserve-3d",
          transition: isExiting
            ? undefined
            : tilt.isHovered
            ? "transform 0.08s ease-out, box-shadow 0.08s ease-out"
            : "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.65s ease",
          boxShadow: isExiting
            ? undefined
            : tilt.isHovered
            ? `${-tilt.rotateY * 2.5}px ${tilt.rotateX * 2.5 + 30}px 75px -15px rgba(32, 41, 64, 0.18), 0 10px 25px -10px rgba(75, 64, 56, 0.1)`
            : "0 35px 80px -15px rgba(32, 41, 64, 0.12), 0 12px 30px -10px rgba(75, 64, 56, 0.07)",
        }}
        className="w-full will-change-transform rounded-[24px] sm:rounded-[28px]"
      >
        {/* 3D Rotating Flipping Card Body */}
        <div
          className="grid [grid-template-areas:'stack'] transition-transform duration-700 ease-in-out will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ============================================================ */}
          {/* FRONT FACE: Welcome to ClubOps AI                            */}
          {/* ============================================================ */}
          <div
            className={`[grid-area:stack] w-full h-full flex flex-col rounded-[24px] sm:rounded-[28px] glass-architectural overflow-hidden select-none border border-[#CAAA98]/45 ${
              isFlipped ? "pointer-events-none" : "pointer-events-auto"
            }`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
              boxShadow:
                "0 35px 80px -15px rgba(32, 41, 64, 0.14), 0 12px 30px -10px rgba(75, 64, 56, 0.08)",
            }}
          >
            {/* Top 4-Tone Accent Ribbon */}
            <div className="flex h-1.5 w-full shrink-0">
              <div className="w-1/3 bg-[#202940]" />
              <div className="w-1/4 bg-[#4B4038]" />
              <div className="w-1/4 bg-[#9A8678]" />
              <div className="w-1/6 bg-[#CAAA98]" />
            </div>

            {/* Minimalist Micro Coordinates Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-2.5 sm:pt-3 text-[10px] font-mono tracking-widest uppercase text-[#9A8678]/80 select-none border-b border-[#CAAA98]/20 pb-2 sm:pb-2.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#202940]" />
                <span>CLUBOPS.AI // OS 02</span>
              </div>
              <span>[ SYSTEM READY ]</span>
            </div>

            {/* Front Content - centered vertically & horizontally */}
            <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full">
              {frontContent}
            </div>
          </div>

          {/* ============================================================ */}
          {/* BACK FACE: Login Command Center                              */}
          {/* ============================================================ */}
          <div
            className={`[grid-area:stack] w-full h-full flex flex-col rounded-[24px] sm:rounded-[28px] glass-architectural overflow-hidden select-none border border-[#CAAA98]/45 ${
              isFlipped ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow:
                "0 35px 80px -15px rgba(32, 41, 64, 0.14), 0 12px 30px -10px rgba(75, 64, 56, 0.08)",
            }}
          >
            {/* Top 4-Tone Accent Ribbon */}
            <div className="flex h-1.5 w-full shrink-0">
              <div className="w-1/3 bg-[#202940]" />
              <div className="w-1/4 bg-[#4B4038]" />
              <div className="w-1/4 bg-[#9A8678]" />
              <div className="w-1/6 bg-[#CAAA98]" />
            </div>

            {/* Minimalist Micro Coordinates Header with Back button */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-2.5 sm:pt-3 text-[10px] font-mono tracking-widest uppercase text-[#9A8678]/80 select-none border-b border-[#CAAA98]/20 pb-2 sm:pb-2.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#202940]" />
                <span>CLUBOPS.AI // AUTH</span>
              </div>

              <button
                type="button"
                onClick={onFlipBack}
                className="inline-flex items-center gap-1 text-[10px] text-[#9A8678] hover:text-[#202940] transition-colors cursor-pointer"
                title="Return to Welcome view"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>[ RETURN ]</span>
              </button>
            </div>

            {/* Back Content */}
            <div className="p-3.5 sm:p-5 space-y-2 sm:space-y-2.5 relative z-10">
              {backContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
