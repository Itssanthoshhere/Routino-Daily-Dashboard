"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Calendar,
  Lock,
  Headphones,
  Gauge,
  Key,
  Zap,
  Wallet,
  Briefcase,
  Laptop,
  CheckCircle2,
  ExternalLink,
  Github,
  ChevronDown,
  Sparkles,
  Target,
  Play,
  Pause,
  Volume2,
  Globe,
  Keyboard,
  Layers,
  Menu,
  X,
  Award,
} from "lucide-react";
import { ambientSound, AmbientSoundType } from "@/lib/ambientSound";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("off");
  const [soundVolume, setSoundVolume] = useState<number>(35);
  const [ebInputReading, setEbInputReading] = useState<number>(323);
  const [ebRoommateSplit, setEbRoommateSplit] = useState<number>(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Stop ambient sound when leaving the page
  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  const handleToggleSound = (type: AmbientSoundType) => {
    if (activeSound === type) {
      ambientSound.stop();
      setActiveSound("off");
    } else {
      ambientSound.start(type);
      setActiveSound(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setSoundVolume(newVol);
    ambientSound.setVolume(newVol / 100);
  };

  // EB Calculator logic
  const currentUnits = Math.max(0, ebInputReading - 315);
  const dailyBurn = (currentUnits / 4).toFixed(1);
  const projected30dUnits = Math.round(Number(dailyBurn) * 30);
  const projectedTotalCost = Math.round(projected30dUnits * 12);
  const myProjectedShare = Math.round(projectedTotalCost / ebRoommateSplit);

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-[#1a2e26] selection:bg-forest/15 selection:text-forest">
      {/* ─── Sticky Header (Glassmorphic) ─── */}
      <header className="sticky top-0 z-50 border-b border-[#e5e7df]/80 bg-white/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt="Routino"
                className="h-8 w-8 rounded-xl shadow-xs transition-transform group-hover:scale-105"
              />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[17px] font-extrabold tracking-tight text-ink">routino</span>
                <span className="text-[11px] font-bold text-forest">2.0</span>
              </div>
            </Link>
            <span className="hidden sm:inline-flex rounded-full border border-forest/20 bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#047857]">
              Open Source
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-semibold text-muted">
            <a href="#features" className="hover:text-forest transition">Features</a>
            <a href="#how-it-works" className="hover:text-forest transition">How It Works</a>
            <a href="#demo-audio" className="hover:text-forest transition">Live Demos</a>
            <a href="#trackers" className="hover:text-forest transition">Trackers Hub</a>
            <a href="#security" className="hover:text-forest transition">Security</a>
            <a href="#faq" className="hover:text-forest transition">FAQ</a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-2xs"
            >
              <Github size={14} />
              <span>GitHub</span>
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-[12px] font-bold text-white hover:bg-[#1a3424] transition shadow-sm"
            >
              <span>Launch Workspace</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-line bg-[#fbfcf8] p-5 lg:hidden animate-in fade-in duration-150">
            <div className="flex flex-col gap-3 text-[14px] font-semibold text-ink">
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="py-1">Features</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="py-1">How It Works</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#demo-audio" className="py-1">Live Demos</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#trackers" className="py-1">Trackers Hub</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#security" className="py-1">Security & Privacy</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#faq" className="py-1">FAQ</a>
              <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-line">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-[13px] font-bold text-white"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-line bg-white py-2 text-[13px] font-semibold text-ink"
                >
                  <Github size={15} />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 border-b border-line/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_25rem_at_top,#ecfdf5,transparent)] opacity-60" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-3.5 py-1 text-[11.5px] font-semibold text-forest shadow-2xs mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
            <Sparkles size={13} className="text-forest" />
            <span>The Daily Operations Command Center for High-Output Builders</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-[34px] sm:text-[48px] md:text-[58px] font-extrabold tracking-tight text-ink leading-[1.12]">
            The daily command center <br className="hidden sm:inline" />
            built for <span className="text-forest underline decoration-forest/30 decoration-wavy underline-offset-8">personal operations.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-muted">
            Unify Google & Outlook schedules, deep work focus sessions, zero-knowledge encrypted notes, utility meter settlements, and career pipelines in one calm, minimalist workspace.
          </p>

          {/* Dual CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3.5 text-[14px] font-bold text-white hover:bg-[#1a3424] transition shadow-md group"
            >
              <span>Launch Workspace (Free)</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#trackers"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3.5 text-[14px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-2xs"
            >
              <Gauge size={15} className="text-[#059669]" />
              <span>Explore Trackers Hub</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11.5px] font-medium text-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#047857]" />
              <span>Zero-Knowledge AES-256 Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Headphones size={14} className="text-[#047857]" />
              <span>Synthesized Pure Web Audio API</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-[#047857]" />
              <span>Live Google Sheets Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Keyboard size={14} className="text-[#047857]" />
              <span>Full Keyboard Navigation (1–6, Q, F)</span>
            </div>
          </div>
        </div>

        {/* ─── Hero Interactive Product Mockup ─── */}
        <div className="mx-auto mt-12 sm:mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-[#d6dbcf] bg-linear-to-b from-[#fbfcf8] to-white p-4 sm:p-7 shadow-2xl overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f87171]" />
                <span className="h-3 w-3 rounded-full bg-[#fbbf24]" />
                <span className="h-3 w-3 rounded-full bg-[#34d399]" />
                <span className="ml-3 text-[11px] font-mono font-medium text-muted">routino.app/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[10px] font-bold text-[#047857]">
                  ● LIVE WORKSPACE
                </span>
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Card 1: Today's Focus Pulse */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Deep Work Block</span>
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-forest/10 text-forest">
                      <Target size={13} />
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold text-ink tracking-tight">25:00</span>
                    <span className="text-[11px] font-bold text-forest">Pomodoro</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">Full-stack feature build · Audio synthesizer active</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f0f2eb] flex items-center justify-between text-[11px]">
                  <span className="text-muted">Soundscape: Gentle Rain</span>
                  <span className="font-bold text-forest bg-[#ecfdf5] px-2 py-0.5 rounded-md">Synthesized</span>
                </div>
              </div>

              {/* Card 2: Trackers Quick Snapshot */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Trackers Pulse</span>
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857]">
                      <Gauge size={13} />
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11.5px]">
                    <div className="rounded-lg bg-[#f9faf6] p-2 border border-[#eff1ea]">
                      <span className="text-muted block text-[10px]">Tokens Ready</span>
                      <strong className="text-forest text-[14px]">27 / 9</strong>
                    </div>
                    <div className="rounded-lg bg-[#f9faf6] p-2 border border-[#eff1ea]">
                      <span className="text-muted block text-[10px]">EB Burn</span>
                      <strong className="text-ink text-[14px]">~1.9 u/d</strong>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted">30d Roommate Share: <strong>₹290</strong> · 50% split</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f0f2eb] flex items-center justify-between text-[11px]">
                  <span className="text-muted">Budget: ₹3,420 / ₹7.5k</span>
                  <span className="font-semibold text-forest">45% burned</span>
                </div>
              </div>

              {/* Card 3: Priority Pipeline & Urgent Round */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Career Hub Alert</span>
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                      <Briefcase size={13} />
                    </span>
                  </div>
                  <div className="mt-2.5 rounded-xl border border-[#bfdbfe]/70 bg-[#eff6ff]/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-[12px] text-[#1e40af]">Josh Talks</strong>
                      <span className="text-[9.5px] font-bold bg-white text-[#1d4ed8] px-1.5 py-0.2 rounded">Task Due</span>
                    </div>
                    <p className="text-[10.5px] text-[#3b82f6] mt-0.5 truncate">Speech dataset take-home evaluation</p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f0f2eb] flex items-center justify-between text-[11px]">
                  <span className="text-forest font-semibold">1-Click Action Links</span>
                  <span className="font-semibold text-ink">Applied 3d ago</span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-[#f0f2ea] px-4 py-2.5 text-[11.5px] text-muted">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">Navigation:</span>
                <span>Press <strong>1</strong> Overview, <strong>2</strong> Calendar, <strong>3</strong> Inbox, <strong>4</strong> Tasks, <strong>5</strong> Notes, <strong>6</strong> Trackers Hub</span>
              </div>
              <Link href="/dashboard" className="font-bold text-forest hover:underline shrink-0">
                Explore Dashboard Live →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Core Pillars Bento Grid ─── */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-widest text-forest">Core Foundations</span>
          <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold text-ink tracking-tight">
            Engineered for deep work and complete personal control
          </h2>
          <p className="mt-3 text-[15px] text-muted">
            Eliminate cognitive clutter with purpose-built engines designed to protect your attention and automate routine administrative tracking.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: Focus Engine & Audio Synthesizer */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-forest/10 text-forest mb-4">
                <Headphones size={20} />
              </div>
              <h3 className="text-[19px] font-bold text-ink">Deep Work Focus Suite & Ambient Audio</h3>
              <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
                Integrated Pomodoro focus blocks (25m, 45m, 60m, 90m) coupled with pure Web Audio API ambient synthesis. Generate gentle rain, ocean swells, and brown noise with zero external audio files, network latency, or buffering.
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#3f4a41]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Synthesized Brownian & White noise generators</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Automatic focus session logging and cumulative daily target tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Instant keyboard shortcut: press <strong>F</strong> anywhere to start</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-line/70">
              <a href="#demo-audio" className="text-[12px] font-bold text-forest hover:underline">
                Try ambient sound demo below ↓
              </a>
            </div>
          </div>

          {/* Feature 2: Unified Calendar & Time Audit */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eff6ff] text-[#1d4ed8] mb-4">
                <Calendar size={20} />
              </div>
              <h3 className="text-[19px] font-bold text-ink">Unified Day Planner & Smart Time Audit</h3>
              <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
                Connect your Google Calendar and Microsoft Outlook schedules into a single pane. The automated colorization engine categorizes coding, meetings, and personal tasks, generating daily time audit analytics.
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#3f4a41]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Bi-directional Google & Microsoft 365 Outlook integration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Up-Next meeting countdown banner with 1-click video join</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Daily Desk Sheet view (Cmd + P) for distraction-free physical printing</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-line/70">
              <Link href="/dashboard" className="text-[12px] font-bold text-forest hover:underline">
                View Calendar Engine in Workspace →
              </Link>
            </div>
          </div>

          {/* Feature 3: Zero-Knowledge Encrypted Notes */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fffbeb] text-[#b45309] mb-4">
                <Lock size={20} />
              </div>
              <h3 className="text-[19px] font-bold text-ink">Zero-Knowledge Encrypted Keep Vault</h3>
              <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
                Keep notes, private reflections, and credentials secure with master PIN-based zero-knowledge encryption. Derives keys client-side via PBKDF2 (100,000 rounds) and seals content with military-grade AES-256-GCM.
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#3f4a41]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Client-side encryption: unencrypted content never touches servers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Rich Markdown preview, image attachments, and drag-and-drop reordering</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Universal Quick Capture modal (press <strong>Q</strong>) for immediate thoughts</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-line/70">
              <a href="#security" className="text-[12px] font-bold text-forest hover:underline">
                Read cryptographic architecture ↓
              </a>
            </div>
          </div>

          {/* Feature 4: Multi-Stream Trackers Hub */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#ecfdf5] text-[#047857] mb-4">
                <Gauge size={20} />
              </div>
              <h3 className="text-[19px] font-bold text-ink">Multi-Stream Trackers Hub</h3>
              <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
                Executive pulse across utility sub-meters, account tokens, personal budget burn-down, and active career applications. Includes real-time 30-day electricity forecasting and 1-click candidate briefs.
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#3f4a41]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Antigravity Tokens: 6 Chrome profiles with 1-click Copy Next Ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>EB Electricity Meter: daily burn velocity (~1.9 u/day) & 50/50 split</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest" />
                  <span>Career Hub: 31+ applications with Smart Link Extractor & 1-Click Copy</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-line/70">
              <a href="#trackers" className="text-[12px] font-bold text-forest hover:underline">
                Explore all 7 specialized trackers ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Interactive Live Demos (Sound & EB Calculator) ─── */}
      <section id="demo-audio" className="py-16 sm:py-20 bg-[#f4f6f0] border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-forest">Try It Live</span>
            <h2 className="mt-2 text-[26px] sm:text-[34px] font-extrabold text-ink tracking-tight">
              Interactive Tools Built Right Into Your Browser
            </h2>
            <p className="mt-2 text-[14px] text-muted">
              Experience the Web Audio sound generator and PG Electricity calculator live without signing in.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Demo 1: Ambient Sound Generator */}
            <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Headphones size={18} className="text-forest" />
                    <h3 className="text-[17px] font-bold text-ink">Live Ambient Sound Synthesizer</h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${activeSound !== "off" ? "bg-[#ecfdf5] text-[#047857] animate-pulse" : "bg-[#f1f3ed] text-muted"}`}>
                    {activeSound !== "off" ? `Playing: ${activeSound.toUpperCase()}` : "Synthesizer Idle"}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] text-muted">
                  Click any soundscape below to synthesize real-time ambient noise using your browser&apos;s Web Audio API. Zero streaming bandwidth required.
                </p>

                {/* Sound Selector Buttons */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {[
                    { id: "rain", label: "Gentle Rain" },
                    { id: "waves", label: "Ocean Waves" },
                    { id: "brown", label: "Brown Noise" },
                    { id: "forest", label: "Wind & Leaves" },
                    { id: "cafe", label: "Café Hum" },
                    { id: "off", label: "Stop All" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleToggleSound(s.id as AmbientSoundType)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-[12px] font-bold transition cursor-pointer ${
                        activeSound === s.id
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "border-line bg-white text-ink hover:bg-[#f1f3ed]"
                      }`}
                    >
                      {activeSound === s.id && s.id !== "off" ? <Pause size={12} /> : <Play size={12} />}
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Volume Slider */}
                <div className="mt-6 rounded-2xl bg-[#fafbf7] border border-line p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted mb-2">
                    <span className="flex items-center gap-1.5">
                      <Volume2 size={13} className="text-forest" /> Volume Level
                    </span>
                    <span>{soundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={soundVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#e2e6dc] rounded-lg appearance-none cursor-pointer accent-forest"
                  />
                </div>
              </div>

              <p className="mt-4 text-[10.5px] text-muted">
                Tip: In Routino workspace, pressing <strong>F</strong> launches the focus timer with your last chosen audio preset.
              </p>
            </div>

            {/* Interactive Demo 2: EB Meter & Roommate Bill Estimator */}
            <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap size={18} className="text-[#b45309]" />
                    <h3 className="text-[17px] font-bold text-ink">Interactive PG Electricity Estimator</h3>
                  </div>
                  <span className="rounded-full bg-[#fffbeb] border border-[#fde68a] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309]">
                    Rate: ₹12/unit
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] text-muted">
                  Test the smart sub-meter calculation logic. Adjust meter reading and sharing count to preview daily burn velocity and 50/50 month-end settlement.
                </p>

                {/* Meter Reading Input */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                      Current Meter Reading
                    </label>
                    <input
                      type="number"
                      value={ebInputReading}
                      onChange={(e) => setEbInputReading(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-line px-3 text-[14px] font-bold text-ink focus:border-forest focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                      Roommates Sharing
                    </label>
                    <select
                      value={ebRoommateSplit}
                      onChange={(e) => setEbRoommateSplit(Number(e.target.value))}
                      className="w-full h-10 rounded-xl border border-line px-3 text-[13px] font-semibold text-ink focus:border-forest focus:outline-none"
                    >
                      <option value={1}>1 Person (Solo)</option>
                      <option value={2}>2 People (50/50 Split)</option>
                      <option value={3}>3 People (3-Way Split)</option>
                      <option value={4}>4 People</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Calculation Result Card */}
                <div className="mt-4 rounded-2xl bg-[#fafbf7] border border-line p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase">Burn Rate</span>
                      <p className="text-[16px] font-extrabold text-ink mt-0.5">~{dailyBurn} u/d</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted uppercase">30-Day Forecast</span>
                      <p className="text-[16px] font-extrabold text-ink mt-0.5">₹{projectedTotalCost}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-forest uppercase">Your Share</span>
                      <p className="text-[16px] font-extrabold text-forest mt-0.5">₹{myProjectedShare}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0f2eb] flex items-center justify-between text-[11px] text-muted">
                <span>Integrated directly into Trackers Hub Tab 2</span>
                <Link href="/dashboard" className="font-bold text-forest hover:underline">
                  Open in Workspace →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: "How It Works" in 3 Steps ─── */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-widest text-forest">Workflow</span>
          <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold text-ink tracking-tight">
            From morning chaotic tabs to complete operational clarity
          </h2>
          <p className="mt-3 text-[15px] text-muted">
            Three simple steps to establish your distraction-free daily workspace.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card relative">
            <span className="text-[36px] font-black text-forest/20 absolute top-5 right-6">01</span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-forest/10 text-forest mb-4">
              <Globe size={18} />
            </div>
            <h3 className="text-[17px] font-bold text-ink">Connect or Run Offline</h3>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              Connect Google Calendar and Microsoft Outlook in one click via Auth.js, or launch in 100% offline Preview Mode with pre-populated seed data.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card relative">
            <span className="text-[36px] font-black text-forest/20 absolute top-5 right-6">02</span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-forest/10 text-forest mb-4">
              <Target size={18} />
            </div>
            <h3 className="text-[17px] font-bold text-ink">Establish Daily Rhythm</h3>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              Set today&apos;s priority tasks, review up-next meetings, activate your micro-habits streak (H), and trigger synthesized focus timer blocks (F).
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl border border-line bg-white p-7 shadow-card relative">
            <span className="text-[36px] font-black text-forest/20 absolute top-5 right-6">03</span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-forest/10 text-forest mb-4">
              <Layers size={18} />
            </div>
            <h3 className="text-[17px] font-bold text-ink">Track Lifetime Operations</h3>
            <p className="mt-2 text-[13px] text-muted leading-relaxed">
              Monitor 6-profile Antigravity token cooldowns, electricity consumption burn rates, multi-year expenses, and career interview pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Trackers Hub Deep Dive ─── */}
      <section id="trackers" className="py-16 sm:py-24 bg-[#fafbf7] border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-forest">Command Center</span>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold text-ink tracking-tight">
              7 Specialized Engines in the Trackers Hub
            </h2>
            <p className="mt-3 text-[15px] text-muted">
              Unified operational visibility synchronized seamlessly with Google Sheets or self-contained locally.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tracker 1 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Key size={16} className="text-[#059669]" />
                <h4 className="text-[15px] font-bold text-ink">Antigravity Token Management</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Tracks 36 account tokens across 6 Chrome profiles with real-time countdowns, profile filters, and a 1-click &ldquo;Copy Next Ready&rdquo; button with clipboard feedback.
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → Tokens Tab</div>
            </div>

            {/* Tracker 2 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Zap size={16} className="text-[#b45309]" />
                <h4 className="text-[15px] font-bold text-ink">PG Electricity (EB) Meter</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Sub-meter loggers, daily burn velocity (~1.92 u/day), automated 50/50 roommate cost splitting, and month-end settlement forecasts with quick logger modal.
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → EB Tab</div>
            </div>

            {/* Tracker 3 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Wallet size={16} className="text-[#059669]" />
                <h4 className="text-[15px] font-bold text-ink">Expense & Budget Journals</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Multi-year financial ledgers (2026, 2025, 2024, PG) with monthly budget burn-down bars, color-coded spend thresholds, category breakdown pills, and CSV export.
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → Expenses Tab</div>
            </div>

            {/* Tracker 4 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Briefcase size={16} className="text-[#1d4ed8]" />
                <h4 className="text-[15px] font-bold text-ink">Placement & Career Hub</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Tracks 31+ job applications with Smart Link Extractor for Drive briefs & Google Forms, 1-click candidate brief copying, and timeline freshness pills.
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → Placements Tab</div>
            </div>

            {/* Tracker 5 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Award size={16} className="text-[#7c3aed]" />
                <h4 className="text-[15px] font-bold text-ink">Education & Investment Ledger</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Visual lifetime breakdown (University 95.1% vs Schooling 4.9%) of ₹22.76L investment, B.Tech fee ledger with merit scholarships, and 100% funded contributor status.
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → Investments Tab</div>
            </div>

            {/* Tracker 6 */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs hover:border-forest/40 transition">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Laptop size={16} className="text-ink" />
                <h4 className="text-[15px] font-bold text-ink">Gadgets & Assets Registry</h4>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Complete hardware asset inventory with brand filtering (Apple, Dell, LG, Green Soul), price sorting, and dynamic lifecycle badges (&lt; 1 Yr Warranty vs Mature).
              </p>
              <div className="mt-3 text-[11px] font-bold text-forest">Shortcut: 6 → Purchases Tab</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Security & Open Source Guarantee ─── */}
      <section id="security" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-[#182a20] to-[#122119] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#a7f3d0]">
              Zero-Knowledge Security Architecture
            </span>
            <h2 className="mt-4 text-[28px] sm:text-[36px] font-extrabold tracking-tight">
              Your notes and data never leave your control unencrypted.
            </h2>
            <p className="mt-3 text-[14.5px] text-[#cbd5e1] leading-relaxed">
              Routino is built on strict local-first security principles. When using the Keep Notes vault, keys are derived entirely within your client browser using Web Crypto API. We never see your PIN, password, or unencrypted text.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px]">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <strong className="text-white block">PBKDF2 Key Derivation</strong>
                <span className="text-[#94a3b8] text-[11.5px]">100,000 rounds of SHA-256 with cryptographic salt</span>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <strong className="text-white block">AES-256-GCM Encryption</strong>
                <span className="text-[#94a3b8] text-[11.5px]">Authenticated ciphertext with unique 96-bit IVs</span>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <strong className="text-white block">No External Sound Tracking</strong>
                <span className="text-[#94a3b8] text-[11.5px]">Pure Web Audio API math, zero audio requests</span>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <strong className="text-white block">100% Open Source (MIT)</strong>
                <span className="text-[#94a3b8] text-[11.5px]">Inspect every single line of code on GitHub</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-ink hover:bg-[#f1f3ed] transition"
              >
                <Github size={14} />
                <span>Audit on GitHub</span>
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[12.5px] font-bold text-white hover:bg-white/20 transition"
              >
                <span>Launch Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 7: FAQ Accordion ─── */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-forest">Common Questions</span>
          <h2 className="mt-2 text-[28px] sm:text-[34px] font-extrabold text-ink tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Can I use Routino without signing into Google or Microsoft?",
              a: "Yes! Routino functions 100% out of the box in standalone Preview Mode with full access to focus timers, ambient audio synthesis, habits, encrypted notes, and seeded multi-stream trackers.",
            },
            {
              q: "How does the Live Google Sheets synchronization work?",
              a: "Routino connects to your Google Sheet via secure read-only GViz endpoints or environment-configured spreadsheet IDs. It features smart zero-refresh sync: whenever you refocus your browser tab or switch views, it checks for fresh rows automatically.",
            },
            {
              q: "Can anyone read my encrypted notes?",
              a: "No. Your master PIN is never sent to any server. It is hashed client-side with PBKDF2 (100,000 iterations) to generate an AES-256 encryption key. Without your master PIN, your notes cannot be decrypted by anyone.",
            },
            {
              q: "Are the ambient sounds streaming from an external music server?",
              a: "Not at all. Routino uses the browser's built-in Web Audio API to procedurally generate white and brown noise filters that simulate rain, waves, and ambient frequency bands in real-time with zero bandwidth overhead.",
            },
            {
              q: "Is Routino completely free and open-source?",
              a: "Yes. Routino is licensed under the MIT License and open-sourced on GitHub. You can host it on Vercel, run it locally via Node.js, or contribute to its feature roadmap.",
            },
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-white p-5 shadow-2xs transition">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-[14.5px] font-bold text-ink cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform duration-200 ${openFaq === idx ? "rotate-180 text-forest" : ""}`}
                />
              </button>
              {openFaq === idx && (
                <p className="mt-3 text-[13px] text-muted leading-relaxed border-t border-line/60 pt-3 animate-in fade-in duration-150">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 8: Final Call to Action ─── */}
      <section className="py-16 sm:py-20 bg-linear-to-b from-[#fcfcf9] to-[#f4f6f0] border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-[30px] sm:text-[40px] font-extrabold text-ink tracking-tight">
            Ready to streamline your daily operations?
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-[15px] text-muted">
            Launch Routino instantly. Distraction-free calendar planning, synthesized deep-work audio, encrypted notes, and executive tracking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-7 py-3.5 text-[14px] font-bold text-white hover:bg-[#1a3424] transition shadow-md group"
            >
              <span>Launch Routino Dashboard</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-[14px] font-semibold text-ink hover:bg-[#f1f3ed] transition shadow-2xs"
            >
              <Github size={15} />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-line bg-white py-12 text-[12.5px] text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Routino" className="h-6 w-6 rounded-lg" />
            <span className="font-bold text-ink">Routino Daily Dashboard</span>
            <span className="text-[#a2aaa2]">·</span>
            <span>MIT License</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-forest transition">Dashboard</Link>
            <a href="#features" className="hover:text-forest transition">Features</a>
            <a href="#trackers" className="hover:text-forest transition">Trackers</a>
            <a href="#security" className="hover:text-forest transition">Security</a>
            <a
              href="https://github.com/Itssanthoshhere/Routino-Daily-Dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-forest transition"
            >
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#047857]">
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
