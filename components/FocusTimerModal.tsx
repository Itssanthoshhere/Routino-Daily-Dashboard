"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Focus,
  CloudRain,
  Waves,
  Coffee,
  Plus,
  Minus,
} from "lucide-react";
import { playChime, playTick } from "@/lib/sound";
import { ambientSound, AmbientSoundType } from "@/lib/ambientSound";

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
  const [ambientType, setAmbientType] = useState<AmbientSoundType>("off");
  const [intention, setIntention] = useState("Deep work & intentional focus");
  const [isCustomPreset, setIsCustomPreset] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState("45");

  // Always terminate ambient sound cleanly on unmount
  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  // When preset changes, update timer and stop previous sound
  useEffect(() => {
    setTimeLeft(selectedPreset * 60);
    setIsRunning(false);
    ambientSound.stop();
  }, [selectedPreset]);

  // Handle ambient sound playback strictly linked to running state
  useEffect(() => {
    if (isRunning && ambientType !== "off") {
      ambientSound.start(ambientType);
    } else {
      ambientSound.stop();
    }
  }, [isRunning, ambientType]);

  // Instantly kill sound whenever modal is closed
  useEffect(() => {
    if (!isOpen) {
      ambientSound.stop();
      setIsRunning(false);
    }
  }, [isOpen]);

  // Countdown timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            ambientSound.stop();
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
  const totalSeconds = Math.max(1, selectedPreset * 60);
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  const handleClose = () => {
    setIsRunning(false);
    ambientSound.stop();
    onClose();
  };

  const handleReset = () => {
    setIsRunning(false);
    ambientSound.stop();
    setTimeLeft(selectedPreset * 60);
  };

  const handleTogglePlay = () => {
    if (soundEnabled && !isRunning) {
      playTick();
    }
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (!nextRunning) {
      ambientSound.stop();
    }
  };

  const handleSelectAmbient = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (type === "off") {
      ambientSound.stop();
    } else if (isRunning) {
      ambientSound.start(type);
    }
  };

  // Add minutes dynamically to current timer session (e.g. +5m, +10m)
  const handleAddMinutes = (additionalMinutes: number) => {
    if (soundEnabled) playTick();
    const additionalSeconds = additionalMinutes * 60;
    setTimeLeft((prev) => prev + additionalSeconds);
    setSelectedPreset((prev) => prev + additionalMinutes);
  };

  // Set custom minutes directly
  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customMinutesInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 360) {
      setIsRunning(false);
      ambientSound.stop();
      setSelectedPreset(parsed);
      setTimeLeft(parsed * 60);
      setIsCustomPreset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-[#fbfcf8] p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest text-accent shadow-sm">
              <Focus size={16} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Focus Timer</h3>
              <p className="text-[11px] text-muted">A calm space for uninterrupted flow</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted hover:bg-[#edf0e9] hover:text-ink transition"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setIsCustomPreset(false);
                setSelectedPreset(preset.minutes);
              }}
              className={`rounded-xl py-2 px-1 text-center text-[10px] font-medium transition ${
                !isCustomPreset && selectedPreset === preset.minutes
                  ? "bg-forest font-semibold text-white shadow-sm"
                  : "bg-white border border-line text-[#5c6960] hover:bg-[#f1f3ed]"
              }`}
            >
              <span className="block truncate">{preset.label}</span>
              <span className="block text-[9px] opacity-75 mt-0.5">{preset.minutes}m</span>
            </button>
          ))}
          <button
            onClick={() => setIsCustomPreset(!isCustomPreset)}
            className={`rounded-xl py-2 px-1 text-center text-[10px] font-medium transition ${
              isCustomPreset
                ? "bg-forest font-semibold text-white shadow-sm"
                : "bg-white border border-line text-[#5c6960] hover:bg-[#f1f3ed]"
            }`}
          >
            <span className="block truncate">Custom</span>
            <span className="block text-[9px] opacity-75 mt-0.5">{selectedPreset}m</span>
          </button>
        </div>

        {/* Custom Duration Input Form */}
        {isCustomPreset && (
          <form
            onSubmit={handleApplyCustomMinutes}
            className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white p-2.5 animate-in fade-in"
          >
            <span className="text-[11px] font-semibold text-ink whitespace-nowrap">
              Duration (minutes):
            </span>
            <input
              type="number"
              min="1"
              max="360"
              autoFocus
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="w-16 rounded-lg border border-line bg-[#fbfcf9] px-2 py-1 text-center text-[12px] font-bold text-ink outline-none focus:border-forest"
            />
            <button
              type="submit"
              className="rounded-lg bg-forest px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition ml-auto"
            >
              Set Timer
            </button>
          </form>
        )}

        {/* Circular Progress & Digital Display */}
        <div className="my-5 flex flex-col items-center">
          <div className="relative flex h-44 w-44 sm:h-48 sm:w-48 items-center justify-center">
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
              <span className="font-mono text-[34px] sm:text-[38px] font-bold tracking-tight text-ink">
                {formattedTime}
              </span>
              <span className="mt-1 flex items-center gap-1 rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-forest">
                <Sparkles size={11} />
                {isRunning ? "FOCUSING" : timeLeft === 0 ? "DONE" : "READY"}
              </span>
            </div>
          </div>

          {/* Quick Extend Minutes Buttons */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Add Time:
            </span>
            <button
              type="button"
              onClick={() => handleAddMinutes(1)}
              className="rounded-lg border border-line bg-white px-2 py-1 text-[10px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] hover:text-ink transition"
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => handleAddMinutes(5)}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition"
              title="Add 5 minutes"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => handleAddMinutes(10)}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition"
              title="Add 10 minutes"
            >
              +10m
            </button>
            <button
              type="button"
              onClick={() => handleAddMinutes(15)}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-forest hover:bg-[#fdf2f2] transition"
              title="Add 15 minutes"
            >
              +15m
            </button>
          </div>
        </div>

        {/* Current Intention */}
        <div className="mb-3 rounded-xl border border-line bg-white p-3">
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

        {/* Ambient Soundscapes */}
        <div className="mb-4 rounded-xl border border-line bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Ambient Soundscape
            </span>
            <span className="text-[10px] text-forest font-medium">
              {ambientType === "off"
                ? "Off"
                : ambientType === "rain"
                ? "Gentle Rain"
                : ambientType === "waves"
                ? "Ocean Waves"
                : "Deep Noise"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectAmbient("off")}
              className={`rounded-lg py-1.5 px-2 text-[10px] font-medium transition ${
                ambientType === "off"
                  ? "bg-[#f1f3ed] text-ink font-semibold"
                  : "text-muted hover:bg-[#fafbf8]"
              }`}
            >
              None
            </button>
            <button
              type="button"
              onClick={() => handleSelectAmbient("rain")}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-[10px] font-medium transition ${
                ambientType === "rain"
                  ? "bg-[#edf3ff] text-[#4f76b8] font-semibold ring-1 ring-[#4f76b8]/30"
                  : "text-muted hover:bg-[#fafbf8]"
              }`}
            >
              <CloudRain size={12} /> Rain
            </button>
            <button
              type="button"
              onClick={() => handleSelectAmbient("waves")}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-[10px] font-medium transition ${
                ambientType === "waves"
                  ? "bg-[#e8f7f5] text-[#2d7d74] font-semibold ring-1 ring-[#2d7d74]/30"
                  : "text-muted hover:bg-[#fafbf8]"
              }`}
            >
              <Waves size={12} /> Waves
            </button>
            <button
              type="button"
              onClick={() => handleSelectAmbient("brown")}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-[10px] font-medium transition ${
                ambientType === "brown"
                  ? "bg-[#fbefe5] text-[#a17652] font-semibold ring-1 ring-[#a17652]/30"
                  : "text-muted hover:bg-[#fafbf8]"
              }`}
            >
              <Coffee size={12} /> Noise
            </button>
          </div>
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
              title="Reset timer"
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
