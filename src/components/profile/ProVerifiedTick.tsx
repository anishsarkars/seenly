import { BadgeCheck } from 'lucide-react';

interface ProVerifiedTickProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/** Blue verified tick shown next to Seenly Pro usernames on public profiles. */
export default function ProVerifiedTick({ size = 'md', className = '' }: ProVerifiedTickProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      title="Seenly Pro — verified"
      aria-label="Seenly Pro verified"
    >
      <BadgeCheck
        className={`${sizes[size]} text-blue-400`}
        fill="#3b82f6"
        stroke="#1e3a8a"
        strokeWidth={1.75}
      />
    </span>
  );
}
