"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // depth between 0.2 and 1.0
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  color: string; // lavender or sage green
  alpha: number;
}

export function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates and state
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160, // Repulsion radius
      active: false,
    };

    const handlePointerMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    // Color definitions from user palette:
    // Soft Lavender: #b9a8ec -> rgba(185, 168, 236, ...)
    // Soft Sage Green: #87a997 -> rgba(135, 169, 151, ...)
    const colors = [
      { r: 185, g: 168, b: 236, type: "lavender" }, // Lavender
      { r: 155, g: 136, b: 216, type: "deepLavender" }, // Deep lavender
      { r: 135, g: 169, b: 151, type: "sage" }, // Sage Green
      { r: 107, g: 140, b: 123, type: "deepSage" }, // Deep Sage
    ];

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      // Dynamic count based on screen area (smooth density)
      const count = Math.min(Math.floor((width * height) / 14000), 95);

      for (let i = 0; i < count; i++) {
        const z = 0.25 + Math.random() * 0.75; // 3D depth
        const palette = colors[Math.floor(Math.random() * colors.length)];
        const baseSpeed = 0.25 * z;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * baseSpeed;
        const vy = Math.sin(angle) * baseSpeed;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx,
          vy,
          baseVx: vx,
          baseVy: vy,
          radius: (1.2 + Math.random() * 1.8) * z,
          color: `rgba(${palette.r}, ${palette.g}, ${palette.b}`,
          alpha: (0.35 + Math.random() * 0.45) * z,
        });
      }
    };

    initParticles();

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const maxConnectDistance = 125;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor repulsion physics
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            // Repel force inversely proportional to distance, weighted by 3D depth
            const force = ((mouse.radius - dist) / mouse.radius) * 2.8 * p.z;
            const nx = dx / dist;
            const ny = dy / dist;

            p.vx += nx * force * 0.18;
            p.vy += ny * force * 0.18;
          }
        }

        // Return smoothly toward base drift velocity (damping)
        p.vx = p.vx * 0.94 + p.baseVx * 0.06;
        p.vy = p.vy * 0.94 + p.baseVy * 0.06;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries with soft buffer
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;

        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;

        // Draw particle node with glowing halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}, ${p.alpha})`;
        ctx.shadowColor = `${p.color}, 0.8)`;
        ctx.shadowBlur = 8 * p.z;
        ctx.fill();
        ctx.restore();

        // Connect nearby nodes with glowing geometric threads
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < maxConnectDistance) {
            const lineAlpha =
              (1 - cdist / maxConnectDistance) * 0.22 * Math.min(p.z, p2.z);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // Delicate geometric connection line
            ctx.strokeStyle = `rgba(185, 168, 236, ${lineAlpha})`;
            ctx.lineWidth = 0.75 * Math.min(p.z, p2.z);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      id="bg-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
