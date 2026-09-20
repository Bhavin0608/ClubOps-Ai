"use client";

import React, { ReactNode, useRef, useState } from "react";

interface AuthCardProps {
  children: ReactNode;
  isExiting?: boolean;
}

export function AuthCard({ children, isExiting = false }: AuthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExiting) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalized from -1 to 1
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Tilts toward the side hovered so it dips down as if gaining physical weight
    const maxTilt = 10; // degrees
    const rotateX = -normY * maxTilt; // dipping towards top or bottom
    const rotateY = normX * maxTilt;  // dipping towards right or left

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      rotateX,
      rotateY,
      glareX,
      glareY,
      isHovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      isHovered: false,
    });
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className={`relative w-full max-w-[480px] ${
        isExiting ? "animate-portal-zoom pointer-events-none" : "animate-card-in"
      }`}
    >
      {/* Warm Sculptural Ambient Halo reacting to tilt */}
      <div
        className="absolute -inset-2 rounded-[36px] bg-gradient-to-br from-[#CAAA98]/35 via-transparent to-[#202940]/20 blur-2xl -z-10 pointer-events-none transition-all duration-300"
        style={{
          transform: tilt.isHovered && !isExiting
            ? `translate3d(${tilt.rotateY * 1.5}px, ${-tilt.rotateX * 1.5}px, 0)`
            : "translate3d(0, 0, 0)",
          opacity: isExiting ? 0 : 1,
        }}
        aria-hidden="true"
      />

      {/* Main Architectural Glassmorphism Container with Dynamic 3D Weight Tilt */}
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
        className="relative rounded-[28px] glass-architectural overflow-hidden will-change-transform select-none"
      >
        {/* Dynamic Specular Glare following the cursor hover position */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: tilt.isHovered && !isExiting ? 1 : 0,
            background: `radial-gradient(circle 380px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.5) 0%, rgba(202, 170, 152, 0.18) 35%, transparent 75%)`,
          }}
          aria-hidden="true"
        />

        {/* Editorial Top Accent Ribbon */}
        <div className="flex h-1.5 w-full">
          <div className="w-1/3 bg-[#202940]" />
          <div className="w-1/4 bg-[#4B4038]" />
          <div className="w-1/4 bg-[#9A8678]" />
          <div className="w-1/6 bg-[#CAAA98]" />
        </div>

        {/* Minimalist Micro Coordinates Header */}
        <div className="flex items-center justify-between px-7 pt-4 text-[10px] font-mono tracking-widest uppercase text-[#9A8678]/80 select-none border-b border-[#CAAA98]/20 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#202940]" />
            <span>CLUBOPS.AI // OS 02</span>
          </div>
          <span>[ AUTONOMOUS CORE ]</span>
        </div>

        {/* Card Content Interior */}
        <div className="p-7 sm:p-9 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
