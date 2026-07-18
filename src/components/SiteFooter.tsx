import SeenlyLogo from '@/components/SeenlyLogo';
import Link from 'next/link';

export type SiteFooterVariant =
  | 'guest'
  | 'member'
  | 'onboarding'
  | 'login'
  | 'onboarding-flow'
  | 'profile';

interface SiteFooterProps {
  compact?: boolean;
  minimal?: boolean;
  className?: string;
  variant?: SiteFooterVariant;
  username?: string | null;
}

type FooterLink = { href: string; label: string };

function linksForVariant(variant: SiteFooterVariant, username?: string | null): FooterLink[] {
  switch (variant) {
    case 'member':
      return [
        { href: '/dashboard', label: 'Dashboard' },
        ...(username ? [{ href: `/${username}`, label: 'View profile' }] : []),
        { href: '/#how-it-works', label: 'How it works' },
      ];
    case 'onboarding':
      return [
        { href: '/onboarding', label: 'Continue setup' },
        { href: '/login', label: 'Sign in' },
        { href: '/#how-it-works', label: 'How it works' },
      ];
    case 'login':
      return [
        { href: '/onboarding', label: 'Get started' },
        { href: '/#how-it-works', label: 'How it works' },
      ];
    case 'onboarding-flow':
      return [
        { href: '/login', label: 'Sign in' },
        { href: '/#how-it-works', label: 'How it works' },
      ];
    case 'profile':
      return [
        { href: '/onboarding', label: 'Create yours' },
        { href: '/login', label: 'Sign in' },
        { href: '/#how-it-works', label: 'How it works' },
      ];
    case 'guest':
    default:
      return [
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/onboarding', label: 'Get started' },
        { href: '/login', label: 'Sign in' },
      ];
  }
}

export default function SiteFooter({
  compact = false,
  minimal = false,
  className = '',
  variant = 'guest',
  username = null,
}: SiteFooterProps) {
  const links = linksForVariant(variant, username);

  if (minimal) {
    return (
      <footer
        className={`shrink-0 border-t border-white/[0.06] pt-3 pb-1 ${className}`}
      >
        <div className="flex items-center justify-between gap-3 text-[10px]">
          <SeenlyLogo size="sm" showBeta />
          <a
            href="https://x.com/anishsarkars"
            target="_blank"
            rel="noopener noreferrer"
            className="group font-medium text-white/50 transition-colors hover:text-white/80"
          >
            <span className="text-white/30 group-hover:text-white/45">by</span>{' '}
            <span className="underline decoration-white/20 underline-offset-2 group-hover:decoration-white/50">
              Anish
            </span>
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`shrink-0 border-t border-white/[0.06] bg-black px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 ${className}`}
    >
      <div
        className={`mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 sm:px-6 sm:flex-row ${
          compact ? 'gap-3 sm:gap-4' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <SeenlyLogo size="sm" showBeta />
          {!compact && <span className="text-xs text-white/25">© 2026</span>}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45">
          {links.map(({ href, label }) => (
            <Link key={href + label} href={href} className="transition-colors hover:text-white/70">
              {label}
            </Link>
          ))}
        </nav>

        <a
          href="https://x.com/anishsarkars"
          target="_blank"
          rel="noopener noreferrer"
          className={`group inline-flex items-center gap-1.5 font-semibold text-white/80 transition-colors hover:text-white ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          <span className="text-white/40 group-hover:text-white/55">Made by</span>
          <span className="underline decoration-white/25 underline-offset-4 transition-[text-decoration-color] group-hover:decoration-white/60">
            Anish
          </span>
        </a>
      </div>

      <a href="https://daniellaunches.com" target="_blank">
  <img src="https://daniellaunches.com/badge-light.svg" alt="Featured on DanielLaunches" width="220" height="48" />
</a>
    </footer>
  );
}
