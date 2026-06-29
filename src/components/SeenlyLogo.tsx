import Link from 'next/link';

interface SeenlyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBeta?: boolean;
}

const sizeClass = {
  sm: 'text-base',
  md: 'text-lg sm:text-xl',
  lg: 'text-xl sm:text-2xl',
} as const;

export default function SeenlyLogo({ className = '', size = 'md', showBeta = true }: SeenlyLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight text-white transition-colors hover:text-white/85 ${sizeClass[size]} ${className}`}
    >
      <span>Seenly</span>
      {showBeta && (
        <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wider text-white/45">
          beta
        </span>
      )}
    </Link>
  );
}
