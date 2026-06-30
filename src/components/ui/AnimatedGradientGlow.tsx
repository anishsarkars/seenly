const CONIC_GRADIENT =
  'conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.35) 12%, transparent 28%, rgba(139,92,246,0.28) 42%, transparent 58%, rgba(56,189,248,0.22) 72%, transparent 88%)';

interface AnimatedGradientGlowProps {
  variant?: 'card' | 'preview';
  rounded?: 'lg' | '2xl';
  className?: string;
}

export default function AnimatedGradientGlow({
  variant = 'card',
  rounded = 'lg',
  className = '',
}: AnimatedGradientGlowProps) {
  const isPreview = variant === 'preview';
  const roundedClass = rounded === '2xl' ? 'rounded-2xl' : 'rounded-lg';

  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isPreview ? 'h-[120%] w-[120%] opacity-35' : 'h-[min(100%,320px)] w-[min(100%,420px)] opacity-50'
        }`}
      >
        <div
          className={`absolute inset-0 animate-[gradientRotate_28s_linear_infinite] rounded-full ${
            isPreview ? 'blur-[56px]' : 'blur-[72px]'
          }`}
          style={{ background: CONIC_GRADIENT }}
        />
      </div>

      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[gradientColorDrift_14s_ease-in-out_infinite] rounded-full bg-emerald-500/10 ${
          isPreview ? 'h-32 w-32 blur-[72px]' : 'h-40 w-40 blur-[100px]'
        }`}
      />
      <div
        className={`absolute left-[42%] top-[48%] -translate-x-1/2 -translate-y-1/2 animate-[gradientColorDriftAlt_18s_ease-in-out_infinite_2s] rounded-full bg-violet-500/10 ${
          isPreview ? 'h-24 w-24 blur-[60px]' : 'h-28 w-28 blur-[80px]'
        }`}
      />
      <div
        className={`absolute left-[58%] top-[52%] -translate-x-1/2 -translate-y-1/2 animate-[gradientColorDrift_16s_ease-in-out_infinite_4s] rounded-full bg-sky-400/8 ${
          isPreview ? 'h-20 w-20 blur-[52px]' : 'h-24 w-24 blur-[70px]'
        }`}
      />

      <div
        className={`absolute inset-0 animate-[gradientPulse_10s_ease-in-out_infinite] bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(255,255,255,0.06),transparent_70%)] ${
          isPreview ? 'opacity-60' : ''
        }`}
      />

      {!isPreview && (
        <div
          className={`absolute -inset-px animate-[gradientColorDrift_12s_ease-in-out_infinite] ${roundedClass} bg-gradient-to-r from-emerald-500/20 via-violet-500/15 to-sky-400/15 blur-xl`}
        />
      )}
    </div>
  );
}
