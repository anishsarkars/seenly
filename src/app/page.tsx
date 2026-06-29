'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Menu, X, Video, FileText, Share2, MapPin, Play } from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const navLinks = ['Home', 'How it Works', 'Studio', 'Reach Us'];

  // 3D floating tilt animation on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let animFrame: number;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);
      card.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg) translateZ(10px)`;
      animFrame = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = ((e.clientX - cx) / rect.width) * 14;
      targetY = -((e.clientY - cy) / rect.height) * 14;
    };

    const onMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    animFrame = requestAnimationFrame(animate);
    window.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black font-geist text-white selection:bg-white selection:text-black">

      {/* HERO VIEWPORT SECTION */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064209_0cb7d815-ff61-4caa-a6d5-bbff145ab272.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />

        {/* Navbar (z-30) */}
        <header className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          <div className="flex items-center gap-8 md:gap-12 lg:gap-16">
            <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">Seenly</span>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={link === 'How it Works' ? '#how-it-works' : '#'}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center">
            <a
              href="/onboarding"
              className="hidden md:block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:scale-105 transition-transform"
            >
              Get Started
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative h-10 w-10 flex items-center justify-center text-white focus:outline-none md:hidden z-50 active:scale-90 transition-transform"
              aria-label="Toggle menu"
            >
              <div className="relative h-6 w-6">
                <div className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
                  <Menu className="h-6 w-6" />
                </div>
                <div className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}>
                  <X className="h-6 w-6" />
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        <div className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'h-screen opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
          <div className="flex h-full flex-col justify-center px-8">
            <nav className={`flex flex-col gap-6 transition-all duration-500 delay-100 transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={link === 'How it Works' ? '#how-it-works' : '#'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-medium text-white/90 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
              <div>
                <a
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-6 inline-block rounded-full bg-white px-8 py-3.5 text-base font-medium text-black hover:scale-105 transition-transform"
                >
                  Get Started
                </a>
              </div>
            </nav>
          </div>
        </div>

        {/* Hero Content (z-10) — Two column layout */}
        <main className="relative z-10 flex h-[calc(100vh-80px)] items-center justify-between px-6 pb-10 pt-4 md:px-12 lg:px-20">

          {/* LEFT: Text */}
          <div className="flex flex-col justify-center gap-5 max-w-xl">
            {/* Badge */}
            <div className="animate-[fadeSlideUp_0.8s_ease_0.2s_both]">
              <span className="inline-flex items-center gap-2 text-xs text-white/60 font-medium tracking-widest uppercase bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Personal Video Pitch
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.06] tracking-tight text-white animate-[fadeSlideUp_0.8s_ease_0.4s_both]">
              Your Resume Tells.<br />
              <span className="text-white/60">Your Intro Shows.</span>
            </h1>

            {/* Description */}
            <p className="text-sm md:text-base leading-relaxed text-white/50 max-w-sm animate-[fadeSlideUp_0.8s_ease_0.6s_both]">
              Record a 60-second intro, build your profile, and share one link with every recruiter.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 items-center animate-[fadeSlideUp_0.8s_ease_0.8s_both]">
              <a
                href="/onboarding"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                Create Your Intro
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => alert('Demo video player modal!')}
                className="rounded-lg border border-white/15 hover:bg-white/8 px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:scale-105 backdrop-blur-sm transition-all"
              >
                ▶ Watch Demo
              </button>
            </div>
          </div>

          {/* RIGHT: 3D Animated Phone Profile Card — far right */}
          <div className="hidden lg:flex items-center justify-end pr-12">
            <div
              ref={cardRef}
              style={{ willChange: 'transform' }}
              className="relative w-[175px] animate-[fadeSlideUp_0.9s_ease_0.5s_both]"
            >
              {/* Ambient glow behind */}
              <div className="absolute inset-x-0 inset-y-8 bg-white/[0.02] blur-3xl rounded-full pointer-events-none" />

              {/* Phone frame */}
              <div
                className="relative rounded-[2.4rem] border border-white/[0.08] overflow-hidden"
                style={{ aspectRatio: '9/19.5', background: 'linear-gradient(160deg,#141414 0%,#0a0a0a 100%)', boxShadow: '0 40px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}
              >
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-20 flex items-center justify-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-zinc-700" />
                  <div className="h-1 w-1 rounded-full bg-zinc-800" />
                </div>

                {/* Screen content */}
                <div className="absolute inset-0 flex flex-col overflow-hidden">

                  {/* Status bar */}
                  <div className="flex justify-between items-center px-4 pt-6 pb-1.5 text-[7px] text-white/20 font-medium">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-emerald-500/60 animate-pulse" />
                      <span className="text-[5.5px] uppercase tracking-widest text-white/15">seenly</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 scrollbar-none">
                    {/* Avatar + name */}
                    <div className="flex flex-col items-center pt-1 pb-0.5 space-y-1">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white/5">
                        JT
                      </div>
                      <div className="text-center space-y-0.5">
                        <p className="text-white text-[10px] font-semibold leading-tight">John Timber</p>
                        <p className="text-white/35 text-[7px]">Designer & Builder</p>
                        <div className="flex items-center justify-center gap-0.5">
                          <MapPin className="h-1.5 w-1.5 text-white/20" />
                          <span className="text-white/20 text-[6px]">New York</span>
                        </div>
                      </div>
                    </div>

                    {/* Video preview */}
                    <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&h=180&q=80"
                        alt="Profile intro"
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center">
                          <Play className="h-2.5 w-2.5 fill-black ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-2 text-[6px] text-white/60 font-medium">0:60 intro</div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5" />

                    {/* Experience */}
                    <div className="space-y-1">
                      <p className="text-[6px] font-bold text-white/20 uppercase tracking-widest">Experience</p>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-bold text-white/60">G</span>
                        </div>
                        <div>
                          <p className="text-white text-[8px] font-semibold">SWE III</p>
                          <p className="text-white/30 text-[6px]">Google · 2023–now</p>
                        </div>
                      </div>
                    </div>

                    {/* Skills row */}
                    <div className="space-y-1">
                      <p className="text-[6px] font-bold text-white/20 uppercase tracking-widest">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {['React', 'TypeScript', 'Figma'].map(s => (
                          <span key={s} className="text-[6px] text-white/40 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* Profile link */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                      <p className="text-[6px] text-white/20 mb-0.5">Profile</p>
                      <p className="text-[7px] text-white/50 font-mono">seenly.tech/johntimber</p>
                    </div>

                  </div>

                  {/* Bottom bar */}
                  <div className="flex justify-center pb-2.5 pt-1">
                    <div className="w-10 h-0.5 bg-white/15 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Glow under phone */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/[0.04] blur-xl rounded-full" />
            </div>
          </div>

        </main>

        {/* Floating animation keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(0px); }
            50% { transform: perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(-10px); }
          }
        `}</style>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-24 md:py-32 bg-black border-t border-zinc-900 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4 text-center md:text-left mb-16 md:mb-20">
            <h2 className="text-xs uppercase tracking-widest text-[#9F67FF] font-extrabold">Process</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">How Seenly Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-[2rem] border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:scale-[1.01] transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-zinc-900/50 text-[#9F67FF] flex items-center justify-center border border-zinc-800/50">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#9F67FF]/80 uppercase tracking-widest">Step 01</div>
                <h4 className="font-bold text-lg text-white">Record / Upload Intro</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Record a 60-second introduction pitch explaining your personality, background, and what drives you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-[2rem] border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:scale-[1.01] transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-zinc-900/50 text-[#38BDF8] flex items-center justify-center border border-zinc-800/50">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#38BDF8]/80 uppercase tracking-widest">Step 02</div>
                <h4 className="font-bold text-lg text-white">Build Your Profile</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Import your project list, work timeline, social handles, and CV to complete your pitch.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-[2rem] border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:scale-[1.01] transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-zinc-900/50 text-[#4ADE80] flex items-center justify-center border border-zinc-800/50">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#4ADE80]/80 uppercase tracking-widest">Step 03</div>
                <h4 className="font-bold text-lg text-white">Share Your Link</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Publish your profile under a custom seenly.tech/username link and share it with hiring managers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-black py-12 px-6 md:px-12 lg:px-16 text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">Seenly</span>
            <span className="text-xs text-zinc-500">© 2026. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
