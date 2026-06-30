import { NextResponse } from 'next/server';

/**
 * Legacy route — file bytes no longer pass through Next.js (Vercel ~4.5MB limit).
 * Clients use POST /api/upload/prepare then uploadToSignedUrl on Supabase Storage.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Direct uploads are not supported on this endpoint. Update the app or retry — uploads now go straight to storage.',
    },
    { status: 410 }
  );
}
