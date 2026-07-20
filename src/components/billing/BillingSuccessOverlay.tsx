'use client';

import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { btnPrimary, btnSecondary } from '@/lib/platform-ui';
import { getPlanFeatureList } from '@/lib/plan-features';
import { PLANS } from '@/lib/plans';
import SeenlyLogo from '@/components/SeenlyLogo';

interface BillingSuccessOverlayProps {
  plan: 'pro' | 'founder';
  onDismiss: () => void;
  onSignInAgain: () => void;
}

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);

  const colors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#fafafa', '#d4d4d8', '#f5f5f5'];
  const particles = Array.from({ length: 100 }, () => ({
    x: w * 0.5 + (Math.random() - 0.5) * w * 0.4,
    y: h * 0.35 + (Math.random() - 0.5) * 80,
    w: 4 + Math.random() * 5,
    h: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -3 + Math.random() * 6,
    vy: -2 + Math.random() * 5,
    rot: Math.random() * Math.PI,
    vr: -0.12 + Math.random() * 0.24,
    life: 100 + Math.random() * 80,
  }));

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (alive > 0 && frame < 220) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function BillingSuccessOverlay({ plan, onDismiss, onSignInAgain }: BillingSuccessOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitlements = PLANS[plan];
  const benefits = getPlanFeatureList(plan).filter(
    (item) => !item.endsWith(':') && !item.toLowerCase().includes('trial')
  );

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onDismiss} aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="rounded-lg border border-white/10 bg-black px-6 py-8 text-center shadow-2xl sm:px-8 sm:py-9">
          <div className="flex justify-center">
            <SeenlyLogo size="sm" />
          </div>

          <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
            Payment successful
          </p>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Welcome to {entitlements.label}
          </h2>
          <p className="mt-2 text-sm text-white/45">Your plan is active on this account.</p>

          <ul className="mt-6 space-y-2 text-left">
            {benefits.slice(0, 5).map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-white/55">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-white/35">
            Sign in again so your session picks up the new plan.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={onSignInAgain} className={`${btnPrimary} w-full`}>
              Sign in again
            </button>
            <button type="button" onClick={onDismiss} className={`${btnSecondary} w-full`}>
              Continue to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
