'use client';

import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { getPlanFeatureList } from '@/lib/plan-features';
import { PLANS } from '@/lib/plans';

interface BillingSuccessOverlayProps {
  plan: 'pro' | 'founder';
  onDismiss: () => void;
  onSignInAgain: () => void;
}

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);

  const colors = ['#34d399', '#a78bfa', '#38bdf8', '#fbbf24', '#f472b6', '#ffffff'];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.4 - 40,
    w: 6 + Math.random() * 6,
    h: 3 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 4,
    rot: Math.random() * Math.PI,
    vr: -0.15 + Math.random() * 0.3,
    life: 120 + Math.random() * 60,
  }));

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = 0;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (alive > 0 && frame < 240) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function BillingSuccessOverlay({ plan, onDismiss, onSignInAgain }: BillingSuccessOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitlements = PLANS[plan];
  const benefits = getPlanFeatureList(plan);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (canvasRef.current) fireConfetti(canvasRef.current);
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} aria-hidden />

      <div className="relative w-full max-w-md text-center">
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/10 via-violet-500/6 to-sky-400/6 blur-lg opacity-70"
          aria-hidden
        />
        <div className="relative rounded-2xl border border-white/[0.08] bg-black/50 px-6 py-8 shadow-[0_0_40px_-20px_rgba(16,185,129,0.12)] backdrop-blur-md sm:px-8 sm:py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Payment successful
          </span>

          <h2 className="mt-5 text-2xl font-bold leading-[1.1] tracking-tight text-white sm:text-3xl">
          Welcome to {entitlements.label}.<br />
          <span className="text-white/60">Your plan is now active on this account.</span>
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/50">
            These limits and features apply to your account now — longer videos, bigger uploads, and more.
          </p>

          <ul className="mt-6 space-y-2.5 text-left">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-white/50">
            Please <span className="font-semibold text-white/75">sign in again</span> so your session picks up the new plan.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onSignInAgain}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] hover:bg-zinc-200 sm:flex-1"
            >
              Sign in again
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:flex-1"
            >
              Continue to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
