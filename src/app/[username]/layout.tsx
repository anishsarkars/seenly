import type { Metadata } from 'next';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://seenly.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
};

export default function ProfileUsernameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
