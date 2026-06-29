import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <h1 className="text-2xl font-bold tracking-tight">Profile not found</h1>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        This username does not exist yet. Claim it and publish your intro in minutes.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        Create your profile
      </Link>
    </div>
  );
}
