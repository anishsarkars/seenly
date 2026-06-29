'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp, Play, Download, Eye, Edit3, Film, Settings,
  Globe, Plus, ArrowUpRight, Copy, Check, Sparkles, ChevronDown,
  PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { saveOnboardingData } from '@/db/actions';
import { createClient } from '@/utils/supabase/client';
import { captureVideoThumbnail, uploadProfileThumbnail, uploadProfileVideo, validateVideoFile } from '@/lib/storage';
import ProfileLivePreview from '@/components/profile/ProfileLivePreview';
import type { ProfileViewData } from '@/components/profile/ProfileView';
import AvatarPicker from '@/components/profile/AvatarPicker';
import WhatsNewPanel from '@/components/dashboard/WhatsNewPanel';
import { useDashboardSidebar } from '@/components/dashboard/useDashboardSidebar';
import SeenlyLogo from '@/components/SeenlyLogo';
import { formatVideoDurationLimit } from '@/lib/video-limits';
import { resolveProfileAvatarSelection } from '@/lib/profile-avatars';
import { hasUnreadUpdates, SEENLY_UPDATES_VERSION } from '@/lib/seenly-updates';
import { btnPrimary, btnSecondary, input, muted, panel, sectionTitle, shell } from '@/lib/platform-ui';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialProfile: any;
  initialAnalytics: any;
}

const WHATS_NEW_STORAGE_KEY = 'seenly-whats-new-seen';

const TAB_META = {
  analytics: { label: 'Performance', icon: TrendingUp },
  edit: { label: 'Profile', icon: Edit3 },
  video: { label: 'Video', icon: Film },
  settings: { label: 'Settings', icon: Settings },
} as const;

