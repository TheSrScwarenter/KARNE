// Web Audio API offline soundscapes & dopamine chimes generator
// 100% client-side, zero external assets or network dependencies required

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSoundscape: string | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a dopamine rewarding chime when completing a session or milestone
  public playSuccessChime(type: 'milestone' | 'complete' | 'level_up' = 'complete') {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes =
        type === 'level_up'
          ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
          : type === 'milestone'
          ? [587.33, 880.0] // D5, A5
          : [440.0, 554.37, 659.25, 880.0]; // A4, C#5, E5, A5

      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.001, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Play subtle tick or start bell
  public playStartBell() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(528, now); // 528 Hz transformation frequency

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch (e) {
      console.warn('Audio start bell error:', e);
    }
  }

  // Start continuous ambient soundscape (White Noise, Rain, Cafe Drone, Binaural Wave)
  public startSoundscape(type: 'rain' | 'binaural' | 'whitenoise' | 'brownnoise') {
    this.stopSoundscape();
    try {
      this.initContext();
      if (!this.ctx) return;

      this.currentSoundscape = type;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      if (type === 'binaural') {
        // Binaural 40Hz Gamma frequency focus beat
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const pan1 = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const pan2 = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        osc1.frequency.setValueAtTime(200, this.ctx.currentTime); // Left 200 Hz
        osc2.frequency.setValueAtTime(240, this.ctx.currentTime); // Right 240 Hz (40Hz difference = Gamma flow)

        if (pan1 && pan2) {
          pan1.pan.value = -1;
          pan2.pan.value = 1;
          osc1.connect(pan1);
          pan1.connect(this.gainNode);
          osc2.connect(pan2);
          pan2.connect(this.gainNode);
        } else {
          osc1.connect(this.gainNode);
          osc2.connect(this.gainNode);
        }

        osc1.start();
        osc2.start();
        this.noiseNode = osc1; // store reference
      } else {
        // Synthesized Noise (Rain / Brown / White)
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'brownnoise' || type === 'rain') {
            // Brown noise filter
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.5;
          } else {
            // White noise
            data[i] = white * 0.3;
          }
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Add filter
        const filter = this.ctx.createBiquadFilter();
        if (type === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        } else if (type === 'brownnoise') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        } else {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        }

        noise.connect(filter);
        filter.connect(this.gainNode);
        noise.start();
        this.noiseNode = noise;
      }
    } catch (e) {
      console.warn('Soundscape start error:', e);
    }
  }

  public stopSoundscape() {
    try {
      if (this.noiseNode) {
        if ((this.noiseNode as any).stop) {
          (this.noiseNode as any).stop();
        }
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.currentSoundscape = null;
    } catch (e) {
      console.warn('Soundscape stop error:', e);
    }
  }

  public getCurrentSoundscape(): string | null {
    return this.currentSoundscape;
  }
}

export const focusAudio = new FocusAudioEngine();
