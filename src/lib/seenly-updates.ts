export const SEENLY_UPDATES_VERSION = '2026-07-01';

export interface SeenlyUpdate {
  id: string;
  date: string;
  title: string;
  description: string;
  tag?: 'new' | 'improved' | 'fix';
  feature?: 'avatars';
}

export const SEENLY_UPDATES: SeenlyUpdate[] = [
  {
    id: 'avatar-minimal',
    date: 'Jul 1, 2026',
    title: 'Minimal profile avatars',
    description:
      'Clean, simple illustrated avatars for your profile. Pick one below or update anytime from Profile.',
    tag: 'new',
    feature: 'avatars',
  },
  {
    id: 'live-preview',
    date: 'Jul 1, 2026',
    title: 'True-to-life live preview',
    description:
      'Dashboard and onboarding previews now mirror your real seenly.tech profile — phone and desktop views included.',
    tag: 'improved',
  },
  {
    id: 'onboarding-live-preview',
    date: 'Jun 30, 2026',
    title: 'Live onboarding preview',
    description:
      'See your public profile update in real time while you build it, with mobile and desktop preview modes.',
    tag: 'improved',
  },
  {
    id: 'video-limits',
    date: 'Jun 2026',
    title: 'Longer intro videos',
    description: 'Record or upload intro videos up to 3 minutes (150MB max).',
    tag: 'improved',
  },
];

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
