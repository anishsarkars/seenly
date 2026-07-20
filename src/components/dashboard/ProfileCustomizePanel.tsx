'use client';

import React, { useState } from 'react';
import { GripVertical, Loader2, Sparkles } from 'lucide-react';
import {
  DEFAULT_PROFILE_SECTION_ORDER,
  PROFILE_SECTION_LABELS,
  PROFILE_THEME_META,
  PROFILE_THEMES,
  type ProfileSectionId,
  type ProfileTheme,
  serializeProfileSectionOrder,
} from '@/lib/profile-customization';
import { saveProfileCustomization } from '@/db/actions';
import { btnPrimary, btnSecondary, panel, muted } from '@/lib/platform-ui';

type ProfileCustomizePanelProps = {
  userId: string;
  initialTheme: ProfileTheme;
  initialSectionOrder: ProfileSectionId[];
  onChange: (theme: ProfileTheme, sectionOrder: ProfileSectionId[]) => void;
};

export default function ProfileCustomizePanel({
  userId,
  initialTheme,
  initialSectionOrder,
  onChange,
}: ProfileCustomizePanelProps) {
  const [theme, setTheme] = useState<ProfileTheme>(initialTheme);
  const [sectionOrder, setSectionOrder] = useState<ProfileSectionId[]>(initialSectionOrder);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const applyChange = (nextTheme: ProfileTheme, nextOrder: ProfileSectionId[]) => {
    setTheme(nextTheme);
    setSectionOrder(nextOrder);
    onChange(nextTheme, nextOrder);
  };

  const handleTheme = (next: ProfileTheme) => {
    applyChange(next, sectionOrder);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= sectionOrder.length || to >= sectionOrder.length) {
      return;
    }
    const next = [...sectionOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    applyChange(theme, next);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const res = await saveProfileCustomization(userId, {
      profileTheme: theme,
      profileSectionOrder: serializeProfileSectionOrder(sectionOrder),
    });
    setSaving(false);
    setStatus(res.success ? 'Saved — live on your profile.' : res.error || 'Save failed.');
  };

  return (
    <div className={`${panel} space-y-6 p-6 text-left`}>
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-white">Customize your page</p>
          <p className={muted}>Final boss — pick light or dark, and drag sections below the video.</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Page style</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILE_THEMES.map((id) => {
            const meta = PROFILE_THEME_META[id];
            const active = theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTheme(id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? 'border-amber-400/40 bg-amber-400/5 ring-1 ring-amber-400/20'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <p className="text-sm font-medium text-white">{meta.label}</p>
                <p className="mt-1 text-xs text-white/45">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Section order
        </p>
        <p className="text-xs text-white/40">Video stays on top. Drag the rest.</p>
        <ul className="space-y-2">
          {sectionOrder.map((id, index) => (
            <li
              key={id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 active:cursor-grabbing ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-white/30" />
              <span className="text-sm text-white/80">{PROFILE_SECTION_LABELS[id]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </span>
          ) : (
            'Save customization'
          )}
        </button>
        <button
          type="button"
          onClick={() => applyChange('minimal', [...DEFAULT_PROFILE_SECTION_ORDER])}
          className={btnSecondary}
        >
          Reset
        </button>
        {status && <p className="text-xs text-white/50">{status}</p>}
      </div>
    </div>
  );
}
