'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  TrendingUp, Play, Download, Eye, Edit3, Film, Settings,
  Globe, Plus, ArrowUpRight, Copy, Check, Sparkles, FileText,
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, X, Smartphone,
} from 'lucide-react';
import { saveOnboardingData } from '@/db/actions';
import { createClient } from '@/utils/supabase/client';
import DeveloperEmbedPanel from '@/components/dashboard/DeveloperEmbedPanel';
import EmailVerifyBanner from '@/components/dashboard/EmailVerifyBanner';
import { hasDeveloperAccess } from '@/lib/developer-access';
import { captureVideoThumbnail, fetchUploadLimits, isPersistedMediaUrl, uploadProfileResume, uploadProfileThumbnail, uploadProfileVideo, validateVideoFile } from '@/lib/storage';
import ProfileLivePreview from '@/components/profile/ProfileLivePreview';
import type { ProfileViewData } from '@/components/profile/ProfileView';
import AvatarPicker from '@/components/profile/AvatarPicker';
import WhatsNewPanel from '@/components/dashboard/WhatsNewPanel';
import { useDashboardSidebar } from '@/components/dashboard/useDashboardSidebar';
import { useDashboardPreview } from '@/components/dashboard/useDashboardPreview';
import SeenlyLogo from '@/components/SeenlyLogo';
import BillingPanel from '@/components/billing/BillingPanel';
import BillingSuccessOverlay from '@/components/billing/BillingSuccessOverlay';
import PlanBadge from '@/components/billing/PlanBadge';
import ProfileCustomizePanel from '@/components/dashboard/ProfileCustomizePanel';
import {
  parseProfileSectionOrder,
  parseProfileTheme,
  type ProfileSectionId,
  type ProfileTheme,
} from '@/lib/profile-customization';
import { formatVideoDurationLimit, formatUploadLimit } from '@/lib/video-limits';
import { getEntitlements, getTrialDaysRemaining, isTrialing, getEffectiveTier } from '@/lib/plans';
import { PLAN_PRICES } from '@/lib/plan-marketing';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { isPaymentFailureStatus, isPaymentSuccessStatus } from '@/lib/billing-return';
import { resolveProfileAvatarSelection } from '@/lib/profile-avatars';
import { hasUnreadUpdates, SEENLY_UPDATES_VERSION } from '@/lib/seenly-updates';
import { btnPrimary, btnSecondary, input, muted, panel, sectionTitle, shell } from '@/lib/platform-ui';
import ActionStatus, { LoadingLabel, type ActionStatusState } from '@/components/ui/ActionStatus';
import { useRouter, useSearchParams } from 'next/navigation';

interface DashboardClientProps {
  initialProfile: any;
  initialAnalytics: any;
}

const WHATS_NEW_STORAGE_KEY = 'seenly-whats-new-seen';

const TAB_META = {
  analytics: { label: 'Performance', icon: TrendingUp },
  edit: { label: 'Profile', icon: Edit3 },
  video: { label: 'Video & style', icon: Film },
  settings: { label: 'Settings', icon: Settings },
} as const;

