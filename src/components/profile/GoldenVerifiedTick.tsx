import { BadgeCheck } from 'lucide-react';

interface GoldenVerifiedTickProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/** Golden verified tick shown next to Final boss usernames on public profiles. */
export default function GoldenVerifiedTick({ size = 'md', className = '' }: GoldenVerifiedTickProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      title="Seenly Final boss — verified"
      aria-label="Seenly Final boss verified"
    >
      <BadgeCheck
        className={`${sizes[size]} text-amber-300`}
        fill="#f59e0b"
        stroke="#78350f"
        strokeWidth={1.75}
      />
    </span>
  );
}
