import { ImageResponse } from 'next/og';
import { PROFILE_OG_SIZE } from '@/lib/profile-og';

export function renderProfileOgImage({
  handle,
  displayName,
  headline,
}: {
  handle: string;
  displayName: string;
  headline: string;
}) {
  const initials = handle.slice(0, 2).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000000',
          color: '#ffffff',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Seenly</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.12)',
              background: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 760 }}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>{headline}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.45)' }}>seenly.tech/{handle}</span>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)' }}>Watch intro video →</span>
        </div>
      </div>
    ),
    { ...PROFILE_OG_SIZE }
  );
}
