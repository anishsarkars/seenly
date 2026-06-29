'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Play, Download, Eye, Edit3, Film, Settings, 
  Map, Globe, Trash2, Plus, ArrowUpRight, Copy, Check, Sparkles, 
  Mail, FileText, MapPin, Save
} from 'lucide-react';
import { saveOnboardingData } from '@/db/actions';
import { createClient } from '@/utils/supabase/client';
import { captureVideoThumbnail, uploadProfileThumbnail, uploadProfileVideo, validateVideoFile } from '@/lib/storage';
import ProfileCardPreview from '@/components/profile/ProfileCardPreview';
import { formatVideoDurationLimit } from '@/lib/video-limits';
import { useRouter } from 'next/navigation';

interface DashboardClientProps {
  initialProfile: any;
  initialAnalytics: any;
}

export default function DashboardClient({ initialProfile, initialAnalytics }: DashboardClientProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'analytics' | 'edit' | 'video' | 'settings'>('analytics');
  const [profile, setProfile] = useState(initialProfile);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Edit form states
  const [fullName, setFullName] = useState(profile?.user?.fullName || profile?.user?.username || '');
  const [headline, setHeadline] = useState(profile?.user?.headline || '');
  const [location, setLocation] = useState(profile?.user?.location || '');
  const [bio, setBio] = useState(profile?.user?.bio || '');
  
  const [experiences, setExperiences] = useState<any[]>(profile?.experiences || []);
  const [projects, setProjects] = useState<any[]>(profile?.projects || []);
  const [socials, setSocials] = useState(profile?.socials || {
    linkedin: '', github: '', portfolio: '', twitter: '', website: '', email: '', phone: ''
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/${profile?.user?.username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const updatedPayload = {
      username: profile?.user?.username,
      email: profile?.user?.email,
      fullName,
      headline,
      location,
      bio,
      videoUrl: profile?.user?.videoUrl,
      resumeUrl: profile?.user?.resumeUrl,
      experiences,
      projects,
      socials
    };

    const res = await saveOnboardingData(profile?.user?.id, updatedPayload);
    setIsSaving(false);
    if (res.success) {
      alert('Profile updated successfully!');
      // Update local state
      setProfile({
        ...profile,
        user: { ...profile.user, fullName, headline, location, bio },
        experiences,
        projects,
        socials
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
      alert('Video updated successfully.');
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

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
      
      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-lg">S</a>
            <span className="h-4 w-[1px] bg-zinc-800" />
            <span className="text-sm font-semibold tracking-tight text-zinc-300">Creator Console</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 border border-zinc-800 hover:bg-zinc-900 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Profile Link'}
            </button>
            <a 
              href={`/${profile?.user?.username}`}
              target="_blank"
              className="bg-white text-black hover:bg-zinc-200 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1"
            >
              View Profile <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Console Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-3 space-y-4">
          <div className="flex lg:flex-col gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-2xl sticky lg:top-24 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide rounded-xl transition-all w-full text-left whitespace-nowrap ${activeTab === 'analytics' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <TrendingUp className="h-4 w-4" /> Performance Stats
          </button>
          <button 
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide rounded-xl transition-all w-full text-left whitespace-nowrap ${activeTab === 'edit' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Edit3 className="h-4 w-4" /> Edit Profile Details
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide rounded-xl transition-all w-full text-left whitespace-nowrap ${activeTab === 'video' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Film className="h-4 w-4" /> Replace Video
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide rounded-xl transition-all w-full text-left whitespace-nowrap ${activeTab === 'settings' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Settings className="h-4 w-4" /> Account Settings
          </button>
          </div>

          <ProfileCardPreview
            username={profile?.user?.username}
            fullName={fullName}
            headline={headline}
            location={location}
            bio={bio}
            videoUrl={profile?.user?.videoUrl}
            thumbnailUrl={profile?.user?.thumbnailUrl}
            avatar={profile?.user?.avatar}
          />
        </nav>

        {/* Dynamic Display Panel */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: PERFORMANCE STATS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Highlight cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-lg space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Total Views</span>
                  <p className="text-3xl font-black">{analytics.views}</p>
                </div>
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-lg space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5"><Play className="h-3.5 w-3.5" /> Video Plays</span>
                  <p className="text-3xl font-black">{analytics.plays}</p>
                </div>
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-lg space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Resume Downloads</span>
                  <p className="text-3xl font-black">{analytics.downloads}</p>
                </div>
              </div>

              {/* Chart widget */}
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Visitor Trends</h3>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.history}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                      <Area type="monotone" dataKey="views" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Geo & Referrals Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Globe className="h-4 w-4" /> Top Countries</h3>
                  <div className="space-y-3">
                    {analytics.countries.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 font-semibold">{c.name}</span>
                        <span className="text-white font-bold">{c.value} views</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Map className="h-4 w-4" /> Traffic Channels</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-semibold">LinkedIn Direct</span>
                      <span className="text-white font-bold">54%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-semibold">GitHub Readme</span>
                      <span className="text-white font-bold">28%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-semibold">Organic / Direct</span>
                      <span className="text-white font-bold">18%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <h2 className="text-lg font-bold">Edit Profile Details</h2>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:border-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Headline</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:border-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Location</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:border-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">Bio</label>
                  <input 
                    type="text" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:border-white outline-none"
                  />
                </div>
              </div>

              {/* Experiences Edit list */}
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Experiences</h3>
                <div className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-3 relative">
                      <button 
                        onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-3 gap-3">
                        <input 
                          type="text" 
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => {
                            const copy = [...experiences];
                            copy[idx].company = e.target.value;
                            setExperiences(copy);
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:border-white outline-none col-span-1"
                        />
                        <input 
                          type="text" 
                          placeholder="Role"
                          value={exp.role}
                          onChange={(e) => {
                            const copy = [...experiences];
                            copy[idx].role = e.target.value;
                            setExperiences(copy);
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:border-white outline-none col-span-1"
                        />
                        <input 
                          type="text" 
                          placeholder="Duration"
                          value={exp.duration}
                          onChange={(e) => {
                            const copy = [...experiences];
                            copy[idx].duration = e.target.value;
                            setExperiences(copy);
                          }}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:border-white outline-none col-span-1"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setExperiences([...experiences, { company: '', role: '', duration: '' }])}
                    className="border border-dashed border-zinc-800 hover:border-zinc-700 w-full py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Experience Row
                  </button>
                </div>
              </div>

              {/* Projects Edit list */}
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Key Projects</h3>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-3 relative">
                      <button 
                        onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <input 
                        type="text" 
                        placeholder="Project Name"
                        value={proj.title}
                        onChange={(e) => {
                          const copy = [...projects];
                          copy[idx].title = e.target.value;
                          setProjects(copy);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Project Description"
                        value={proj.description}
                        onChange={(e) => {
                          const copy = [...projects];
                          copy[idx].description = e.target.value;
                          setProjects(copy);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setProjects([...projects, { title: '', description: '', website: '', github: '' }])}
                    className="border border-dashed border-zinc-800 hover:border-zinc-700 w-full py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Project Row
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: REPLACE VIDEO */}
          {activeTab === 'video' && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-6">
              <h2 className="text-lg font-bold">Replace Introduction Video</h2>
              <p className="text-zinc-500 text-xs">Update your intro video ({formatVideoDurationLimit()}). Your old video will be replaced instantly.</p>
              
              <div className="border border-dashed border-zinc-850 hover:border-zinc-800 rounded-2xl p-12 text-center space-y-4 bg-zinc-900/20">
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <Film className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-300">Drag or click to choose a new video</p>
                  <p className="text-xs text-zinc-550">Supports MP4 or WEBM (max 150MB, {formatVideoDurationLimit()})</p>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  id="dash-vid-uploader"
                  onChange={handleVideoReplace}
                />
                <label
                  htmlFor="dash-vid-uploader"
                  className={`inline-block cursor-pointer bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isUploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isUploadingVideo ? 'Uploading...' : 'Upload File'}
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-6">
              <h2 className="text-lg font-bold">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-zinc-900 rounded-xl bg-zinc-900/10">
                  <div>
                    <h3 className="text-sm font-bold">Profile visibility</h3>
                    <p className="text-xs text-zinc-500">
                      {profile?.user?.isPublic === false ? 'Your profile is private.' : 'Your profile is public.'}
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePrivacy}
                    className="border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    {profile?.user?.isPublic === false ? 'Make Public' : 'Make Private'}
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 border border-zinc-900 rounded-xl bg-zinc-900/10">
                  <div>
                    <h3 className="text-sm font-bold">Sign out</h3>
                    <p className="text-xs text-zinc-500">End your session on this device.</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 border border-zinc-900 rounded-xl bg-zinc-900/10">
                  <div>
                    <h3 className="text-sm font-bold">Delete Profile</h3>
                    <p className="text-xs text-zinc-500">Remove your public profile from search directories.</p>
                  </div>
                  <button className="border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                    Deactivate
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 border border-zinc-900 rounded-xl bg-zinc-900/10">
                  <div>
                    <h3 className="text-sm font-bold text-red-400">Delete Account</h3>
                    <p className="text-xs text-zinc-550">Permanently delete your profile and all uploaded video assets.</p>
                  </div>
                  <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

    </div>
  );
}
