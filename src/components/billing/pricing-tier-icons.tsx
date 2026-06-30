import React from 'react';

const iconClass = 'h-10 w-10 sm:h-12 sm:w-12';

export function FreeTierIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="1.25" />
      <path d="M14 34c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M12 38h24" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function ProTierIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <rect x="10" y="14" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M18 14v-3M30 14v-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M16 26l5 4 11-10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FounderTierIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <path
        d="M24 8l2.5 7.5H34l-6 4.5 2.5 7.5L24 23l-6.5 4.5 2.5-7.5-6-4.5h7.5L24 8z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M14 36h20" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M18 40h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
