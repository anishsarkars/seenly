'use client';

import { useEffect } from 'react';

interface ConfettiProps {
  active: boolean;
  intensity?: 'normal' | 'subtle';
}

export default function Confetti({ active, intensity = 'normal' }: ConfettiProps) {
  useEffect(() => {
    if (!active) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#ffffff', '#a1a1aa', '#34d399', '#f472b6', '#60a5fa'];
    const isSubtle = intensity === 'subtle';
    const particleCount = isSubtle ? 36 : 120;
    const particles = Array.from({ length: particleCount }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * (isSubtle ? 0.42 : 0.35),
      vx: (Math.random() - 0.5) * (isSubtle ? 8 : 14),
      vy: Math.random() * (isSubtle ? -10 : -14) - (isSubtle ? 2 : 4),
      size: Math.random() * (isSubtle ? 4 : 6) + (isSubtle ? 2 : 3),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * (isSubtle ? 6 : 10),
      life: 1,
    }));

    let frame = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.vx *= 0.99;
        p.rotation += p.spin;
        p.life -= isSubtle ? 0.022 : 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame += 1;
      if (alive && frame < (isSubtle ? 100 : 180)) {
        raf = requestAnimationFrame(draw);
      } else {
        window.removeEventListener('resize', resize);
        canvas.remove();
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }, [active, intensity]);

  return null;
}
