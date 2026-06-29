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
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4"
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
                  className={`absolute inset-0 transition-all duration-300 transform ${
                    mobileMenuOpen
                      ? 'rotate-90 scale-0 opacity-0'
                      : 'rotate-0 scale-100 opacity-100'
                  }`}
                >
                  <Menu className="h-6 w-6" />
                </div>
                {/* X Icon */}
                <div
                  className={`absolute inset-0 transition-all duration-300 transform ${
                    mobileMenuOpen
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
          className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen
              ? 'h-screen opacity-100'
              : 'h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex h-full flex-col justify-center px-8">
            <nav
              className={`flex flex-col gap-6 transition-all duration-500 delay-100 transform ${
                mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
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
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight text-white animate-[fadeSlideUp_0.8s_ease_0.4s_both]">
              Your Resume Tells.<br />
              Your Intro Shows.
            </h1>
          </div>

          {/* Bottom Section */}
          <div>
            {/* Description Paragraph */}
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/70 max-w-sm sm:max-w-xl mb-5 sm:mb-6 animate-[fadeSlideUp_0.8s_ease_0.7s_both]">
              Create a beautiful professional profile around a 60-second introduction video. Show recruiters your communication, personality, projects, and experience—all in one shareable link.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center animate-[fadeSlideUp_0.8s_ease_0.9s_both] pb-6">
              <a 
                href="/onboarding" 
                className="rounded-lg bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                Create Your Intro
                <ArrowRight className="h-4 w-4" />
              </a>
              
              <button 
                onClick={() => alert('Demo video player modal!')} 
                className="rounded-lg border border-white/20 hover:bg-white/10 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white hover:scale-105 transition-transform"
              >
                ▶ Watch Demo
              </button>
            </div>
          </div>
        </main>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-24 md:py-32 bg-black border-t border-zinc-900 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4 text-center md:text-left mb-16 md:mb-20">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Process</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">How Seenly Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400">
                <Video className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step 01</div>
                <h4 className="font-semibold text-lg text-white">Record / Upload Intro</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Record a 60-second introduction pitch explaining your personality, background, and what drives you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step 02</div>
                <h4 className="font-semibold text-lg text-white">Build Your Profile</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Import your project list, work timeline events, social media handles, and CV document to complete your pitch.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step 03</div>
                <h4 className="font-semibold text-lg text-white">Share Your Link</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Publish your profile under a custom `seenly.tech/username` link and share it directly with hiring managers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MINIMAL FOOTER SECTION */}
      <footer className="border-t border-zinc-900 bg-black py-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">Seenly</span>
            <span className="text-xs text-zinc-500">© 2026. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
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
