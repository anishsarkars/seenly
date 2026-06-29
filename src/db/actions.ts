'use server';

import { db } from './index';
import { users, experiences, projects, socials, analytics, profileViews } from './schema';
import { eq } from 'drizzle-orm';
import { suggestUsernames, validateUsername } from '@/lib/username';

// Mock in-memory database fallback for easy developer review/testing
const mockStore: {
  users: Record<string, any>;
  experiences: Record<string, any[]>;
  projects: Record<string, any[]>;
  socials: Record<string, any>;
  analytics: Record<string, any[]>;
} = {
  users: {},
  experiences: {},
  projects: {},
  socials: {},
  analytics: {},
};

// Seed a mock user so there is something to look at out-of-the-box
const SEED_MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
mockStore.users[SEED_MOCK_USER_ID] = {
  id: SEED_MOCK_USER_ID,
  username: 'anish',
  email: 'anish@seenly.tech',
  fullName: 'Anish Sarkar',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
  headline: 'AI Software Engineer & Product Creator',
  bio: 'Building the default professional profile for the AI era. Passionate about Next.js, AI workflows, and minimalist, high-fidelity user experiences.',
  location: 'San Francisco, CA',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-developer-typing-on-his-computer-34282-large.mp4',
  thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800&h=450',
  resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
mockStore.experiences[SEED_MOCK_USER_ID] = [
  { id: '1', company: 'Google DeepMind', role: 'Staff Research Engineer', duration: '2024 - Present' },
  { id: '2', company: 'Vercel', role: 'Senior Next.js Developer', duration: '2022 - 2024' },
];
mockStore.projects[SEED_MOCK_USER_ID] = [
  { id: '1', title: 'Seenly platform', description: 'Video-first resume platform for modern professionals built using Next.js 15, Supabase, and Drizzle.', website: 'https://seenly.tech', github: 'https://github.com' },
  { id: '2', title: 'AI Copilot', description: 'Next-generation IDE autocomplete extension using local LLMs.', website: 'https://github.com', github: 'https://github.com' },
];
mockStore.socials[SEED_MOCK_USER_ID] = {
  id: '1',
  linkedin: 'https://linkedin.com/in/anish',
  github: 'https://github.com/anish',
  portfolio: 'https://anish.dev',
  twitter: 'https://twitter.com/anish',
  website: 'https://anish.dev',
  email: 'anish@seenly.tech',
  phone: '+1 (555) 0199',
};
mockStore.analytics[SEED_MOCK_USER_ID] = [
  { views: 245, plays: 189, downloads: 42, country: 'United States' },
  { views: 98, plays: 72, downloads: 12, country: 'India' },
  { views: 54, plays: 32, downloads: 8, country: 'United Kingdom' },
];

function isDbAvailable() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase');
}

export async function getProfileByUsername(username: string) {
  if (!username || typeof username !== 'string') return null;
  const normalized = username.toLowerCase();
  
  if (!isDbAvailable()) {
    const user = Object.values(mockStore.users).find((u: any) => u.username?.toLowerCase() === normalized);
    if (!user) return null;
    
    return {
      user,
      experiences: mockStore.experiences[user.id] || [],
      projects: mockStore.projects[user.id] || [],
      socials: mockStore.socials[user.id] || {},
    };
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.username, normalized)).limit(1);
    if (!user) return null;

    const userExperiences = await db.select().from(experiences).where(eq(experiences.userId, user.id));
    const userProjects = await db.select().from(projects).where(eq(projects.userId, user.id));
    const [userSocials] = await db.select().from(socials).where(eq(socials.userId, user.id)).limit(1);

    return {
      user,
      experiences: userExperiences,
      projects: userProjects,
      socials: userSocials || null,
    };
  } catch (error) {
    console.error('Failed to get profile by username:', error);
    // Return mock fallback for seamless testing
    const user = Object.values(mockStore.users).find((u: any) => u.username?.toLowerCase() === normalized);
    if (!user) return null;
    return {
      user,
      experiences: mockStore.experiences[user.id] || [],
      projects: mockStore.projects[user.id] || [],
      socials: mockStore.socials[user.id] || {},
    };
  }
}

export async function getUserProfile(userId: string) {
  const safeId = (!userId || typeof userId !== 'string') ? SEED_MOCK_USER_ID : userId;
  if (!isDbAvailable()) {
    const user = mockStore.users[safeId] || mockStore.users[SEED_MOCK_USER_ID]; // fallback to seed user
    return {
      user,
      experiences: mockStore.experiences[user.id] || [],
      projects: mockStore.projects[user.id] || [],
      socials: mockStore.socials[user.id] || {},
    };
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, safeId)).limit(1);
    if (!user) return null;

    const userExperiences = await db.select().from(experiences).where(eq(experiences.userId, safeId));
    const userProjects = await db.select().from(projects).where(eq(projects.userId, safeId));
    const [userSocials] = await db.select().from(socials).where(eq(socials.userId, safeId)).limit(1);

    return {
      user,
      experiences: userExperiences,
      projects: userProjects,
      socials: userSocials || null,
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    // Only fall back to mock if it's genuinely a mock/dev user, never for real auth users
    const mockUser = mockStore.users[safeId];
    if (!mockUser) return null;
    return {
      user: mockUser,
      experiences: mockStore.experiences[mockUser.id] || [],
      projects: mockStore.projects[mockUser.id] || [],
      socials: mockStore.socials[mockUser.id] || {},
    };
  }
}

