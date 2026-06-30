'use client';

import React, { useEffect, useRef } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { btnPrimary, btnSecondary } from '@/lib/platform-ui';
import { PLAN_MARKETING_BENEFITS } from '@/lib/plan-marketing';
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
  const benefits = PLAN_MARKETING_BENEFITS[plan];

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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onDismiss} aria-hidden />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-semibold tracking-tight text-white">Payment successful</h2>
        </div>

        <p className="text-sm leading-relaxed text-white/60">
          Welcome to <span className="font-medium text-white">{entitlements.label}</span>. Your plan benefits
          will be applied to your account shortly — usually within a minute.
        </p>

        <ul className="mt-5 space-y-2.5">
          {benefits.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/70">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-amber-200/80">
          Please sign in again so your session picks up the new plan.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onSignInAgain} className={`${btnPrimary} w-full sm:flex-1`}>
            Sign in again
          </button>
          <button type="button" onClick={onDismiss} className={`${btnSecondary} w-full sm:flex-1`}>
            Continue to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