export default function DashboardClient({ initialProfile, initialAnalytics }: DashboardClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'analytics' | 'edit' | 'video' | 'settings'>('analytics');
  const [profile, setProfile] = useState(initialProfile);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [hasUnreadWhatsNew, setHasUnreadWhatsNew] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const sidebar = useDashboardSidebar();

  useEffect(() => {
    const lastSeen = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
    setHasUnreadWhatsNew(hasUnreadUpdates(lastSeen));
  }, []);

  useEffect(() => {
    if (!whatsNewOpen) return;
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, SEENLY_UPDATES_VERSION);
    setHasUnreadWhatsNew(false);
  }, [whatsNewOpen]);

  const toggleWhatsNew = () => {
    setWhatsNewOpen((prev) => !prev);
  };

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

  const previewProfileData = useMemo<ProfileViewData>(() => ({
    user: {
      id: profile?.user?.id,
      username: profile?.user?.username,
      fullName,
      headline,
      location,
      bio,
      avatar,
      videoUrl: profile?.user?.videoUrl,
      thumbnailUrl: profile?.user?.thumbnailUrl,
      resumeUrl: profile?.user?.resumeUrl,
    },
    experiences,
    projects,
    socials,
  }), [profile, fullName, headline, location, bio, avatar, experiences, projects, socials]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${profile?.user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const res = await saveOnboardingData(profile?.user?.id, {
      username: profile?.user?.username,
      email: profile?.user?.email,
      fullName, headline, location, bio,
      avatarUrl: avatar,
      videoUrl: profile?.user?.videoUrl,
      resumeUrl: profile?.user?.resumeUrl,
      experiences, projects, socials,
    });
    setIsSaving(false);
    if (res.success) {
      setProfile({
        ...profile,
        user: { ...profile.user, fullName, headline, location, bio, avatar },
        experiences, projects, socials,
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
        videoUrl, thumbnailUrl,
        resumeUrl: profile.user.resumeUrl,
        experiences: profile.experiences,
        projects: profile.projects,
        socials: profile.socials,
      });
      setProfile({ ...profile, user: { ...profile.user, videoUrl, thumbnailUrl } });
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
    setProfile({ ...profile, user: { ...profile.user, isPublic: nextValue } });
  };

  const NavButton = ({ tab }: { tab: keyof typeof TAB_META }) => {
    const { label, icon: Icon } = TAB_META[tab];
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {label}
      </button>
    );
  };

  return (
    <div className={shell}>
      <div className="flex h-dvh max-h-dvh min-w-[680px] overflow-x-auto overflow-y-hidden">
        {/* Nav sidebar — resizable & closable */}
        <aside
          className={`relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-white/10 transition-[width] duration-200 lg:flex ${
            sidebar.isDragging ? 'transition-none' : ''
          }`}
          style={{ width: sidebar.open ? sidebar.width : 0 }}
        >
          <div className="flex h-full w-full min-w-[200px] flex-col">
            <div className="flex shrink-0 items-center justify-between px-4 py-4">
              <SeenlyLogo size="md" />
              <button
                type="button"
                onClick={sidebar.toggle}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 min-h-0">
              <NavButton tab="analytics" />
              <NavButton tab="edit" />
              <NavButton tab="video" />
              <NavButton tab="settings" />

              <button
                type="button"
                onClick={toggleWhatsNew}
                className={`mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  whatsNewOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <span className="relative shrink-0">
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  {hasUnreadWhatsNew && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                  )}
                </span>
                <span className="flex-1 text-left">What&apos;s New</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${whatsNewOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {whatsNewOpen && (
                <div className="max-h-64 overflow-y-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  <WhatsNewPanel
                    compact
                    avatar={avatar}
                    onAvatarChange={setAvatar}
                    onApplyAvatar={handleSaveProfile}
                    isSaving={isSaving}
                  />
                </div>
              )}
            </nav>
            <div className="shrink-0 border-t border-white/10 p-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Account</p>
                <p className="mt-1 truncate text-xs text-white/70" title={profile?.user?.email}>
                  {profile?.user?.email}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-2 text-xs text-white/45 transition-colors hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>

          {sidebar.open && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={sidebar.onResizeStart}
              className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-white/15 active:bg-white/25"
            />
          )}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-[280px] flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {!sidebar.open && (
                <button
                  type="button"
                  onClick={sidebar.toggle}
                  className="hidden rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white lg:inline-flex"
                  aria-label="Open sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}
              <SeenlyLogo size="sm" className="shrink-0 lg:hidden" />
              <h1 className={`${sectionTitle} truncate text-base sm:text-lg`}>{TAB_META[activeTab].label}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={handleCopyLink} className={btnSecondary}>
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
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3 lg:hidden">
            {(Object.keys(TAB_META) as Array<keyof typeof TAB_META>).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-white/50'
                }`}
              >
                {TAB_META[tab].label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <main className="mx-auto min-w-0 w-full max-w-2xl space-y-8">

              {activeTab === 'analytics' && (
                <>
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    {[
                      { label: 'Views', value: analytics.views, icon: Eye },
                      { label: 'Plays', value: analytics.plays, icon: Play },
                      { label: 'Downloads', value: analytics.downloads, icon: Download },
                    ].map(({ label: l, value, icon: Icon }) => (
                      <div key={l} className={`${panel} p-4 sm:p-5`}>
                        <div className={`${muted} mb-2 flex items-center gap-1.5 text-xs`}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {l}
                        </div>
                        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className={panel + ' p-5 sm:p-6'}>
                    <p className={`${muted} mb-5`}>Visitor trends</p>
                    <div className="h-52 w-full sm:h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.history}>
                          <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="views" stroke="#ffffff" strokeWidth={1.5} fill="#ffffff" fillOpacity={0.06} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className={`${panel} p-5`}>
                      <p className={`${muted} mb-4 flex items-center gap-2`}>
                        <Globe className="h-3.5 w-3.5" strokeWidth={1.5} /> Countries
                      </p>
                      <div className="space-y-3 text-sm">
                        {analytics.countries.map((c: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-white/60">{c.name}</span>
                            <span className="text-white">{c.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`${panel} p-5`}>
                      <p className={`${muted} mb-4`}>Channels</p>
                      <div className="space-y-3 text-sm">
                        {[['LinkedIn', '54%'], ['Portfolio', '28%'], ['Direct', '18%']].map(([name, pct]) => (
                          <div key={name} className="flex justify-between">
                            <span className="text-white/60">{name}</span>
                            <span className="text-white">{pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'edit' && (
                <div className={`${panel} space-y-6 p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className={muted}>Edit your public profile</p>
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
                    ].map(({ label: l, value, set }) => (
                      <div key={l} className="space-y-1.5">
                        <label className="text-xs font-medium text-white/50">{l}</label>
                        <input type="text" value={value} onChange={(e) => set(e.target.value)} className={input} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <p className={muted}>Experience</p>
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="grid gap-2 sm:grid-cols-3">
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
                            className={input}
                          />
                        ))}
                        <button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))} className="text-left text-xs text-white/40 hover:text-white sm:col-span-3">
                          Remove row
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setExperiences([...experiences, { company: '', role: '', duration: '' }])} className={`${btnSecondary} inline-flex items-center gap-1.5`}>
                      <Plus className="h-3.5 w-3.5" /> Add row
                    </button>
                  </div>
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <p className={muted}>Projects</p>
                    {projects.map((proj, idx) => (
                      <div key={idx} className="space-y-2">
                        <input type="text" placeholder="Title" value={proj.title} onChange={(e) => { const copy = [...projects]; copy[idx].title = e.target.value; setProjects(copy); }} className={input} />
                        <input type="text" placeholder="Description" value={proj.description} onChange={(e) => { const copy = [...projects]; copy[idx].description = e.target.value; setProjects(copy); }} className={input} />
                        <button type="button" onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="text-xs text-white/40 hover:text-white">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setProjects([...projects, { title: '', description: '', website: '', github: '' }])} className={`${btnSecondary} inline-flex items-center gap-1.5`}>
                      <Plus className="h-3.5 w-3.5" /> Add project
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'video' && (
                <div className={`${panel} space-y-4 p-8 text-center sm:p-10`}>
                  <Film className="mx-auto h-5 w-5 text-white/40" strokeWidth={1.5} />
                  <p className="text-sm text-white/70">Replace your intro video</p>
                  <p className={muted}>MP4 or WEBM · 150MB · {formatVideoDurationLimit()}</p>
                  <input type="file" accept="video/mp4,video/webm" className="hidden" id="dash-vid-uploader" onChange={handleVideoReplace} />
                  <label htmlFor="dash-vid-uploader" className={`${btnPrimary} mt-2 inline-block cursor-pointer ${isUploadingVideo ? 'pointer-events-none opacity-50' : ''}`}>
                    {isUploadingVideo ? 'Uploading…' : 'Upload video'}
                  </label>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className={`${panel} divide-y divide-white/10`}>
                  {[
                    { title: 'Visibility', desc: profile?.user?.isPublic === false ? 'Profile is private' : 'Profile is public', action: (
                      <button type="button" onClick={handleTogglePrivacy} className={btnSecondary}>
                        {profile?.user?.isPublic === false ? 'Make public' : 'Make private'}
                      </button>
                    )},
                    { title: 'Sign out', desc: 'End session on this device', action: (
                      <button type="button" onClick={handleSignOut} className={btnSecondary}>Sign out</button>
                    )},
                    { title: 'Delete account', desc: 'Permanently remove profile and uploads', action: (
                      <button type="button" className={`${btnSecondary} text-red-400/80 hover:text-red-400`}>Delete</button>
                    )},
                  ].map(({ title, desc, action }) => (
                    <div key={title} className="flex items-center justify-between gap-4 px-5 py-4 first:pt-5 last:pb-5">
                      <div>
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="mt-0.5 text-xs text-white/45">{desc}</p>
                      </div>
                      {action}
                    </div>
                  ))}
                </div>
              )}

            </main>
          </div>
          </div>

          {/* Live preview — always visible right column */}
          <aside className="flex min-h-0 w-[clamp(220px,28vw,360px)] shrink-0 border-l border-white/10">
            <ProfileLivePreview
              profileData={previewProfileData}
              username={profile?.user?.username}
              defaultLayout="mobile"
              alwaysVisible
              className="flex-1"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
