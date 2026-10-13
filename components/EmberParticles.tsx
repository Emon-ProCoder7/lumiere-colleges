"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  opacity: number;
  phase: number;
};

const EMBER_COUNT = 46;
const COLOR = "245, 185, 78";

// Lightweight canvas particle field, no WebGL dependency needed for a
// field this small. Embers drift upward and sway, and the whole field
// leans gently toward the cursor for a tactile, alive feel.
export function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const embers: Ember[] = Array.from({ length: EMBER_COUNT }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * height,
      r: 0.6 + Math.random() * 1.8,
      speed: 0.12 + Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 0.3,
      opacity: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
    }));

    const onPointerMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / width - 0.5) * 2;
      pointer.current.y = (e.clientY / height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 1;
      ctx!.clearRect(0, 0, width, height);
      const parallaxX = pointer.current.x * 10;
      const parallaxY = pointer.current.y * 6;

      for (const e of embers) {
        e.y -= e.speed;
        e.x += Math.sin(t * 0.01 + e.phase) * e.drift;
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        const flicker = 0.7 + 0.3 * Math.sin(t * 0.05 + e.phase);
        ctx!.beginPath();
        ctx!.arc(e.x + parallaxX, e.y + parallaxY, e.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${COLOR}, ${e.opacity * flicker})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
