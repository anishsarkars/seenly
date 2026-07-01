'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Video, Camera, Info, Briefcase, FolderGit, Link as LinkIcon, 
  FileText, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, RefreshCw, 
  Play, Square, Sparkles, Upload, Volume2, VolumeX, Shield, UserCheck
} from 'lucide-react';
import { saveOnboardingData, isUsernameUnique, getUserProfile, getUsernameSuggestions } from '@/db/actions';
import { validateUsername } from '@/lib/username';
import {
  captureVideoThumbnail,
  isPersistedMediaUrl,
  uploadProfileResume,
  uploadProfileThumbnail,
  uploadProfileVideo,
  validateVideoFile,
  FREE_VIDEO_LIMITS,
  type VideoUploadLimits,
} from '@/lib/storage';
import { formatVideoDurationLimit, formatUploadLimit } from '@/lib/video-limits';
import { DEFAULT_PROFILE_AVATAR } from '@/lib/profile-avatars';
import AvatarPicker from '@/components/profile/AvatarPicker';
import OnboardingProfilePreview from '@/components/onboarding/OnboardingProfilePreview';
import SeenlyLogo from '@/components/SeenlyLogo';
import Confetti from '@/components/Confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { signInWithGoogle, getAuthCallbackUrl } from '@/lib/auth-client';
import { isEmailVerified } from '@/lib/email-verification';
import { LoadingLabel } from '@/components/ui/ActionStatus';

