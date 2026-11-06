// Web Audio API ambient sound generator for focus sessions
// Generates continuous noisescapes without external audio files

export type AmbientSoundType = "off" | "rain" | "waves" | "forest" | "cafe" | "brown";

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = "off";
  private sourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private volume: number = 0.35;
  private stopTimeout: NodeJS.Timeout | null = null;

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
      try {
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      } catch {}
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public start(type: AmbientSoundType) {
    // Immediately terminate any currently playing sounds synchronously
    this.stop(true);

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
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.6);
    masterGain.connect(ctx.destination);
    this.gainNode = masterGain;

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
    } else if (type === "forest") {
      // Forest Breeze: Gentle wind modulated by a slow LFO with rustling bandpass
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.setValueAtTime(650, ctx.currentTime);
      windFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12 sec gentle wind gust cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();

      this.lfoNode = lfo;
      this.lfoGain = lfoGain;

      noiseSource.connect(windFilter);
      windFilter.connect(this.gainNode);
    } else if (type === "cafe") {
      // Café Murmur: Lowpass filtered chatter resonance with warm mid frequencies
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(520, ctx.currentTime);
      lowpass.Q.setValueAtTime(1.4, ctx.currentTime);

      const peaking = ctx.createBiquadFilter();
      peaking.type = "peaking";
      peaking.frequency.setValueAtTime(850, ctx.currentTime);
      peaking.gain.setValueAtTime(4, ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(peaking);
      peaking.connect(this.gainNode);
    }

    noiseSource.start();
    this.sourceNode = noiseSource;
  }

  public stop(immediate: boolean = true) {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    this.currentType = "off";

    // Immediate synchronous teardown to guarantee audio stops instantly
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }

    if (this.sourceNode) {
      try {
        (this.sourceNode as AudioScheduledSourceNode).stop();
      } catch {}
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
      } catch {}
      try {
        this.lfoNode.disconnect();
      } catch {}
      this.lfoNode = null;
    }

    if (this.lfoGain) {
      try {
        this.lfoGain.disconnect();
      } catch {}
      this.lfoGain = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }
}

export const ambientSound = new AmbientSoundEngine();
