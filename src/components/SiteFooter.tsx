import SeenlyLogo from '@/components/SeenlyLogo';
import Link from 'next/link';

interface SiteFooterProps {
  compact?: boolean;
  className?: string;
}

export default function SiteFooter({ compact = false, className = '' }: SiteFooterProps) {
  return (
    <footer
      className={`shrink-0 border-t border-white/10 bg-black px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 ${className}`}
    >
      <div
        className={`mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 ${
          compact ? 'gap-3 text-center' : 'sm:flex-row'
        }`}
      >
        <div className="flex items-center gap-2">
          <SeenlyLogo size="sm" showBeta />
          {!compact && <span className="text-xs text-white/25">© 2026</span>}
        </div>

        {!compact && (
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45">
            <Link href="/#how-it-works" className="transition-colors hover:text-white/70">
              How it works
            </Link>
            <Link href="/onboarding" className="transition-colors hover:text-white/70">
              Get started
            </Link>
            <Link href="/login" className="transition-colors hover:text-white/70">
              Sign in
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-white/70">
              Dashboard
            </Link>
          </nav>
        )}

        <p className={`text-white/35 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Made by{' '}
          <a
            href="https://github.com/anishsarkars"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/55 transition-colors hover:text-white/80"
          >
            Anish
          </a>
        </p>
      </div>
    </footer>
  );
}