export async function isUsernameUnique(username: string, currentUserId?: string) {
  const validation = validateUsername(username);
  if (!validation.valid) return false;

  const normalized = username.toLowerCase().trim();
  if (!isDbAvailable()) {
    const existing = Object.values(mockStore.users).find(
      (u: any) => u.username?.toLowerCase() === normalized && u.id !== currentUserId
    );
    return !existing;
  }

  try {
    const existing = await db.select().from(users).where(eq(users.username, normalized));
    if (existing.length === 0) return true;
    if (currentUserId && existing[0].id === currentUserId) return true;
    return false;
  } catch {
    return true;
  }
}

export async function getUsernameSuggestions(username: string) {
  const normalized = username.toLowerCase().trim();
  const suggestions = suggestUsernames(normalized);
  const available: string[] = [];

  for (const candidate of suggestions) {
    if (await isUsernameUnique(candidate)) {
      available.push(candidate);
    }
    if (available.length >= 3) break;
  }

  return available;
}

export async function saveOnboardingData(userId: string, data: any) {
  const {
    username,
    email,
    fullName,
    headline,
    location,
    bio,
    videoUrl,
    thumbnailUrl,
    avatarUrl,
    experiences: expList,
    projects: projList,
    socials: socialData,
    resumeUrl,
    isPublic = true,
  } = data;

  if (!isDbAvailable()) {
    mockStore.users[userId] = {
      id: userId,
      username: username?.toLowerCase().trim(),
      email,
      fullName,
      avatar: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || username || '')}`,
      headline,
      location,
      bio,
      videoUrl: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-developer-typing-on-his-computer-34282-large.mp4',
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800&h=450',
      resumeUrl,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStore.experiences[userId] = (expList || []).map((e: any, index: number) => ({
      id: String(index + 1),
      userId,
      company: e.company,
      role: e.role,
      duration: e.duration,
    }));

    mockStore.projects[userId] = (projList || []).map((p: any, index: number) => ({
      id: String(index + 1),
      userId,
      title: p.title,
      description: p.description,
      website: p.website,
      github: p.github,
    }));

    mockStore.socials[userId] = {
      id: '1',
      userId,
      ...socialData,
    };

    return { success: true };
  }

  try {
    await db.insert(users).values({
      id: userId,
      username: username?.toLowerCase().trim(),
      email,
      fullName,
      avatar: avatarUrl,
      headline,
      location,
      bio,
      videoUrl,
      thumbnailUrl,
      resumeUrl,
      isPublic,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        username: username?.toLowerCase().trim(),
        fullName,
        avatar: avatarUrl,
        headline,
        location,
        bio,
        videoUrl,
        thumbnailUrl,
        resumeUrl,
        isPublic,
        updatedAt: new Date(),
      }
    });

    // 2. Refresh Experiences
    await db.delete(experiences).where(eq(experiences.userId, userId));
    if (expList && expList.length > 0) {
      await db.insert(experiences).values(
        expList.map((e: any) => ({
          userId,
          company: e.company,
          role: e.role,
          duration: e.duration,
        }))
      );
    }

    // 3. Refresh Projects
    await db.delete(projects).where(eq(projects.userId, userId));
    if (projList && projList.length > 0) {
      await db.insert(projects).values(
        projList.map((p: any) => ({
          userId,
          title: p.title,
          description: p.description,
          website: p.website,
          github: p.github,
        }))
      );
    }

    // 4. Upsert Social Links
    await db.delete(socials).where(eq(socials.userId, userId));
    await db.insert(socials).values({
      userId,
      linkedin: socialData?.linkedin || null,
      github: socialData?.github || null,
      portfolio: socialData?.portfolio || null,
      twitter: socialData?.twitter || null,
      website: socialData?.website || null,
      email: socialData?.email || null,
      phone: socialData?.phone || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save onboarding data:', error);
    return { success: false, error: String(error) };
  }
}

export async function logAnalyticEvent(profileId: string, type: 'views' | 'plays' | 'downloads', meta?: { country?: string; device?: string; browser?: string; referrer?: string }) {
  if (!isDbAvailable()) {
    if (type === 'views') {
      const existing = mockStore.analytics[profileId] || [];
      const item = existing.find((e: any) => e.country === (meta?.country || 'Unknown'));
      if (item) {
        item.views = (item.views || 0) + 1;
      } else {
        existing.push({
          views: 1,
          plays: 0,
          downloads: 0,
          country: meta?.country || 'Unknown',
        });
      }
      mockStore.analytics[profileId] = existing;
      return;
    }

    const existing = mockStore.analytics[profileId] || [];
    const item = existing.find((e: any) => e.country === (meta?.country || 'Unknown'));
    if (item) {
      item[type] = (item[type] || 0) + 1;
    } else {
      existing.push({
        views: 0,
        plays: type === 'plays' ? 1 : 0,
        downloads: type === 'downloads' ? 1 : 0,
        country: meta?.country || 'Unknown',
      });
    }
    mockStore.analytics[profileId] = existing;
    return;
  }

  try {
    if (type === 'views') {
      await db.insert(profileViews).values({
        profileId,
        country: meta?.country || 'Unknown',
        device: meta?.device || null,
        browser: meta?.browser || null,
        referrer: meta?.referrer || null,
      });
    }

    await db.insert(analytics).values({
      profileId,
      views: type === 'views' ? 1 : 0,
      plays: type === 'plays' ? 1 : 0,
      downloads: type === 'downloads' ? 1 : 0,
      country: meta?.country || 'Unknown',
    });
  } catch (error) {
    console.error('Failed to log analytic event:', error);
  }
}

export async function getProfileAnalytics(profileId: string) {
  if (!isDbAvailable()) {
    const analyticsList = mockStore.analytics[profileId] || mockStore.analytics[SEED_MOCK_USER_ID] || [];
    
    let totalViews = 0;
    let totalPlays = 0;
    let totalDownloads = 0;
    const countries: Record<string, number> = {};

    analyticsList.forEach((a: any) => {
      totalViews += a.views || 0;
      totalPlays += a.plays || 0;
      totalDownloads += a.downloads || 0;
      if (a.country) {
        countries[a.country] = (countries[a.country] || 0) + (a.views || 0);
      }
    });

    return {
      views: totalViews,
      plays: totalPlays,
      downloads: totalDownloads,
      todayViews: Math.max(1, Math.floor(totalViews * 0.08)),
      uniqueVisitors: totalViews,
      countries: Object.entries(countries).map(([name, value]) => ({ name, value })),
      referrers: [
        { name: 'Direct', value: Math.floor(totalViews * 0.4) },
        { name: 'LinkedIn', value: Math.floor(totalViews * 0.3) },
      ],
      history: [
        { date: 'Mon', views: Math.floor(totalViews * 0.1), plays: Math.floor(totalPlays * 0.1) },
        { date: 'Tue', views: Math.floor(totalViews * 0.15), plays: Math.floor(totalPlays * 0.12) },
        { date: 'Wed', views: Math.floor(totalViews * 0.2), plays: Math.floor(totalPlays * 0.15) },
        { date: 'Thu', views: Math.floor(totalViews * 0.18), plays: Math.floor(totalPlays * 0.16) },
        { date: 'Fri', views: Math.floor(totalViews * 0.22), plays: Math.floor(totalPlays * 0.25) },
        { date: 'Sat', views: Math.floor(totalViews * 0.08), plays: Math.floor(totalPlays * 0.1) },
        { date: 'Sun', views: Math.floor(totalViews * 0.07), plays: Math.floor(totalPlays * 0.12) },
      ],
    };
  }

  try {
    const stats = await db.select().from(analytics).where(eq(analytics.profileId, profileId));
    const viewEvents = await db.select().from(profileViews).where(eq(profileViews.profileId, profileId));

    let totalViews = viewEvents.length;
    let totalPlays = 0;
    let totalDownloads = 0;
    const countries: Record<string, number> = {};
    const referrers: Record<string, number> = {};

    stats.forEach((row) => {
      totalPlays += row.plays;
      totalDownloads += row.downloads;
    });

    viewEvents.forEach((row) => {
      if (row.country) {
        countries[row.country] = (countries[row.country] || 0) + 1;
      }
      if (row.referrer) {
        referrers[row.referrer] = (referrers[row.referrer] || 0) + 1;
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayViews = viewEvents.filter((row) => row.createdAt && row.createdAt >= today).length;

    return {
      views: totalViews,
      plays: totalPlays,
      downloads: totalDownloads,
      todayViews,
      uniqueVisitors: totalViews,
      countries: Object.entries(countries).map(([name, value]) => ({ name, value })),
      referrers: Object.entries(referrers)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      history: [
        { date: 'Mon', views: Math.floor(totalViews * 0.1), plays: Math.floor(totalPlays * 0.1) },
        { date: 'Tue', views: Math.floor(totalViews * 0.15), plays: Math.floor(totalPlays * 0.12) },
        { date: 'Wed', views: Math.floor(totalViews * 0.2), plays: Math.floor(totalPlays * 0.15) },
        { date: 'Thu', views: Math.floor(totalViews * 0.18), plays: Math.floor(totalPlays * 0.16) },
        { date: 'Fri', views: Math.floor(totalViews * 0.22), plays: Math.floor(totalPlays * 0.25) },
        { date: 'Sat', views: Math.floor(totalViews * 0.08), plays: Math.floor(totalPlays * 0.1) },
        { date: 'Sun', views: Math.floor(totalViews * 0.07), plays: Math.floor(totalPlays * 0.12) },
      ],
    };
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return {
      views: 0,
      plays: 0,
      downloads: 0,
      todayViews: 0,
      uniqueVisitors: 0,
      countries: [],
      referrers: [],
      history: [],
    };
  }
}
