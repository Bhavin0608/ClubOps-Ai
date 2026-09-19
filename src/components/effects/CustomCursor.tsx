"use client";

import React, { useEffect, useState, useRef } from "react";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(true);

  // Position references for 60fps smooth spring animation
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringRef = useRef({ x: -100, y: -100 });
  const dotElRef = useRef<HTMLDivElement | null>(null);
  const ringElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);

    // Only enable on desktop pointer devices
    const pointerQuery = window.matchMedia("(pointer: fine)");
    if (!pointerQuery.matches) {
      setIsPointerFine(false);
      return;
    }

    document.documentElement.classList.add("custom-cursor-active");

    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (!visible) setVisible(true);

      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, input, textarea, select, [role="button"], .cursor-pointer, .interactive-hover, [data-interactive="true"]'
      );
      setIsHovered(!!interactive);
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const onMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Smooth elastic trailing ring loop
    let animId: number;
    const updateRing = () => {
      const lerpFactor = 0.2;
      ringRef.current.x += (mouseRef.current.x - ringRef.current.x) * lerpFactor;
      ringRef.current.y += (mouseRef.current.y - ringRef.current.y) * lerpFactor;

      if (ringElRef.current) {
        ringElRef.current.style.transform = `translate3d(${ringRef.current.x}px, ${ringRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(updateRing);
    };

    animId = requestAnimationFrame(updateRing);

    return () => {
      cancelAnimationFrame(animId);
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [visible]);

  if (!mounted || !isPointerFine) return null;

  return (
    <div
      className={`custom-cursor pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* High-precision Lavender / Cyan Glowing Dot */}
      <div
        ref={dotElRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#b9a8ec] shadow-[0_0_10px_#b9a8ec,0_0_18px_rgba(185,168,236,0.7)] pointer-events-none"
        style={{ willChange: "transform" }}
      />

      {/* Elastic Trailing Outer Ring with Lavender Aura */}
      <div
        ref={ringElRef}
        className={`fixed top-0 left-0 rounded-full border border-[#b9a8ec]/60 pointer-events-none transition-[width,height,background-color,border-color,box-shadow] duration-200 ease-out flex items-center justify-center ${
          isHovered
            ? "w-11 h-11 bg-[#b9a8ec]/15 border-[#b9a8ec] shadow-[0_0_24px_rgba(185,168,236,0.45)]"
            : "w-8 h-8 bg-transparent border-[#b9a8ec]/40 shadow-[0_0_12px_rgba(185,168,236,0.18)]"
        }`}
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
