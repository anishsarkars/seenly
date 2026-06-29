'use client';

import React, { useState } from 'react';
import { ArrowRight, Menu, X, Video, FileText, Share2 } from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ['Home', 'How it Works', 'Studio', 'Reach Us'];

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
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260520_111942_8fc50f9e-4dfd-45c1-81bb-d93342a23d87.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Navbar (z-30) */}
        <header className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          {/* Left Side Logo & Links */}
          <div className="flex items-center gap-8 md:gap-12 lg:gap-16">
            <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              Seenly
            </span>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={link === 'How it Works' ? '#how-it-works' : '#'}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center">
            {/* Desktop Call To Action */}
            <a
              href="/onboarding"
              className="hidden md:block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:scale-105 transition-transform"
            >
              Get Started
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative h-10 w-10 flex items-center justify-center text-white focus:outline-none md:hidden z-50 active:scale-90 transition-transform"
              aria-label="Toggle menu"
            >
              <div className="relative h-6 w-6">
                {/* Menu Icon */}
                <div
                  className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen
                    ? 'rotate-90 scale-0 opacity-0'
                    : 'rotate-0 scale-100 opacity-100'
                    }`}
                >
                  <Menu className="h-6 w-6" />
                </div>
                {/* X Icon */}
                <div
                  className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-0 opacity-0'
                    }`}
                >
                  <X className="h-6 w-6" />
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Menu (z-20) */}
        <div
          className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen
            ? 'h-screen opacity-100'
            : 'h-0 opacity-0 pointer-events-none'
            }`}
        >
          <div className="flex h-full flex-col justify-center px-8">
            <nav
              className={`flex flex-col gap-6 transition-all duration-500 delay-100 transform ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
            >
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

        {/* Hero Content (z-10) */}
        <main className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">

          {/* Top Section */}
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-4 sm:mb-6 animate-[fadeSlideUp_0.8s_ease_0.2s_both]">
              <span className="text-xs sm:text-sm text-white/90 font-medium tracking-wide bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                Personal Video Pitch
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white [text-shadow:_0_4px_24px_rgba(0,0,0,0.85)] animate-[fadeSlideUp_0.8s_ease_0.4s_both]">
              Your Resume Tells.<br />
              Your Intro Shows.
            </h1>
          </div>

          {/* Bottom Section */}
          <div>
            {/* Description Paragraph */}
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/95 [text-shadow:_0_2px_12px_rgba(0,0,0,0.85)] max-w-sm sm:max-w-xl mb-5 sm:mb-6 animate-[fadeSlideUp_0.8s_ease_0.7s_both]">
              Create a beautiful professional profile around a 60-second introduction video. Show recruiters your communication, personality, projects, and experience—all in one shareable link.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center animate-[fadeSlideUp_0.8s_ease_0.9s_both] pb-6">
              <a
                href="/onboarding"
                className="rounded-lg bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-black hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-lg"
              >
                Create Your Intro
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                onClick={() => alert('Demo video player modal!')}
                className="rounded-lg border border-white/30 hover:bg-white/10 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white hover:scale-105 backdrop-blur-sm transition-transform [text-shadow:_0_1px_4px_rgba(0,0,0,0.6)]"
              >
                ▶ Watch Demo
              </button>
            </div>
          </div>
        </main>
      </section>

      {/* HOW IT WORKS SECTION (Premium Light/Pastel Theme) */}
      <section id="how-it-works" className="relative py-24 md:py-32 bg-[#FAF9F6] border-t border-zinc-200/60 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4 text-center md:text-left mb-16 md:mb-20">
            <h2 className="text-xs uppercase tracking-widest text-[#7C3AED] font-extrabold">Process</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">How Seenly Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 - Pastel Lavender Card */}
            <div className="p-8 rounded-[2rem] border border-[#ECE9FC] bg-[#F8F6FF] hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#7C3AED]/70 uppercase tracking-widest">Step 01</div>
                <h4 className="font-bold text-lg text-zinc-900">Record / Upload Intro</h4>
                <p className="text-xs text-zinc-650 leading-relaxed font-medium">
                  Record a 60-second introduction pitch explaining your personality, background, and what drives you.
                </p>
              </div>
            </div>

            {/* Step 2 - Pastel Sky Blue Card */}
            <div className="p-8 rounded-[2rem] border border-[#E0F2FE] bg-[#F0F9FF] hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#0284C7]/70 uppercase tracking-widest">Step 02</div>
                <h4 className="font-bold text-lg text-zinc-900">Build Your Profile</h4>
                <p className="text-xs text-zinc-650 leading-relaxed font-medium">
                  Import your project list, work timeline events, social media handles, and CV document to complete your pitch.
                </p>
              </div>
            </div>

            {/* Step 3 - Pastel Mint Green Card */}
            <div className="p-8 rounded-[2rem] border border-[#DCFCE7] bg-[#F0FDF4] hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold text-[#16A34A]/70 uppercase tracking-widest">Step 03</div>
                <h4 className="font-bold text-lg text-zinc-900">Share Your Link</h4>
                <p className="text-xs text-zinc-650 leading-relaxed font-medium">
                  Publish your profile under a custom `seenly.tech/username` link and share it directly with hiring managers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHT MINIMAL FOOTER SECTION */}
      <footer className="border-t border-zinc-200/60 bg-white py-12 px-6 md:px-12 lg:px-16 text-zinc-600">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Seenly</span>
            <span className="text-xs text-zinc-400">© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
