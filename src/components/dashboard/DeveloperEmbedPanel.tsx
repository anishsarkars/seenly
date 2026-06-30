'use client';

import { useMemo, useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { setProfileEmbedEnabled } from '@/db/actions';
import { btnSecondary, panel } from '@/lib/platform-ui';

interface DeveloperEmbedPanelProps {
  username: string;
  embedEnabled: boolean;
  isPublic: boolean;
  onEmbedEnabledChange: (enabled: boolean) => void;
  onStatus: (message: string, type: 'success' | 'error') => void;
}

export default function DeveloperEmbedPanel({
  username,
  embedEnabled,
  isPublic,
  onEmbedEnabledChange,
  onStatus,
}: DeveloperEmbedPanelProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://seenly.tech').replace(/\/$/, '');
  const embedUrl = `${appUrl}/embed/${username}`;

  const embedCode = useMemo(
    () =>
      `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="720"\n  style="border:0;border-radius:12px;"\n  allow="autoplay; fullscreen"\n  loading="lazy"\n  title="${username} on Seenly"\n></iframe>`,
    [embedUrl, username]
  );

  const handleToggle = async () => {
    const nextValue = !embedEnabled;
    setIsToggling(true);
    const res = await setProfileEmbedEnabled(nextValue);
    setIsToggling(false);

    if (!res.success) {
      onStatus(res.error || 'Could not update embed setting.', 'error');
      return;
    }

    onEmbedEnabledChange(nextValue);
    onStatus(nextValue ? 'Profile embed enabled' : 'Profile embed disabled', 'success');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    onStatus('Embed code copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-white/50" />
            <p className="text-sm font-medium text-white">Developer options</p>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Embed your profile on any website with an iframe. Works even if your main Seenly link is private.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={embedEnabled}
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            embedEnabled ? 'bg-emerald-500/80' : 'bg-white/15'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              embedEnabled ? 'left-[1.35rem]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {embedEnabled && (
        <div className="space-y-3 px-5 py-4">
          {!isPublic && (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
              Your main link at seenly.tech/{username} stays private. Only sites using this embed can show your profile.
            </p>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Embed URL</p>
            <p className="mt-1 break-all font-mono text-xs text-white/70">{embedUrl}</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Embed code</p>
              <button type="button" onClick={handleCopy} className={btnSecondary}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-44 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-white/65">
              {embedCode}
            </pre>
          </div>
        </div>
      )}

      {!embedEnabled && (
        <div className="px-5 py-4">
          <p className="text-xs text-white/40">
            Enable the toggle to generate iframe code for{' '}
            <span className="font-mono text-white/55">seenly.tech/{username}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
