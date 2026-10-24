"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/reveal";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  colorDark: string;
  colorLight: string;
  pulseSpeed: number;
}

export default function CtaSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  // Full-bleed Canvas particle animation loop (Sleek ambient floating dust / aurora nodes)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 55;

    // Glowing vibrant tones
    const colorsDark = [
      "rgba(56, 189, 248, ",  // Sky cyan #38BDF8
      "rgba(96, 165, 250, ",  // Electric blue #60A5FA
      "rgba(100, 195, 255, ",  // Light sky #64C3FF
      "rgba(52, 211, 153, ",  // Emerald #34D399
    ];

    const colorsLight = [
      "rgba(0, 102, 178, ",   // Brand Blue #0066B2
      "rgba(2, 132, 199, ",   // Sky Blue #0284C7
      "rgba(28, 131, 211, ",  // Mid blue #1C83D3
      "rgba(16, 185, 129, ",  // Emerald #10B981
    ];

    const initParticles = (width: number, height: number) => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const maxAlpha = Math.random() * 0.5 + 0.2;
        const colorIdx = Math.floor(Math.random() * colorsDark.length);
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35 - 0.1, // Slight upward float
          size: Math.random() * 2.2 + 0.8,
          alpha: Math.random() * maxAlpha,
          maxAlpha,
          colorDark: colorsDark[colorIdx],
          colorLight: colorsLight[colorIdx],
          pulseSpeed: Math.random() * 0.02 + 0.008,
        });
      }
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let isVisible = false;

    // Viewport observer to pause canvas loop when offscreen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // Render loop
    const render = () => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const isDark = document.documentElement.classList.contains("dark");

      // Draw subtle aurora connection streams between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * (isDark ? 0.14 : 0.08);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(56, 189, 248, ${lineAlpha})`
              : `rgba(0, 102, 178, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Update and draw floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen seamlessly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Pulse alpha opacity
        p.alpha += p.pulseSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Soft attraction to mouse hover
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 0.4;
            p.y += (dy / dist) * force * 0.4;
          }
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const colorPrefix = isDark ? p.colorDark : p.colorLight;
        ctx.fillStyle = `${colorPrefix}${Math.max(0, p.alpha)})`;
        ctx.shadowColor = isDark ? "#38BDF8" : "#0066B2";
        ctx.shadowBlur = isDark ? 10 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-white dark:bg-[#121215] py-24 sm:py-32 lg:py-36 px-5 sm:px-8 lg:px-10 overflow-hidden transition-colors duration-300"
    >
      {/* Canvas Layer — Full Bleed Moving Ambient Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80 dark:opacity-90"
        aria-hidden="true"
      />

      {/* Content Container — Full-Bleed Modern Typography */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-[2.4rem] sm:text-6xl font-extrabold leading-[1.04] tracking-[-0.04em] text-zinc-900 dark:text-white">
            Your next freebie should{" "}
            <span className="font-instrument italic font-normal tracking-normal text-[#0066B2] dark:text-[#38BDF8]">pay you back.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            Build the page, upload the file, switch on follow-ups. It takes about as long as making a coffee.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              className="group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white px-7 text-[15px] font-semibold text-white dark:text-zinc-950 transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
              href="/register"
            >
              Build your first page free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">Free plan · No card needed · Live in minutes</p>
        </Reveal>
      </div>
    </section>
  );
}
