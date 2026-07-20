export const PROFILE_THEMES = ['minimal', 'cinema'] as const;
export type ProfileTheme = (typeof PROFILE_THEMES)[number];

export const PROFILE_SECTIONS = ['identity', 'bio', 'experience', 'projects', 'socials'] as const;
export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number];

export const DEFAULT_PROFILE_SECTION_ORDER: ProfileSectionId[] = [
  'identity',
  'bio',
  'experience',
  'projects',
  'socials',
];

export const PROFILE_SECTION_LABELS: Record<ProfileSectionId, string> = {
  identity: 'Name & actions',
  bio: 'About',
  experience: 'Experience',
  projects: 'Projects',
  socials: 'Social links',
};

export const PROFILE_THEME_META: Record<
  ProfileTheme,
  { label: string; description: string }
> = {
  minimal: {
    label: 'Minimal',
    description: 'Bento layout with lime accents and video up front.',
  },
  cinema: {
    label: 'Cinema',
    description: 'Same bento layout with warm amber accents.',
  },
};

export function parseProfileTheme(value?: string | null): ProfileTheme {
  return value === 'cinema' ? 'cinema' : 'minimal';
}

export function parseProfileSectionOrder(raw?: string | null): ProfileSectionId[] {
  if (!raw) return [...DEFAULT_PROFILE_SECTION_ORDER];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_PROFILE_SECTION_ORDER];
    const valid = parsed.filter(
      (id): id is ProfileSectionId =>
        typeof id === 'string' && (PROFILE_SECTIONS as readonly string[]).includes(id)
    );
    const missing = DEFAULT_PROFILE_SECTION_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_PROFILE_SECTION_ORDER];
  }
}

export function serializeProfileSectionOrder(order: ProfileSectionId[]) {
  const seen = new Set<ProfileSectionId>();
  const normalized: ProfileSectionId[] = [];
  for (const id of order) {
    if (!(PROFILE_SECTIONS as readonly string[]).includes(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  for (const id of DEFAULT_PROFILE_SECTION_ORDER) {
    if (!seen.has(id)) normalized.push(id);
  }
  return JSON.stringify(normalized);
}
