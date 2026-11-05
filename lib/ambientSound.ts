// Web Audio API ambient sound generator for focus sessions
// Generates continuous noisescapes without external audio files

export type AmbientSoundType = "off" | "rain" | "brown" | "waves";

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = "off";
  private sourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private volume: number = 0.35;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Create 5 seconds of looped white noise buffer
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public start(type: AmbientSoundType) {
    this.stop();
    if (type === "off") {
      this.currentType = "off";
      return;
    }

    const ctx = this.getContext();
    if (!ctx) return;

    this.currentType = type;
    const noiseBuffer = this.createNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Master gain
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.2);
    this.gainNode.connect(ctx.destination);

    if (type === "brown") {
      // Brown noise: Heavy low-pass filter around 350Hz creates a deep, cozy rumble
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(320, ctx.currentTime);
      lowpass.Q.setValueAtTime(1, ctx.currentTime);

      const lowpass2 = ctx.createBiquadFilter();
      lowpass2.type = "lowpass";
      lowpass2.frequency.setValueAtTime(450, ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(lowpass2);
      lowpass2.connect(this.gainNode);
    } else if (type === "rain") {
      // Rain: Bandpass + high-shelf combination with subtle resonance
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1000, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.7, ctx.currentTime);

      const highshelf = ctx.createBiquadFilter();
      highshelf.type = "highshelf";
      highshelf.frequency.setValueAtTime(3000, ctx.currentTime);
      highshelf.gain.setValueAtTime(-6, ctx.currentTime);

      noiseSource.connect(bandpass);
      bandpass.connect(highshelf);
      highshelf.connect(this.gainNode);
    } else if (type === "waves") {
      // Ocean Waves: Lowpass filter modulated by a slow LFO (~0.12 Hz, every 8 seconds)
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second swell cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(300, ctx.currentTime); // Swells between 100Hz and 700Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      this.lfoNode = lfo;
      this.lfoGain = lfoGain;

      noiseSource.connect(filter);
      filter.connect(this.gainNode);
    }

    noiseSource.start();
    this.sourceNode = noiseSource;
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      } catch {}
    }

    setTimeout(() => {
      if (this.sourceNode) {
        try {
          (this.sourceNode as AudioScheduledSourceNode).stop();
        } catch {}
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.lfoNode) {
        try {
          this.lfoNode.stop();
        } catch {}
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.lfoGain) {
        this.lfoGain.disconnect();
        this.lfoGain = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    }, 550);

    this.currentType = "off";
  }
}

export const ambientSound = new AmbientSoundEngine();
