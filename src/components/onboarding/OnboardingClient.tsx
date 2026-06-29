'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Video, Camera, Info, Briefcase, FolderGit, Link as LinkIcon, 
  FileText, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, RefreshCw, 
  Play, Square, Sparkles, Upload, Volume2, VolumeX, Shield, UserCheck
} from 'lucide-react';
import { saveOnboardingData, isUsernameUnique } from '@/db/actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function OnboardingClient() {
  const router = useRouter();
  
  // Supabase Auth States
  const [supabase] = useState(() => createClient());
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  
  // Video states
  const [videoMethod, setVideoMethod] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // Auth check & state management
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSessionUser(user);
        setSocials(prev => ({ ...prev, email: user.email || '' }));
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        setSocials(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!emailInput || !passwordInput) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
        });
        if (error) throw error;
        setAuthSuccessMsg('Account created! Proceeding to onboarding...');
        setTimeout(() => {
          setStep(2);
        }, 800);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });
        if (error) throw error;
        setAuthSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          setStep(2);
        }, 800);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  // Validate username
  useEffect(() => {
    if (!username) {
      setUsernameValid(null);
      return;
    }
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleanUsername !== username) {
      setUsername(cleanUsername);
    }
    
    if (username.length < 3 || username.length > 30) {
      setUsernameValid(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const isUnique = await isUsernameUnique(username, sessionUser?.id);
      setUsernameValid(isUnique);
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
        if (prev >= 60) {
          stopRecording();
          return 60;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 250 * 1024 * 1024) {
      alert('File size exceeds 250MB limit.');
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
    setIsUploading(true);
    setUploadProgress(10);
    
    // Simulate upload/save process
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    const onboardingPayload = {
      username,
      email: socials.email || `${username}@seenly.tech`,
      fullName,
      headline,
      location,
      bio,
      videoUrl: videoPreviewUrl,
      resumeUrl: resumeName ? `#` : undefined,
      experiences: experiences.filter(e => e.company && e.role),
      projects: projects.filter(p => p.title && p.description),
      socials
    };

    const res = await saveOnboardingData(sessionUser.id, onboardingPayload);
    
    setUploadProgress(100);
    clearInterval(interval);
    
    setTimeout(() => {
      setIsUploading(false);
      router.push('/dashboard');
    }, 500);
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
    <div className="flex min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Onboarding Input Column */}
      <div className="flex-1 max-w-xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-between border-r border-zinc-900 bg-zinc-950/20 backdrop-blur-3xl">
        
        {/* Top Branding / Step Progress */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-lg">S</div>
            <span className="font-semibold tracking-wider text-sm text-zinc-400">SEENLY</span>
          </div>

          {/* Progress Indicator */}
          {step < 9 && (
            <div className="mb-12">
              <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
                <span>STEP {step} OF 8</span>
                <span className="font-semibold text-zinc-300">
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
              <div className="h-[2px] w-full bg-zinc-800 rounded-full overflow-hidden">
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
        <div className="flex-1 flex flex-col justify-center">
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
                        <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/40 flex items-center justify-between">
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
                        <button 
                          onClick={() => setStep(2)}
                          className="w-full bg-white text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-sm animate-pulse"
                        >
                          Continue to Username <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAuthSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="you@example.com" 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all"
                          />
                        </div>

                        {authError && <p className="text-xs text-red-400">{authError}</p>}
                        {authSuccessMsg && <p className="text-xs text-emerald-400">{authSuccessMsg}</p>}

                        <button 
                          type="submit"
                          className="w-full bg-white text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all text-sm"
                        >
                          {authMode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight className="h-4 w-4" />
                        </button>

                        <div className="text-center text-xs pt-2">
                          {authMode === 'signup' ? (
                            <p className="text-zinc-500">Already have an account? <button type="button" onClick={() => setAuthMode('signin')} className="text-white hover:underline font-semibold">Sign In</button></p>
                          ) : (
                            <p className="text-zinc-500">New to Seenly? <button type="button" onClick={() => setAuthMode('signup')} className="text-white hover:underline font-semibold">Create Account</button></p>
                          )}
                        </div>

                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-zinc-900"></div>
                          <span className="flex-shrink mx-4 text-zinc-650 text-xs uppercase tracking-widest font-bold">or</span>
                          <div className="flex-grow border-t border-zinc-900"></div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setSessionUser({ id: '00000000-0000-0000-0000-000000000000', email: 'demo@seenly.tech' });
                            setStep(2);
                          }}
                          className="w-full border border-zinc-850 hover:bg-zinc-900 text-zinc-300 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs"
                        >
                          Skip Authentication (Mock Local Mode)
                        </button>
                      </form>
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
                  <div className="flex items-stretch rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden focus-within:border-white transition-all">
                    <span className="flex items-center px-4 bg-zinc-900 border-r border-zinc-800 text-zinc-500 text-sm">seenly.tech/</span>
                    <input 
                      type="text" 
                      placeholder="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="flex-1 bg-transparent px-4 py-3 outline-none text-white text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs px-1">
                    {checkingUsername ? (
                      <span className="text-zinc-500 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Checking availability...</span>
                    ) : usernameValid === true ? (
                      <span className="text-emerald-400 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Link is available!</span>
                    ) : usernameValid === false ? (
                      <span className="text-red-400">Must be 3-30 letters/numbers and unique</span>
                    ) : (
                      <span className="text-zinc-600">3-30 characters, lowercase</span>
                    )}
                  </div>
                </div>
                <button 
                  disabled={!usernameValid}
                  onClick={() => setStep(3)}
                  className="w-full bg-white text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all"
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
                  <p className="text-zinc-400 text-sm">Explain who you are, what you build, and what you're looking for in under 60 seconds.</p>
                </div>

                <div className="flex gap-4 p-1 bg-zinc-900/80 rounded-lg border border-zinc-800">
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
                  <div className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col justify-center items-center">
                    {cameraError ? (
                      <div className="text-center p-6 space-y-3.5 max-w-sm z-10">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-xs text-zinc-350 leading-relaxed font-medium">{cameraError}</p>
                        <button 
                          onClick={startCamera}
                          className="bg-white/10 hover:bg-white/20 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
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
                            0:{recordTime.toString().padStart(2, '0')} / 1:00
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
                          <div className="absolute bottom-24 bg-black/80 border border-zinc-800 px-4 py-2 rounded-xl text-center max-w-[85%] mx-auto backdrop-blur-md">
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
                            className="bg-black/80 hover:bg-black border border-zinc-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md"
                          >
                            <RefreshCw className="h-3 w-3" /> Re-record
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative">
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
                          className="absolute top-2 right-2 bg-black/80 border border-zinc-800 text-xs px-2 py-1 rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                          <Upload className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-zinc-300">Drag and drop your video file</p>
                          <p className="text-xs text-zinc-500">MP4, MOV or WEBM up to 250MB (max 60 seconds)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(2)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={!videoPreviewUrl}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Anish" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AI Engineer / Product Designer" 
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. San Francisco, CA" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all"
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
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(3)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={!fullName || !headline}
                      onClick={() => setStep(5)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
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
                    <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3 relative">
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
                            className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
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
                            className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
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
                          className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addExperience}
                    className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Add Experience
                  </button>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(4)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(6)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
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
                    <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3 relative">
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
                          className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
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
                          className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
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
                            className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
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
                            className="w-full bg-zinc-900/50 border border-zinc-850 rounded-lg px-3 py-2 text-xs focus:border-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addProject}
                    className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-4 w-4" /> Add Project
                  </button>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(5)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(7)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
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
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">LinkedIn Profile</label>
                    <input 
                      type="text" 
                      placeholder="https://linkedin.com/in/username" 
                      value={socials.linkedin}
                      onChange={(e) => setSocials({...socials, linkedin: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">GitHub Profile</label>
                    <input 
                      type="text" 
                      placeholder="https://github.com/username" 
                      value={socials.github}
                      onChange={(e) => setSocials({...socials, github: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Portfolio Website</label>
                    <input 
                      type="text" 
                      placeholder="https://mywebsite.com" 
                      value={socials.portfolio}
                      onChange={(e) => setSocials({...socials, portfolio: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:border-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                      <button 
                    onClick={() => setStep(6)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      onClick={() => setStep(8)}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
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

                <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleResumeUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
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
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
                  >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button 
                      disabled={isUploading}
                      onClick={handlePublish}
                      className="flex-1 bg-emerald-500 text-white hover:bg-emerald-400 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 animate-spin" /> Publishing...</span>
                      ) : (
                        <span className="flex items-center gap-1.5">Publish Profile <Sparkles className="h-4 w-4" /></span>
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
                className="space-y-6 text-center py-8"
              >
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Your profile is live!</h1>
                  <p className="text-zinc-400 text-sm">Congratulations. Recruiters can now see who you are in 60 seconds.</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center select-all cursor-pointer hover:border-zinc-700 transition-all">
                  <span className="text-xs text-zinc-500 block mb-1">YOUR DIRECT PROFILE LINK</span>
                  <span className="text-sm font-semibold text-white">seenly.tech/{username}</span>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => router.push(`/${username}`)}
                    className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm"
                  >
                    View Public Profile
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm text-zinc-300"
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

      {/* Live Preview Sidebar (Right Column) */}
      <div className="hidden lg:flex flex-1 bg-zinc-950 items-center justify-center p-8 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />

        {/* Live Preview Mobile Device Mockup */}
        <div className="relative w-[360px] h-[720px] rounded-[48px] border-[8px] border-zinc-800 bg-black shadow-2xl overflow-hidden flex flex-col justify-between">
          
          {/* Top Notch/Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-black z-30" />

          {/* Screen Content */}
          <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8 relative">
            <div className="absolute top-2 right-4 text-[10px] text-zinc-500 font-bold uppercase tracking-widest z-10 bg-black/40 px-2 py-0.5 rounded-full">
              LIVE PREVIEW
            </div>

            {/* Profile Avatar / Username Header */}
            <div className="flex flex-col items-center text-center mt-6 space-y-3">
              <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                {fullName ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`} 
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-7 w-7 text-zinc-500" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm text-white">{fullName || "Your Full Name"}</h3>
                <p className="text-[10px] text-zinc-400">{headline || "Your Professional Headline"}</p>
                <p className="text-[9px] text-zinc-500">{location || "Location"}</p>
              </div>
            </div>

            {/* Video Box */}
            <div className="mt-5 aspect-video w-full rounded-xl bg-zinc-900 border border-zinc-850 overflow-hidden relative flex flex-col justify-center items-center">
              {videoPreviewUrl ? (
                <video src={videoPreviewUrl} className="w-full h-full object-cover" muted loop autoPlay />
              ) : (
                <div className="text-center p-4">
                  <Video className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-[10px] text-zinc-500">Intro Video Preview</p>
                </div>
              )}
            </div>

            {/* Short Bio */}
            <div className="mt-4">
              <p className="text-[11px] text-zinc-400 text-center leading-relaxed italic px-2">
                "{bio || "Write a brief description about your expertise and drive."}"
              </p>
            </div>

            {/* Experience timeline */}
            <div className="mt-6 space-y-2">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Experience</h4>
              <div className="space-y-2">
                {experiences.some(e => e.company) ? (
                  experiences.map((exp, i) => exp.company ? (
                    <div key={i} className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-850 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-medium text-white">{exp.role}</p>
                        <p className="text-[8px] text-zinc-500">{exp.company}</p>
                      </div>
                      <span className="text-[8px] text-zinc-500">{exp.duration}</span>
                    </div>
                  ) : null)
                ) : (
                  <p className="text-[9px] text-zinc-650 italic">No experience roles added yet.</p>
                )}
              </div>
            </div>

            {/* Key Projects */}
            <div className="mt-5 space-y-2">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Projects</h4>
              <div className="space-y-2">
                {projects.some(p => p.title) ? (
                  projects.map((proj, i) => proj.title ? (
                    <div key={i} className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-850">
                      <p className="text-[10px] font-medium text-white">{proj.title}</p>
                      <p className="text-[8px] text-zinc-500 leading-tight">{proj.description}</p>
                    </div>
                  ) : null)
                ) : (
                  <p className="text-[9px] text-zinc-650 italic">No projects listed yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Bar Device line */}
          <div className="h-6 flex justify-center items-center">
            <div className="w-24 h-1 rounded-full bg-zinc-800" />
          </div>

        </div>

      </div>

    </div>
  );
}
