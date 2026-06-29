'use client';

import React, { useState } from 'react';
import {
  XAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, Play, Download, Eye, Edit3, Film, Settings,
  Globe, Trash2, Plus, ArrowUpRight, Copy, Check, Save,
} from 'lucide-react';
import { saveOnboardingData } from '@/db/actions';
import { createClient } from '@/utils/supabase/client';
import { captureVideoThumbnail, uploadProfileThumbnail, uploadProfileVideo, validateVideoFile } from '@/lib/storage';
import ProfileCardPreview from '@/components/profile/ProfileCardPreview';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { formatVideoDurationLimit } from '@/lib/video-limits';
import { resolveProfileAvatarSelection } from '@/lib/profile-avatars';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialProfile: any;
  initialAnalytics: any;
}

const TAB_META = {
  analytics: { label: 'Performance', icon: TrendingUp },
  edit: { label: 'Profile', icon: Edit3 },
  video: { label: 'Video', icon: Film },
  settings: { label: 'Settings', icon: Settings },
} as const;

const inputClass =
  'w-full rounded-full bg-white/[0.04] px-4 py-2.5 text-sm text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 focus:bg-white/[0.07]';
const btnGhost =
  'rounded-full px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-200';
const btnPrimary =
  'rounded-full bg-white/[0.1] px-4 py-2 text-sm text-neutral-100 transition-colors hover:bg-white/[0.14] disabled:opacity-40';
const serif = '[font-family:var(--font-dashboard-serif)]';