export default function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Supabase Auth States
  const [supabase] = useState(() => createClient());
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [passwordAuthLoading, setPasswordAuthLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_PROFILE_AVATAR);
  
  // Video states
  const [videoMethod, setVideoMethod] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoLimits, setVideoLimits] = useState<VideoUploadLimits>(FREE_VIDEO_LIMITS);
  
  // Repeatable blocks
  const [experiences, setExperiences] = useState<Array<{ company: string; role: string; duration: string }>>([
    { company: '', role: '', duration: '' }
  ]);
  const [projects, setProjects] = useState<Array<{ title: string; description: string; website: string; github: string }>>([
    { title: '', description: '', website: '', github: '' }
  ]);
  
  // Links
  const [socials, setSocials] = useState({
    linkedin: '',
    github: '',
    portfolio: '',
    twitter: '',
    website: '',
    email: '',
    phone: ''
  });
  
  // Resume PDF state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  
  // Webcam references
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefill username from landing claim bar
  useEffect(() => {
    const prefilled = searchParams.get('username');
    if (!prefilled) return;
    const clean = prefilled.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean) setUsername(clean);
  }, [searchParams]);

  const handleResendVerification = async () => {
    const email = sessionUser?.email;
    if (!email) return;
    setResendLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthSuccessMsg('Verification email sent — check your inbox.');
  };

  const handleRefreshVerification = async () => {
    setAuthError('');
    const { data: { user } } = await supabase.auth.getUser();
    setSessionUser(user);
    if (user && isEmailVerified(user)) {
      setAuthSuccessMsg('Email verified! You can continue.');
      setStep(2);
    } else {
      setAuthError('Email not verified yet. Click the link in your inbox, then try again.');
    }
  };

  // Auth check & state management
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setSessionUser(user);
        setSocials(prev => ({ ...prev, email: user.email || '' }));
        const name = user.user_metadata?.full_name || user.user_metadata?.name;
        if (name) setFullName(prev => prev || name);
        // If user already has a published profile, send them straight to dashboard
        try {
          const existing = await getUserProfile(user.id);
          if (existing?.user?.username) {
            router.replace('/dashboard');
            return;
          }
          const entRes = await fetch('/api/billing/entitlements', { credentials: 'same-origin' });
          if (entRes.ok) {
            const ent = await entRes.json();
            setVideoLimits({
              maxVideoSec: ent.maxVideoSec ?? FREE_VIDEO_LIMITS.maxVideoSec,
              maxUploadBytes: ent.maxUploadBytes ?? FREE_VIDEO_LIMITS.maxUploadBytes,
            });
          }
        } catch {}
        if (isEmailVerified(user)) {
          setStep(2);
        }
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        setSocials(prev => ({ ...prev, email: session.user.email || '' }));
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        if (name) setFullName(prev => prev || name);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (sessionUser && step > 1 && !isEmailVerified(sessionUser)) {
      setStep(1);
    }
  }, [sessionUser, step]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setOauthLoading(true);
    const claimed = searchParams.get('username');
    const nextPath = claimed
      ? `/onboarding?username=${encodeURIComponent(claimed.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}`
      : '/onboarding';
    const { error } = await signInWithGoogle(supabase, nextPath);
    if (error) {
      setAuthError(error.message);
      setOauthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!emailInput || !passwordInput) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      setPasswordAuthLoading(true);
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: {
            emailRedirectTo: getAuthCallbackUrl('/onboarding'),
          },
        });
        if (error) throw error;

        if (data.user) {
          setSessionUser(data.user);
        }

        if (!data.session || !isEmailVerified(data.user)) {
          setAuthSuccessMsg(`Check your email (${emailInput}) to verify your account before continuing.`);
          return;
        }

        setAuthSuccessMsg('Account created! Proceeding to onboarding...');
        setTimeout(() => { setStep(2); }, 800);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });
        if (error) throw error;

        // Check if user already has a published profile → skip onboarding
        const signedInUser = data.user;
        if (signedInUser) {
          try {
            const existing = await getUserProfile(signedInUser.id);
            if (existing?.user?.username) {
              // Redirect to public profile page
              router.replace('/dashboard');
              return;
            }
          } catch {}
        }

        setAuthSuccessMsg('Logged in! Proceeding to setup...');
        setTimeout(() => { setStep(2); }, 800);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setPasswordAuthLoading(false);
    }
  };

  // Validate username
  useEffect(() => {
    if (!username) {
      setUsernameValid(null);
      setUsernameError('');
      setUsernameSuggestions([]);
      return;
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername !== username) {
      setUsername(cleanUsername);
    }

    const validation = validateUsername(cleanUsername);
    if (!validation.valid) {
      setUsernameValid(false);
      setUsernameError(validation.error || 'Invalid username.');
      setUsernameSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const isUnique = await isUsernameUnique(cleanUsername, sessionUser?.id);
      setUsernameValid(isUnique);
      if (!isUnique) {
        setUsernameError('This username is already taken.');
        const suggestions = await getUsernameSuggestions(cleanUsername);
        setUsernameSuggestions(suggestions);
      } else {
        setUsernameError('');
        setUsernameSuggestions([]);
      }
      setCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, sessionUser]);

  // Webcam stream handlers
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => console.log('Video play error:', e));
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setCameraError('Camera or microphone permission was denied. Please check your browser site settings or switch to the "Upload Video" tab.');
      } else {
        setCameraError('Failed to access camera/mic. Please verify that no other application is using it.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraError(null);
  };

  useEffect(() => {
    if (step === 3 && videoMethod === 'record') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, videoMethod]);

  const startRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setRecordTime(0);
    setRecordedBlob(null);

    const options = { mimeType: 'video/webm;codecs=vp9' };
    const chunks: BlobPart[] = [];
    
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch (e) {
      recorder = new MediaRecorder(streamRef.current);
    }
    
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoPreviewUrl(url);
    };

    recorder.start(1000); // chunk every 1s

    timerRef.current = setInterval(() => {
      setRecordTime((prev) => {
        if (prev >= videoLimits.maxVideoSec) {
          stopRecording();
          return videoLimits.maxVideoSec;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file.');
      return;
    }

    const validation = await validateVideoFile(file, videoLimits.maxVideoSec, videoLimits.maxUploadBytes);
    if (!validation.ok) {
      alert(validation.error);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setRecordedBlob(file);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handlePublish = async () => {
    if (!sessionUser?.id) {
      alert('Please sign in before publishing your profile.');
      return;
    }

    if (!isEmailVerified(sessionUser)) {
      alert('Verify your email before publishing your profile. Check your inbox for the confirmation link.');
      return;
    }

    if (!usernameValid || !recordedBlob || !videoPreviewUrl) {
      alert('Please complete your username and intro video before publishing.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      let finalVideoUrl = videoPreviewUrl;
      let finalThumbnailUrl: string | undefined;
      let finalResumeUrl: string | undefined;

      if (recordedBlob && videoPreviewUrl.startsWith('blob:')) {
        setUploadProgress(30);
        finalVideoUrl = await uploadProfileVideo(
          recordedBlob,
          recordedBlob.type.includes('webm') ? 'intro.webm' : 'intro.mp4',
          videoLimits
        );
        setUploadProgress(55);
        try {
          const thumbnail = await captureVideoThumbnail(videoPreviewUrl);
          finalThumbnailUrl = await uploadProfileThumbnail(thumbnail);
        } catch (thumbErr) {
          console.warn('Thumbnail upload skipped:', thumbErr);
        }
      }

      if (!isPersistedMediaUrl(finalVideoUrl)) {
        throw new Error('Video upload failed. Check your connection and try again.');
      }

      if (!finalThumbnailUrl) {
        try {
          finalThumbnailUrl = await uploadProfileThumbnail(
            await captureVideoThumbnail(finalVideoUrl)
          );
        } catch (thumbErr) {
          console.warn('Thumbnail regen from uploaded video skipped:', thumbErr);
        }
      }

      if (resumeFile) {
        setUploadProgress(75);
        finalResumeUrl = await uploadProfileResume(resumeFile);
      }

      const avatarUrl = selectedAvatar;

      const onboardingPayload = {
        username,
        email: socials.email || sessionUser.email || `${username}@seenly.tech`,
        fullName,
        headline,
        location,
        bio,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        avatarUrl,
        resumeUrl: finalResumeUrl,
        experiences: experiences.filter(e => e.company && e.role),
        projects: projects.filter(p => p.title && p.description),
        socials,
        isPublic: true,
      };

      setUploadProgress(90);
      const res = await saveOnboardingData(sessionUser.id, onboardingPayload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to save profile.');
      }

      setUploadProgress(100);
      setStep(9);
    } catch (err: any) {
      alert(err.message || 'Failed to publish profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, { company: '', role: '', duration: '' }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addProject = () => {
    setProjects([...projects, { title: '', description: '', website: '', github: '' }]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-black font-geist text-white selection:bg-white selection:text-black lg:flex-row">
      <Confetti active={step === 9} />

      {/* Onboarding Input Column */}
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border-white/10 px-5 py-6 md:px-7 md:py-8 lg:max-w-md lg:border-r xl:max-w-lg">
        
        {/* Top Branding / Step Progress */}
        <div className="shrink-0">
          <div className="mb-6 flex items-center gap-3">
            <SeenlyLogo size="md" />
          </div>

          {/* Progress Indicator */}
          {step < 9 && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-widest text-white/40">Step {step} of 8</span>
                <span className="font-medium text-white/70">
                  {step === 1 && "Create Account"}
                  {step === 2 && "Choose Username"}
                  {step === 3 && "Record Introduction"}
                  {step === 4 && "Basic Information"}
                  {step === 5 && "Experience Timeline"}
                  {step === 6 && "Key Projects"}
                  {step === 7 && "Social Links"}
                  {step === 8 && "Resume PDF"}
                </span>
              </div>
              <div className="h-px w-full overflow-hidden rounded-full bg-white/10">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(step / 8) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Form Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            {authLoading ? (
              <div className="flex justify-center items-center py-12 text-zinc-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Checking auth status...
              </div>
            ) : (
              <>
                {/* STEP 1: CREATE ACCOUNT */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">Create your Account</h1>
                      <p className="text-zinc-400 text-sm">Join the default video resume platform for modern professionals.</p>
                    </div>

                    {sessionUser ? (
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg border border-zinc-850 bg-zinc-900/40 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-zinc-500 font-semibold uppercase">SIGNED IN AS</p>
                            <p className="text-sm font-medium text-white">{sessionUser.email}</p>
                          </div>
                          <button 
                            onClick={async () => {
                              await supabase.auth.signOut();
                              setSessionUser(null);
                            }}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold hover:underline"
                          >
                            Sign Out
                          </button>
                        </div>
                        {!isEmailVerified(sessionUser) ? (
                          <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                            <p className="text-sm font-medium text-amber-100">Verify your email to continue</p>
                            <p className="text-xs leading-relaxed text-amber-200/70">
                              We sent a confirmation link to <span className="text-amber-50">{sessionUser.email}</span>.
                              Open it, then return here to build your profile.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                                className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
                              >
                                {resendLoading ? 'Sending…' : 'Resend email'}
                              </button>
                              <button
                                type="button"
                                onClick={handleRefreshVerification}
                                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                              >
                                I&apos;ve verified
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setStep(2)}
                            className="w-full bg-white text-black py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-sm animate-pulse"
                          >
                            Continue to Username <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          type="button"
                          disabled={oauthLoading}
                          onClick={handleGoogleSignIn}
                          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </button>

                        <div className="relative flex py-1 items-center">
                          <div className="flex-grow border-t border-zinc-900" />
                          <span className="flex-shrink mx-4 text-zinc-600 text-xs uppercase tracking-widest">or</span>
                          <div className="flex-grow border-t border-zinc-900" />
                        </div>

                      <form onSubmit={handleAuthSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="you@example.com" 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all"
                          />
                        </div>

                        {authError && <p className="text-xs text-red-400">{authError}</p>}
                        {authSuccessMsg && <p className="text-xs text-emerald-400">{authSuccessMsg}</p>}

                        <button 
                          type="submit"
                          disabled={oauthLoading || passwordAuthLoading}
                          className="w-full bg-white text-black py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-sm disabled:opacity-50"
                        >
                          <LoadingLabel
                            loading={passwordAuthLoading}
                            loadingText={authMode === 'signup' ? 'Creating account…' : 'Signing in…'}
                          >
                            <>
                              {authMode === 'signup' ? 'Create Account' : 'Sign In'}{' '}
                              <ArrowRight className="h-4 w-4" />
                            </>
                          </LoadingLabel>
                        </button>

                        <div className="text-center text-xs pt-2">
                          {authMode === 'signup' ? (
                            <p className="text-zinc-500">Already have an account? <button type="button" onClick={() => setAuthMode('signin')} className="text-white hover:underline font-semibold">Sign In</button></p>
                          ) : (
                            <p className="text-zinc-500">New to Seenly? <button type="button" onClick={() => setAuthMode('signup')} className="text-white hover:underline font-semibold">Create Account</button></p>
                          )}
                        </div>
                      </form>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: USERNAME */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Claim your Seenly link.</h1>
                  <p className="text-zinc-400 text-sm">Every engineer, designer, and builder needs one link to show who they are.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-stretch rounded-lg border border-white/10 bg-white/5 overflow-hidden focus-within:border-white transition-all">
                    <span className="flex items-center px-4 bg-zinc-900 border-r border-white/10 text-zinc-500 text-sm">seenly.tech/</span>
                    <input 
                      type="text" 
                      placeholder="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="flex-1 bg-transparent px-4 py-3 outline-none text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2 px-1 text-xs">
                    {checkingUsername ? (
                      <span className="text-zinc-500 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Checking availability...</span>
                    ) : usernameValid === true ? (
                      <span className="text-emerald-400 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Link is available!</span>
                    ) : usernameValid === false ? (
                      <span className="text-red-400">{usernameError || 'This username is unavailable.'}</span>
                    ) : (
                      <span className="text-zinc-600">3–30 characters, lowercase letters, numbers, _ or -</span>
                    )}
                    {usernameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {usernameSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setUsername(suggestion)}
                            className="rounded-full border border-white/10 px-3 py-1 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  disabled={!usernameValid}
                  onClick={() => setStep(3)}
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {/* STEP 3: VIDEO RECORDING */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Record your Intro.</h1>
                  <p className="text-zinc-400 text-sm">Explain who you are, what you build, and what you&apos;re looking for in {formatVideoDurationLimit(videoLimits.maxVideoSec)}.</p>
                </div>

                <div className="flex gap-4 p-1 bg-zinc-900/80 rounded-lg border border-white/10">
                  <button 
                    onClick={() => setVideoMethod('record')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${videoMethod === 'record' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Webcam Recorder
                  </button>
                  <button 
                    onClick={() => setVideoMethod('upload')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${videoMethod === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Upload File
                  </button>
                </div>

                {videoMethod === 'record' ? (
                  <div className="relative aspect-video rounded-lg bg-zinc-900 border border-white/10 overflow-hidden flex flex-col justify-center items-center">
                    {cameraError ? (
                      <div className="text-center p-6 space-y-3.5 max-w-sm z-10">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-xs text-zinc-350 leading-relaxed font-medium">{cameraError}</p>
                        <button 
                          onClick={startCamera}
                          className="bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-200 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                        >
                          Retry Camera Setup
                        </button>
                      </div>
                    ) : !videoPreviewUrl ? (
                      <>
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" playsInline muted />
                        
                        {/* Recording status indicators */}
                        {isRecording ? (
                          <div className="absolute top-4 left-4 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-white" />
                            {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')} / {Math.floor(videoLimits.maxVideoSec / 60)}:{(videoLimits.maxVideoSec % 60).toString().padStart(2, '0')}
                          </div>
                        ) : (
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-zinc-300 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                            Webcam Active
                          </div>
                        )}

                        <div className="absolute bottom-6 flex justify-center w-full z-10">
                          {!isRecording ? (
                            <button 
                              onClick={startRecording}
                              className="h-14 w-14 rounded-full bg-red-500 border-4 border-white flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                            >
                              <Camera className="h-6 w-6 text-white" />
                            </button>
                          ) : (
                            <button 
                              onClick={stopRecording}
                              className="h-14 w-14 rounded-full bg-white border-4 border-zinc-300 flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                            >
                              <Square className="h-5 w-5 text-black fill-black" />
                            </button>
                          )}
                        </div>

                        {/* Prompts Overlay */}
                        {!isRecording && (
                          <div className="absolute bottom-24 bg-black/80 border border-white/10 px-4 py-2 rounded-lg text-center max-w-[85%] mx-auto backdrop-blur-md">
                            <p className="text-xs font-medium text-zinc-300">Prompt: "Who are you and what do you build?"</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <video src={videoPreviewUrl} controls className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 z-10">
                          <button 
                            onClick={() => {
                              setVideoPreviewUrl(null);
                              setRecordedBlob(null);
                              startCamera();
                            }}
                            className="bg-black/80 hover:bg-black border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md"
                          >
                            <RefreshCw className="h-3 w-3" /> Re-record
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/10 hover:border-zinc-700 bg-zinc-900/30 rounded-lg p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="video/mp4,video/quicktime,video/webm" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {videoPreviewUrl ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden relative">
                        <video src={videoPreviewUrl} className="w-full h-full object-cover" controls />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoPreviewUrl(null);
                            setRecordedBlob(null);
                          }}
                          className="absolute top-2 right-2 bg-black/80 border border-white/10 text-xs px-2 py-1 rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto">
                          <Upload className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-zinc-300">Drag and drop your video file</p>
                          <p className="text-xs text-zinc-500">MP4, MOV or WEBM up to {formatUploadLimit(videoLimits.maxUploadBytes)} ({formatVideoDurationLimit(videoLimits.maxVideoSec)})</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(2)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={!videoPreviewUrl}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: BASIC INFORMATION */}
              {step === 4 && (
                <motion.div
                  key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Basic Details.</h1>
                  <p className="text-zinc-400 text-sm">Tell recruiters your primary info. Let's make it look premium.</p>
                </div>

                <div className="space-y-4">
                  <AvatarPicker value={selectedAvatar} onChange={setSelectedAvatar} />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Anish" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AI Engineer / Product Designer" 
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. San Francisco, CA" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Short Bio</label>
                      <span className="text-xs text-zinc-500">{bio.length}/200</span>
                    </div>
                    <textarea 
                      placeholder="Brief overview of your skills, achievements, and passion." 
                      value={bio}
                      maxLength={200}
                      rows={3}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-white outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(3)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={!fullName || !headline}
                      onClick={() => setStep(5)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: EXPERIENCE */}
              {step === 5 && (
                <motion.div
                  key="step5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Your Experience.</h1>
                  <p className="text-zinc-400 text-sm">Detail your professional timeline. You can add multiple roles.</p>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-white/10 bg-zinc-900/30 space-y-3 relative">
                      {experiences.length > 1 && (
                        <button 
                          onClick={() => removeExperience(idx)}
                          className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Company</label>
                          <input 
                            type="text" 
                            placeholder="Google" 
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].company = e.target.value;
                              setExperiences(updated);
                            }}
                            className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Role</label>
                          <input 
                            type="text" 
                            placeholder="Software Engineer" 
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...experiences];
                              updated[idx].role = e.target.value;
                              setExperiences(updated);
                            }}
                            className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400">Duration</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2024 - Present" 
                          value={exp.duration}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[idx].duration = e.target.value;
                            setExperiences(updated);
                          }}
                          className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addExperience}
                    className="w-full border border-dashed border-white/10 hover:border-zinc-700 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Add Experience
                  </button>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(4)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(6)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: PROJECTS */}
              {step === 6 && (
                <motion.div
                  key="step6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Key Projects.</h1>
                  <p className="text-zinc-400 text-sm">Highlight 1-3 projects you built. Show off links to websites/github.</p>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-white/10 bg-zinc-900/30 space-y-3 relative">
                      {projects.length > 1 && (
                        <button 
                          onClick={() => removeProject(idx)}
                          className="absolute top-3 right-3 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400">Project Name</label>
                        <input 
                          type="text" 
                          placeholder="My Awesome App" 
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].title = e.target.value;
                            setProjects(updated);
                          }}
                          className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-400">Description</label>
                        <input 
                          type="text" 
                          placeholder="A quick summary of what this app does." 
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].description = e.target.value;
                            setProjects(updated);
                          }}
                          className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400">Live URL (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="https://example.com" 
                            value={proj.website}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[idx].website = e.target.value;
                              setProjects(updated);
                            }}
                            className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-400">GitHub Link (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="https://github.com/..." 
                            value={proj.github}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[idx].github = e.target.value;
                              setProjects(updated);
                            }}
                            className="w-full bg-white/5 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addProject}
                    className="w-full border border-dashed border-white/10 hover:border-zinc-700 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all text-xs text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Add Project
                  </button>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(5)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(7)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 7: SOCIAL LINKS */}
              {step === 7 && (
                <motion.div
                  key="step7"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Socials & Contact.</h1>
                  <p className="text-zinc-400 text-sm">Where can recruiters and founders connect with you?</p>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="anish@gmail.com" 
                      value={socials.email}
                      onChange={(e) => setSocials({...socials, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">LinkedIn Profile</label>
                    <input 
                      type="text" 
                      placeholder="https://linkedin.com/in/username" 
                      value={socials.linkedin}
                      onChange={(e) => setSocials({...socials, linkedin: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">GitHub Profile</label>
                    <input 
                      type="text" 
                      placeholder="https://github.com/username" 
                      value={socials.github}
                      onChange={(e) => setSocials({...socials, github: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Portfolio Website</label>
                    <input 
                      type="text" 
                      placeholder="https://mywebsite.com" 
                      value={socials.portfolio}
                      onChange={(e) => setSocials({...socials, portfolio: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(6)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(8)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 8: RESUME UPLOAD */}
              {step === 8 && (
                <motion.div
                  key="step8"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Upload Resume.</h1>
                  <p className="text-zinc-400 text-sm">Add your resume PDF so recruiters can download it (optional).</p>
                </div>

                <div className="border border-dashed border-white/10 hover:border-zinc-700 bg-zinc-900/30 rounded-lg p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleResumeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                      {resumeName ? (
                        <>
                          <p className="text-sm font-semibold text-white">{resumeName}</p>
                          <p className="text-xs text-zinc-500">Click or drag to replace PDF</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-zinc-300">Drag and drop your PDF resume</p>
                          <p className="text-xs text-zinc-500">PDF format, up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(7)}
                    className="flex-1 border border-white/10 hover:bg-zinc-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={isUploading}
                      onClick={handlePublish}
                      className="flex-1 rounded-lg bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center gap-1.5"><RefreshCw className="h-4 w-4 animate-spin" /> Publishing {uploadProgress}%</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">Publish Profile <Sparkles className="h-4 w-4" /></span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 9: CONGRATS / PUBLISHED */}
              {step === 9 && (
                <motion.div
                  key="step9"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-8 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    You&apos;re live
                  </span>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Your profile is live!</h1>
                  <p className="text-sm text-white/50">Share your link with recruiters and track views from your dashboard.</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-center">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-white/40">Your link</span>
                  <span className="text-sm font-semibold text-white">seenly.tech/{username}</span>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button 
                    onClick={() => router.push(`/${username}`)}
                    className="flex-1 rounded-lg bg-white py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
                  >
                    View Live Profile
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 rounded-lg border border-white/15 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/8 hover:text-white"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <OnboardingProfilePreview
        username={username}
        fullName={fullName}
        headline={headline}
        location={location}
        bio={bio}
        selectedAvatar={selectedAvatar}
        videoPreviewUrl={videoPreviewUrl}
        resumeFile={resumeFile}
        experiences={experiences}
        projects={projects}
        socials={socials}
      />

    </div>
  );
}