export default function DashboardClient({ initialProfile, initialAnalytics }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<'analytics' | 'edit' | 'video' | 'settings'>(
    initialTab === 'settings' || initialTab === 'edit' || initialTab === 'video' ? initialTab : 'analytics'
  );
  const [profile, setProfile] = useState(initialProfile);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isRegeneratingThumbnail, setIsRegeneratingThumbnail] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatusState>(null);
  const [hasUnreadWhatsNew, setHasUnreadWhatsNew] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [billingSuccessPlan, setBillingSuccessPlan] = useState<'pro' | 'founder' | null>(null);
  const sidebar = useDashboardSidebar();
  const preview = useDashboardPreview();
  const entitlements = useMemo(
    () =>
      getEntitlements({
        plan: profile?.user?.plan,
        planStatus: profile?.user?.planStatus,
        planExpiresAt: profile?.user?.planExpiresAt,
        isFounder: profile?.user?.isFounder,
      }),
    [profile?.user?.plan, profile?.user?.planStatus, profile?.user?.planExpiresAt, profile?.user?.isFounder]
  );
  const canUseDeveloperOptions = useMemo(
    () => hasDeveloperAccess(profile?.user?.email),
    [profile?.user?.email]
  );

  useEffect(() => {
    const lastSeen = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
    setHasUnreadWhatsNew(hasUnreadUpdates(lastSeen));
  }, []);

  // Always load fresh plan limits from the database (SSR profile can be stale after payment).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/billing/entitlements', { credentials: 'same-origin' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || !data.plan) return;
        setProfile((prev: typeof initialProfile) => {
          if (!prev?.user) return prev;
          return {
            ...prev,
            user: {
              ...prev.user,
              plan: data.plan,
              planStatus: data.planStatus,
              planExpiresAt: data.planExpiresAt,
              isFounder: data.isFounder,
            },
          };
        });
      } catch {
        // keep SSR profile
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm storage limit sync when user opens the video tab (raises 50 MB cap if token is set).
  useEffect(() => {
    if (activeTab !== 'video') return;
    fetch('/api/storage/sync', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (!whatsNewOpen) return;
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, SEENLY_UPDATES_VERSION);
    setHasUnreadWhatsNew(false);
  }, [whatsNewOpen]);

  useEffect(() => {
    if (!mobilePreviewOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobilePreviewOpen]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    const plan = searchParams.get('plan');
    const paymentStatus = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const subscriptionId = searchParams.get('subscription_id');

    if (!billing) return;

    setActiveTab('settings');
    const clearBillingParams = () => router.replace('/dashboard?tab=settings', { scroll: false });

    if (billing === 'cancelled') {
      setActionStatus({
        type: 'error',
        message: 'Payment cancelled. No charges were made.',
      });
      clearBillingParams();
      return;
    }

    if (billing === 'failed' || isPaymentFailureStatus(paymentStatus)) {
      setActionStatus({
        type: 'error',
        message: 'Payment did not go through. You can try again anytime.',
      });
      clearBillingParams();
      return;
    }

    const isPaidPlan = plan === 'pro' || plan === 'founder';
    const isSuccessFlow =
      isPaidPlan &&
      (billing === 'success' ||
        (billing === 'return' &&
          (!paymentStatus || isPaymentSuccessStatus(paymentStatus))));

    if (!isSuccessFlow) {
      if (billing === 'return') {
        setActionStatus({
          type: 'error',
          message: 'Payment was not completed.',
        });
        clearBillingParams();
      }
      return;
    }

    setBillingSuccessPlan(plan);
    setActionStatus({ type: 'loading', message: 'Confirming your payment…' });

    (async () => {
      try {
        const syncBody = { plan, paymentId, subscriptionId, status: paymentStatus };
        const res = await fetch('/api/billing/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(syncBody),
        });
        const data = await res.json().catch(() => ({}));
        if (data.profile) {
          setProfile(data.profile);
          setActionStatus({ type: 'success', message: 'Payment confirmed — your plan is active.' });
        } else if (res.status === 202) {
          await new Promise((r) => setTimeout(r, 2500));
          const retry = await fetch('/api/billing/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(syncBody),
          });
          const retryData = await retry.json().catch(() => ({}));
          if (retryData.profile) {
            setProfile(retryData.profile);
            setActionStatus({ type: 'success', message: 'Payment confirmed — your plan is active.' });
          } else {
            setActionStatus({
              type: 'success',
              message: 'Payment received. Your plan will activate in a moment.',
            });
          }
        } else {
          setActionStatus({
            type: 'success',
            message: 'Payment received. Your plan will activate in a moment.',
          });
        }
      } catch {
        setActionStatus({
          type: 'success',
          message: 'Payment received. Your plan will activate in a moment.',
        });
      }
    })();

    clearBillingParams();
  }, [searchParams, router]);

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
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>(() =>
    parseProfileTheme(profile?.user?.profileTheme)
  );
  const [profileSectionOrder, setProfileSectionOrder] = useState<ProfileSectionId[]>(() =>
    parseProfileSectionOrder(profile?.user?.profileSectionOrder)
  );

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
      profileTheme,
      profileSectionOrder: JSON.stringify(profileSectionOrder),
    },
    experiences,
    projects,
    socials,
  }), [profile, fullName, headline, location, bio, avatar, experiences, projects, socials, profileTheme, profileSectionOrder]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${profile?.user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setActionStatus({ type: 'loading', message: 'Saving profile…' });
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
      setActionStatus({ type: 'success', message: 'Profile saved' });
    } else if (res.error) {
      setActionStatus({ type: 'error', message: res.error });
    } else {
      setActionStatus(null);
    }
  };

  const handleVideoReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.user?.id) return;

    const limits = await fetchUploadLimits();
    if (file.size > limits.maxUploadBytes) {
      setActionStatus({
        type: 'error',
        message: `Video must be ${formatUploadLimit(limits.maxUploadBytes)} or smaller on your plan.`,
      });
      e.target.value = '';
      return;
    }
    const validation = await validateVideoFile(file, limits.maxVideoSec, limits.maxUploadBytes);
    if (!validation.ok) {
      setActionStatus({ type: 'error', message: validation.error });
      e.target.value = '';
      return;
    }
    setIsUploadingVideo(true);
    setActionStatus({ type: 'loading', message: 'Uploading video…' });
    try {
      const previewUrl = URL.createObjectURL(file);
      const videoUrl = await uploadProfileVideo(
        file,
        file.name,
        limits,
        (percent) => {
          setActionStatus({ type: 'loading', message: `Uploading video… ${percent}%` });
        }
      );
      let thumbnailUrl = profile.user.thumbnailUrl;
      try {
        const thumbnailBlob = await captureVideoThumbnail(previewUrl);
        thumbnailUrl = await uploadProfileThumbnail(thumbnailBlob);
      } catch (thumbErr) {
        console.warn('Thumbnail upload skipped:', thumbErr);
      }
      URL.revokeObjectURL(previewUrl);
      const saveRes = await saveOnboardingData(profile.user.id, {
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
      if (!saveRes?.success) {
        throw new Error(saveRes?.error || 'Video uploaded but profile could not be saved.');
      }
      setProfile({ ...profile, user: { ...profile.user, videoUrl, thumbnailUrl } });
      setActionStatus({ type: 'success', message: 'Video updated' });
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Failed to upload video.' });
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleRegenerateThumbnail = async () => {
    const videoUrl = profile?.user?.videoUrl;
    if (!videoUrl || !profile?.user?.id || !isPersistedMediaUrl(videoUrl)) return;

    setIsRegeneratingThumbnail(true);
    setActionStatus({ type: 'loading', message: 'Updating thumbnail…' });
    try {
      const thumbnailBlob = await captureVideoThumbnail(videoUrl);
      const thumbnailUrl = await uploadProfileThumbnail(thumbnailBlob);
      const saveRes = await saveOnboardingData(profile.user.id, {
        username: profile.user.username,
        email: profile.user.email,
        fullName: profile.user.fullName,
        headline: profile.user.headline,
        location: profile.user.location,
        bio: profile.user.bio,
        videoUrl: profile.user.videoUrl,
        thumbnailUrl,
        resumeUrl: profile.user.resumeUrl,
        experiences: profile.experiences,
        projects: profile.projects,
        socials: profile.socials,
      });
      if (!saveRes?.success) {
        throw new Error(saveRes?.error || 'Thumbnail updated but profile could not be saved.');
      }
      setProfile({ ...profile, user: { ...profile.user, thumbnailUrl } });
      setActionStatus({ type: 'success', message: 'Thumbnail updated to match your video' });
    } catch (err: any) {
      setActionStatus({
        type: 'error',
        message: err.message || 'Could not update thumbnail. Try re-uploading your video.',
      });
    } finally {
      setIsRegeneratingThumbnail(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.user?.id) return;

    setIsUploadingResume(true);
    setActionStatus({ type: 'loading', message: 'Uploading resume…' });

    try {
      const resumeUrl = await uploadProfileResume(file);
      const res = await saveOnboardingData(profile.user.id, {
        username: profile.user.username,
        email: profile.user.email,
        fullName: profile.user.fullName,
        headline: profile.user.headline,
        location: profile.user.location,
        bio: profile.user.bio,
        videoUrl: profile.user.videoUrl,
        thumbnailUrl: profile.user.thumbnailUrl,
        resumeUrl,
        experiences: profile.experiences,
        projects: profile.projects,
        socials: profile.socials,
      });

      if (!res.success) {
        throw new Error(res.error || 'Could not save resume.');
      }

      setProfile({ ...profile, user: { ...profile.user, resumeUrl } });
      setActionStatus({ type: 'success', message: 'Resume updated' });
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Failed to upload resume.' });
    } finally {
      setIsUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleTogglePrivacy = async () => {
    const nextValue = !profile?.user?.isPublic;
    setIsTogglingPrivacy(true);
    setActionStatus({
      type: 'loading',
      message: nextValue ? 'Making profile public…' : 'Making profile private…',
    });
    const res = await saveOnboardingData(profile.user.id, {
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
    setIsTogglingPrivacy(false);
    if (res.success) {
      setProfile({ ...profile, user: { ...profile.user, isPublic: nextValue } });
      setActionStatus({
        type: 'success',
        message: nextValue ? 'Profile is now public' : 'Profile is now private',
      });
    } else {
      setActionStatus({ type: 'error', message: res.error || 'Could not update visibility.' });
    }
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

  const billingUser = {
    plan: profile?.user?.plan,
    planStatus: profile?.user?.planStatus,
    planExpiresAt: profile?.user?.planExpiresAt,
    isFounder: profile?.user?.isFounder,
  };
  const trialing = isTrialing(billingUser);
  const trialDaysLeft = getTrialDaysRemaining(billingUser);
  const effectiveTier = getEffectiveTier(billingUser);
  const showUpgradeBanner = effectiveTier === 'free' || trialing;

  return (
    <div className={`${shell} flex h-dvh flex-col overflow-hidden`}>
      <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
      <div className="shrink-0 border-b border-white/10 px-4 py-2 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <EmailVerifyBanner />
          </div>
          <ThemeToggle compact className="shrink-0" />
        </div>
      </div>
      {showUpgradeBanner && (
        <div className="shrink-0 border-b border-white/10 bg-white/[0.03] px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/70">
              {trialing
                ? `Pro trial · ${trialDaysLeft ?? 0} day${trialDaysLeft === 1 ? '' : 's'} left`
                : 'Free plan — 30s video, 1 project, watermark. Upgrade for full Pro.'}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              {trialing
                ? `Subscribe · ${PLAN_PRICES.pro.amount}${PLAN_PRICES.pro.period}`
                : `Upgrade to Pro · ${PLAN_PRICES.pro.amount}${PLAN_PRICES.pro.period}`}
            </button>
          </div>
        </div>
      )}
      {billingSuccessPlan && (
        <BillingSuccessOverlay
          plan={billingSuccessPlan}
          onDismiss={() => setBillingSuccessPlan(null)}
          onSignInAgain={async () => {
            setBillingSuccessPlan(null);
            await supabase.auth.signOut();
            router.push('/login?next=/dashboard');
          }}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
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
              </button>
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              <PlanBadge user={billingUser} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className={`${btnSecondary} inline-flex items-center gap-1.5 lg:hidden`}
                aria-label="Open live preview"
              >
                <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
                Preview
              </button>
              {!preview.open && (
                <button
                  type="button"
                  onClick={preview.toggle}
                  className="hidden rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white lg:inline-flex"
                  aria-label="Open preview"
                >
                  <PanelRight className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={handleCopyLink} className={`${btnSecondary} hidden sm:inline-flex`}>
                {copied ? (
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" strokeWidth={1.5} /> Copy link</span>
                )}
              </button>
              <button type="button" onClick={handleCopyLink} className={`${btnSecondary} sm:hidden`} aria-label="Copy link">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
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
            <button
              type="button"
              onClick={toggleWhatsNew}
              className={`relative shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                whatsNewOpen ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              New
              {hasUnreadWhatsNew && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>
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
                      <LoadingLabel loading={isSaving} loadingText="Saving…">
                        Save
                      </LoadingLabel>
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
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={muted}>Resume</p>
                        <p className="mt-1 text-xs text-white/40">
                          Upload a PDF so it shows on your profile.
                        </p>
                      </div>
                      {profile?.user?.resumeUrl && (
                        <a
                          href={profile.user.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-white/55 transition-colors hover:text-white"
                        >
                          View current
                        </a>
                      )}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        id="dash-resume-uploader"
                        onChange={handleResumeUpload}
                        disabled={isUploadingResume}
                      />
                      <label
                        htmlFor="dash-resume-uploader"
                        className={`${btnSecondary} inline-flex cursor-pointer items-center gap-1.5 ${
                          isUploadingResume ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <LoadingLabel loading={isUploadingResume} loadingText="Uploading…">
                          Upload resume
                        </LoadingLabel>
                      </label>
                    </div>
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
                      <div key={idx} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-4">
                        <input type="text" placeholder="Title" value={proj.title} onChange={(e) => { const copy = [...projects]; copy[idx].title = e.target.value; setProjects(copy); }} className={input} />
                        <input type="text" placeholder="Description" value={proj.description} onChange={(e) => { const copy = [...projects]; copy[idx].description = e.target.value; setProjects(copy); }} className={input} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input type="text" placeholder="Project link" value={proj.website || ''} onChange={(e) => { const copy = [...projects]; copy[idx].website = e.target.value; setProjects(copy); }} className={input} />
                          <input type="text" placeholder="GitHub link" value={proj.github || ''} onChange={(e) => { const copy = [...projects]; copy[idx].github = e.target.value; setProjects(copy); }} className={input} />
                        </div>
                        <button type="button" onClick={() => setProjects(projects.filter((_, i) => i !== idx))} className="text-xs text-white/40 hover:text-white">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setProjects([...projects, { title: '', description: '', website: '', github: '' }])} disabled={projects.length >= entitlements.maxProjects} className={`${btnSecondary} inline-flex items-center gap-1.5 disabled:opacity-40`}>
                      <Plus className="h-3.5 w-3.5" /> Add project
                    </button>
                    {projects.length >= entitlements.maxProjects && entitlements.maxProjects !== Number.POSITIVE_INFINITY && (
                      <p className="text-xs text-white/40">
                        Plan limit: {entitlements.maxProjects} projects.{' '}
                        <button type="button" onClick={() => setActiveTab('settings')} className="text-white/60 underline hover:text-white/80">
                          Subscribe
                        </button>
                      </p>
                    )}
                  </div>
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div>
                      <p className={muted}>Social & portfolio links</p>
                      <p className="mt-1 text-xs text-white/40">
                        Shown on your public profile sidebar and contact section.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(
                        [
                          { key: 'email', label: 'Email', placeholder: 'you@email.com', type: 'email' },
                          { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                          { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                          { key: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.com' },
                          { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
                          { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
                        ] as const
                      ).map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-xs font-medium text-white/50">{field.label}</label>
                          <input
                            type={'type' in field ? field.type : 'text'}
                            placeholder={field.placeholder}
                            value={socials[field.key] || ''}
                            onChange={(e) => setSocials({ ...socials, [field.key]: e.target.value })}
                            className={input}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'video' && (
                <div className="space-y-6">
                  <div className={`${panel} space-y-4 p-8 text-center sm:p-10`}>
                    <Film className={`mx-auto h-5 w-5 text-white/40 ${isUploadingVideo ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
                    <p className="text-sm text-white/70">
                      {isUploadingVideo ? 'Uploading your video…' : 'Replace your intro video'}
                    </p>
                    <p className={muted}>MP4 or WEBM · {formatUploadLimit(entitlements.maxUploadBytes)} · {formatVideoDurationLimit(entitlements.maxVideoSec)}</p>
                    <input type="file" accept="video/mp4,video/webm" className="hidden" id="dash-vid-uploader" onChange={handleVideoReplace} disabled={isUploadingVideo} />
                    <label htmlFor="dash-vid-uploader" className={`${btnPrimary} mt-2 inline-block cursor-pointer ${isUploadingVideo ? 'pointer-events-none opacity-50' : ''}`}>
                      <LoadingLabel loading={isUploadingVideo} loadingText="Uploading…">
                        Upload video
                      </LoadingLabel>
                    </label>
                    {profile?.user?.videoUrl && isPersistedMediaUrl(profile.user.videoUrl) && (
                      <button
                        type="button"
                        onClick={handleRegenerateThumbnail}
                        disabled={isUploadingVideo || isRegeneratingThumbnail}
                        className={`${btnSecondary} mt-3 inline-flex items-center gap-1.5 disabled:opacity-50`}
                      >
                        <LoadingLabel loading={isRegeneratingThumbnail} loadingText="Updating…">
                          Sync thumbnail from video
                        </LoadingLabel>
                      </button>
                    )}
                  </div>

                  {entitlements.customProfileLayout && profile?.user?.id && (
                    <ProfileCustomizePanel
                      userId={profile.user.id}
                      initialTheme={parseProfileTheme(profile.user.profileTheme)}
                      initialSectionOrder={parseProfileSectionOrder(profile.user.profileSectionOrder)}
                      onChange={(theme, order) => {
                        setProfileTheme(theme);
                        setProfileSectionOrder(order);
                        setProfile((prev: typeof initialProfile) =>
                          prev?.user
                            ? {
                                ...prev,
                                user: {
                                  ...prev.user,
                                  profileTheme: theme,
                                  profileSectionOrder: JSON.stringify(order),
                                },
                              }
                            : prev
                        );
                      }}
                    />
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <Suspense fallback={<div className={`${panel} p-6 text-sm text-white/45`}>Loading billing…</div>}>
                    <BillingPanel user={profile?.user ?? {}} />
                  </Suspense>

                  {canUseDeveloperOptions && profile?.user?.username && (
                    <DeveloperEmbedPanel
                      username={profile.user.username}
                      embedEnabled={!!profile.user.embedEnabled}
                      isPublic={profile.user.isPublic !== false}
                      onEmbedEnabledChange={(enabled) =>
                        setProfile({
                          ...profile,
                          user: { ...profile.user, embedEnabled: enabled },
                        })
                      }
                      onStatus={(message, type) => setActionStatus({ type, message })}
                    />
                  )}

                  <div className={`${panel} divide-y divide-white/10`}>
                  {[
                    { title: 'Visibility', desc: profile?.user?.isPublic === false ? 'Profile is private' : 'Profile is public', action: (
                      <button
                        type="button"
                        onClick={() => void handleTogglePrivacy()}
                        disabled={isTogglingPrivacy}
                        className={btnSecondary}
                      >
                        <LoadingLabel
                          loading={isTogglingPrivacy}
                          loadingText="Updating…"
                        >
                          {profile?.user?.isPublic === false ? 'Make public' : 'Make private'}
                        </LoadingLabel>
                      </button>
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
                </div>
              )}

            </main>
          </div>

          <div className="shrink-0 border-t border-white/10 px-4 py-3 lg:hidden">
            <p className="truncate text-xs text-white/45" title={profile?.user?.email}>{profile?.user?.email}</p>
            <button type="button" onClick={handleSignOut} className="mt-1 text-xs text-white/40 transition-colors hover:text-white/70">
              Sign out
            </button>
          </div>
          </div>

          {/* Mobile preview — full-screen overlay (no split layout) */}
          {mobilePreviewOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-black lg:hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-sm font-medium text-white">Live preview</span>
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen(false)}
                  className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProfileLivePreview
                profileData={previewProfileData}
                username={profile?.user?.username}
                defaultLayout="mobile"
                alwaysVisible
                panelMode="bottom"
                className="min-h-0 flex-1"
                removeBranding={entitlements.removeBranding}
                showProBadge={entitlements.showProBadge}
                showFounderBadge={entitlements.showFounderBadge}
                profileTheme={profileTheme}
                profileSectionOrder={profileSectionOrder}
              />
            </div>
          )}

          {/* Resizable side preview on desktop */}
          {preview.open && (
            <aside
              className={`relative hidden min-h-0 shrink-0 flex-col overflow-hidden border-l border-white/10 lg:flex ${
                preview.isDragging ? 'transition-none' : 'transition-[width] duration-200'
              }`}
              style={{ width: preview.width }}
            >
              <div className="flex shrink-0 items-center justify-end border-b border-white/10 px-2 py-1.5">
                <button
                  type="button"
                  onClick={preview.toggle}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close preview"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
              <ProfileLivePreview
                profileData={previewProfileData}
                username={profile?.user?.username}
                defaultLayout="mobile"
                alwaysVisible
                panelMode="side"
                className="min-h-0 flex-1"
                removeBranding={entitlements.removeBranding}
                showProBadge={entitlements.showProBadge}
                showFounderBadge={entitlements.showFounderBadge}
                profileTheme={profileTheme}
                profileSectionOrder={profileSectionOrder}
              />
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize preview"
                onMouseDown={preview.onResizeStart}
                className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-white/15 active:bg-white/25"
              />
            </aside>
          )}
        </div>
      </div>

      <WhatsNewPanel open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
    </div>
  );
}