export default function DashboardClient({ initialProfile, initialAnalytics }: DashboardClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'analytics' | 'edit' | 'video' | 'settings'>('analytics');
  const [profile, setProfile] = useState(initialProfile);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [fullName, setFullName] = useState(profile?.user?.fullName || profile?.user?.username || '');
  const [headline, setHeadline] = useState(profile?.user?.headline || '');
  const [location, setLocation] = useState(profile?.user?.location || '');
  const [bio, setBio] = useState(profile?.user?.bio || '');
  const [avatar, setAvatar] = useState<string>(() => resolveProfileAvatarSelection(profile?.user?.avatar));

  const [experiences, setExperiences] = useState<any[]>(profile?.experiences || []);
  const [projects, setProjects] = useState<any[]>(profile?.projects || []);
  const [socials, setSocials] = useState(profile?.socials || {
    linkedin: '', github: '', portfolio: '', twitter: '', website: '', email: '', phone: '',
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/${profile?.user?.username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await saveOnboardingData(profile?.user?.id, {
      username: profile?.user?.username,
      email: profile?.user?.email,
      fullName,
      headline,
      location,
      bio,
      avatarUrl: avatar,
      videoUrl: profile?.user?.videoUrl,
      resumeUrl: profile?.user?.resumeUrl,
      experiences,
      projects,
      socials,
    });
    setIsSaving(false);
    if (res.success) {
      setProfile({
        ...profile,
        user: { ...profile.user, fullName, headline, location, bio, avatar },
        experiences,
        projects,
        socials,
      });
    }
  };

  const handleVideoReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.user?.id) return;

    if (file.size > 150 * 1024 * 1024) {
      alert('Video must be 150MB or smaller.');
      return;
    }

    const validation = await validateVideoFile(file);
    if (!validation.ok) {
      alert(validation.error);
      return;
    }

    setIsUploadingVideo(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      const videoUrl = await uploadProfileVideo(file, file.name);
      const thumbnailBlob = await captureVideoThumbnail(previewUrl);
      const thumbnailUrl = await uploadProfileThumbnail(thumbnailBlob);
      URL.revokeObjectURL(previewUrl);

      await saveOnboardingData(profile.user.id, {
        username: profile.user.username,
        email: profile.user.email,
        fullName: profile.user.fullName,
        headline: profile.user.headline,
        location: profile.user.location,
        bio: profile.user.bio,
        videoUrl,
        thumbnailUrl,
        resumeUrl: profile.user.resumeUrl,
        experiences: profile.experiences,
        projects: profile.projects,
        socials: profile.socials,
      });

      setProfile({
        ...profile,
        user: { ...profile.user, videoUrl, thumbnailUrl },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to upload video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleTogglePrivacy = async () => {
    const nextValue = !profile?.user?.isPublic;
    await saveOnboardingData(profile.user.id, {
      username: profile.user.username,
      email: profile.user.email,
      fullName: profile.user.fullName,
      headline: profile.user.headline,
      location: profile.user.location,
      bio: profile.user.bio,
      videoUrl: profile.user.videoUrl,
      thumbnailUrl: profile.user.thumbnailUrl,
      resumeUrl: profile.user.resumeUrl,
      experiences: profile.experiences,
      projects: profile.projects,
      socials: profile.socials,
      isPublic: nextValue,
    });
    setProfile({
      ...profile,
      user: { ...profile.user, isPublic: nextValue },
    });
  };

  const NavButton = ({ tab }: { tab: keyof typeof TAB_META }) => {
    const { label, icon: Icon } = TAB_META[tab];
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          active ? 'bg-white/[0.06] text-neutral-100' : 'text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-white/[0.06] bg-[#0f0f0f] lg:flex">
        <div className="px-5 py-6">
          <a href="/" className="text-sm text-neutral-400 lowercase tracking-normal hover:text-neutral-200">
            seenly
          </a>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          <NavButton tab="analytics" />
          <NavButton tab="edit" />
          <NavButton tab="video" />
          <NavButton tab="settings" />
        </nav>

        <div className="mt-auto border-t border-white/[0.06] p-4">
          <ProfileCardPreview
            username={profile?.user?.username}
            fullName={fullName}
            headline={headline}
            location={location}
            bio={bio}
            videoUrl={profile?.user?.videoUrl}
            thumbnailUrl={profile?.user?.thumbnailUrl}
            avatar={avatar}
          />
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="truncate text-[11px] text-neutral-600">{profile?.user?.email}</p>
            <button type="button" onClick={handleSignOut} className="shrink-0 text-[11px] text-neutral-500 hover:text-neutral-300">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5 lg:px-10">
          <h1 className={`${serif} text-2xl font-normal text-neutral-100`}>
            {TAB_META[activeTab].label}
          </h1>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className={btnGhost}>
              {copied ? (
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Copied</span>
              ) : (
                <span className="flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" strokeWidth={1.5} /> Copy link</span>
              )}
            </button>
            <a
              href={`/${profile?.user?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnPrimary} inline-flex items-center gap-1.5`}
            >
              View profile <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4 py-2 lg:hidden">
          {(Object.keys(TAB_META) as Array<keyof typeof TAB_META>).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                activeTab === tab ? 'bg-white/[0.08] text-neutral-200' : 'text-neutral-500'
              }`}
            >
              {TAB_META[tab].label}
            </button>
          ))}
        </div>

        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-3xl space-y-10">

            {activeTab === 'analytics' && (
              <>
                <div className="grid grid-cols-3 gap-6 sm:gap-10">
                  {[
                    { label: 'Views', value: analytics.views, icon: Eye },
                    { label: 'Plays', value: analytics.plays, icon: Play },
                    { label: 'Downloads', value: analytics.downloads, icon: Download },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center gap-1.5 text-sm text-neutral-500">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {label}
                      </div>
                      <p className={`${serif} text-3xl text-neutral-100 sm:text-4xl`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-6 text-sm text-neutral-500">Visitor trends</p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.history}>
                        <XAxis dataKey="date" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#d4d4d4',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#a3a3a3"
                          strokeWidth={1.5}
                          fill="#262626"
                          fillOpacity={0.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid gap-10 sm:grid-cols-2">
                  <div>
                    <p className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
                      <Globe className="h-3.5 w-3.5" strokeWidth={1.5} /> Countries
                    </p>
                    <div className="space-y-3">
                      {analytics.countries.map((c: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-neutral-400">{c.name}</span>
                          <span className="text-neutral-200">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-4 text-sm text-neutral-500">Channels</p>
                    <div className="space-y-3 text-sm">
                      {[
                        ['LinkedIn', '54%'],
                        ['GitHub', '28%'],
                        ['Direct', '18%'],
                      ].map(([name, pct]) => (
                        <div key={name} className="flex justify-between">
                          <span className="text-neutral-400">{name}</span>
                          <span className="text-neutral-200">{pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'edit' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">Edit your public profile</p>
                  <button type="button" onClick={handleSaveProfile} disabled={isSaving} className={btnPrimary}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>

                <AvatarPicker value={avatar} onChange={setAvatar} compact />

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Name', value: fullName, set: setFullName },
                    { label: 'Headline', value: headline, set: setHeadline },
                    { label: 'Location', value: location, set: setLocation },
                    { label: 'Bio', value: bio, set: setBio },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-xs text-neutral-500">{label}</label>
                      <input type="text" value={value} onChange={(e) => set(e.target.value)} className={inputClass} />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  <p className="text-sm text-neutral-500">Experience</p>
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="relative grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                        className="absolute -right-1 -top-1 text-neutral-600 hover:text-neutral-400 sm:hidden"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      {(['company', 'role', 'duration'] as const).map((field) => (
                        <input
                          key={field}
                          type="text"
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          value={exp[field]}
                          onChange={(e) => {
                            const copy = [...experiences];
                            copy[idx][field] = e.target.value;
                            setExperiences(copy);
                          }}
                          className={inputClass}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                        className="hidden text-neutral-600 hover:text-neutral-400 sm:col-span-3 sm:flex sm:justify-end"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setExperiences([...experiences, { company: '', role: '', duration: '' }])}
                    className={`${btnGhost} flex items-center gap-1.5`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Add row
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <p className="text-sm text-neutral-500">Projects</p>
                  {projects.map((proj, idx) => (
                    <div key={idx} className="relative space-y-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={proj.title}
                        onChange={(e) => {
                          const copy = [...projects];
                          copy[idx].title = e.target.value;
                          setProjects(copy);
                        }}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={proj.description}
                        onChange={(e) => {
                          const copy = [...projects];
                          copy[idx].description = e.target.value;
                          setProjects(copy);
                        }}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                        className="text-neutral-600 hover:text-neutral-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProjects([...projects, { title: '', description: '', website: '', github: '' }])}
                    className={`${btnGhost} flex items-center gap-1.5`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Add project
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Replace your intro video ({formatVideoDurationLimit()}).
                </p>
                <div className="rounded-2xl bg-white/[0.03] px-6 py-14 text-center">
                  <Film className="mx-auto mb-4 h-5 w-5 text-neutral-600" strokeWidth={1.5} />
                  <p className="text-sm text-neutral-400">Choose a new video file</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    MP4 or WEBM · 150MB max · {formatVideoDurationLimit()}
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    id="dash-vid-uploader"
                    onChange={handleVideoReplace}
                  />
                  <label
                    htmlFor="dash-vid-uploader"
                    className={`${btnPrimary} mt-6 inline-block cursor-pointer ${isUploadingVideo ? 'pointer-events-none opacity-40' : ''}`}
                  >
                    {isUploadingVideo ? 'Uploading…' : 'Upload'}
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="divide-y divide-white/[0.06]">
                {[
                  {
                    title: 'Visibility',
                    desc: profile?.user?.isPublic === false ? 'Profile is private' : 'Profile is public',
                    action: (
                      <button type="button" onClick={handleTogglePrivacy} className={btnGhost}>
                        {profile?.user?.isPublic === false ? 'Make public' : 'Make private'}
                      </button>
                    ),
                  },
                  {
                    title: 'Sign out',
                    desc: 'End session on this device',
                    action: (
                      <button type="button" onClick={handleSignOut} className={btnGhost}>
                        Sign out
                      </button>
                    ),
                  },
                  {
                    title: 'Delete account',
                    desc: 'Permanently remove profile and uploads',
                    action: (
                      <button type="button" className={`${btnGhost} text-neutral-500 hover:text-red-400/90`}>
                        Delete
                      </button>
                    ),
                  },
                ].map(({ title, desc, action }) => (
                  <div key={title} className="flex items-center justify-between gap-4 py-5 first:pt-0">
                    <div>
                      <p className="text-sm text-neutral-200">{title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{desc}</p>
                    </div>
                    {action}
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
