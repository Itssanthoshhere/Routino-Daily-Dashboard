"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Sparkles, Check, Focus } from "lucide-react";
import { playChime, playTick } from "@/lib/sound";

type FocusTimerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete?: (minutes: number) => void;
};

const PRESETS = [
  { label: "Pomodoro", minutes: 25 },
  { label: "Deep Focus", minutes: 50 },
  { label: "Short Break", minutes: 5 },
  { label: "Long Break", minutes: 15 },
];

export function FocusTimerModal({ isOpen, onClose, onSessionComplete }: FocusTimerModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [intention, setIntention] = useState("Roadmap planning & review");

  useEffect(() => {
    setTimeLeft(selectedPreset * 60);
    setIsRunning(false);
  }, [selectedPreset]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) playChime();
            onSessionComplete?.(selectedPreset);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, selectedPreset, soundEnabled, onSessionComplete]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalSeconds = selectedPreset * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset * 60);
  };

  const handleTogglePlay = () => {
    if (soundEnabled && !isRunning) {
      playTick();
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest text-accent">
              <Focus size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Focus Timer</h3>
              <p className="text-[11px] text-muted">A calm space for uninterrupted flow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSelectedPreset(preset.minutes)}
              className={`rounded-xl py-2 px-1 text-center text-[11px] font-medium transition ${
                selectedPreset === preset.minutes
                  ? "bg-forest font-semibold text-white shadow-sm"
                  : "bg-white border border-line text-[#5c6960] hover:bg-[#f1f3ed]"
              }`}
            >
              {preset.label}
              <span className="block text-[9px] opacity-75 mt-0.5">{preset.minutes}m</span>
            </button>
          ))}
        </div>

        {/* Circular Progress & Digital Display */}
        <div className="my-7 flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-[#edf0ea]"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-forest transition-all duration-500 ease-out"
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-[38px] font-bold tracking-tight text-ink">
                {formattedTime}
              </span>
              <span className="mt-1 flex items-center gap-1 rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[10px] font-semibold text-forest">
                <Sparkles size={11} />
                {isRunning ? "FOCUSING" : timeLeft === 0 ? "DONE" : "READY"}
              </span>
            </div>
          </div>
        </div>

        {/* Current Intention */}
        <div className="mb-5 rounded-xl border border-line bg-white p-3">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Focus Intention
          </label>
          <input
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What are you focusing on?"
            className="mt-1 w-full bg-transparent text-[12px] font-medium text-ink outline-none placeholder:text-[#a0aaa1]"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] text-muted hover:text-ink transition"
            title="Toggle sound chime"
          >
            {soundEnabled ? <Volume2 size={14} className="text-forest" /> : <VolumeX size={14} />}
            <span className="text-[10px]">{soundEnabled ? "Sound On" : "Muted"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-muted hover:text-ink transition"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleTogglePlay}
              className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-[12px] font-semibold text-white shadow transition hover:bg-[#8b1116]"
            >
              {isRunning ? (
                <>
                  <Pause size={15} /> Pause
                </>
              ) : (
                <>
                  <Play size={15} fill="white" /> {timeLeft === 0 ? "Restart" : "Start Focus"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
