/**
 * Native synthesizer for timers & focus environments using Web Audio API.
 * Avoids any external assets to guarantee zero CORS or network failures.
 */

let audioCtx: AudioContext | null = null;
let ambientSource: AudioWorkletNode | ScriptProcessorNode | null = null;
let ambientGain: GainNode | null = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audio = {
  /**
   * Play a clean, musical bell / beep notification sound for pomodoro sessions.
   */
  playAlert(type: "work" | "break") {
    try {
      const ctx = getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "work") {
        // High double-tone chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      } else {
        // Soft restorative chime
        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.2); // A4
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
      }
    } catch (e) {
      console.warn("Could not play audio alert:", e);
    }
  },

  /**
   * Start generating realistic, soothing brown/pink focus noise synthetically.
   */
  startFocusNoise(type: "rain" | "brown" | "waves") {
    try {
      const ctx = getContext();
      this.stopFocusNoise();

      const bufferSize = 4096;
      const sampleRate = ctx.sampleRate;
      
      // Use native ScriptProcessor to generate synthesis procedural noise
      const node = ctx.createScriptProcessor(bufferSize, 1, 1);
      ambientGain = ctx.createGain();
      
      let lastOut = 0.0;

      node.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          
          if (type === "brown") {
            // Brown noise approximation: integrate white noise, scaling down to avoid drift
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            output[i] = lastOut * 3.5; // Gain multiplier
          } else if (type === "rain") {
            // High frequency crackle + background rumble
            lastOut = (lastOut + (0.015 * white)) / 1.015;
            const crackle = Math.random() > 0.98 ? (Math.random() * 0.1) : 0;
            output[i] = (lastOut * 1.5) + crackle;
          } else {
            // Waves/Ocean: brown noise modulated by slow LFO sine
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            const lfo = Math.sin(2 * Math.PI * 0.08 * (ctx.currentTime + (i / sampleRate)));
            const waveGain = 0.3 + 0.7 * (lfo * 0.5 + 0.5);
            output[i] = lastOut * 3.5 * waveGain;
          }
        }
      };

      node.connect(ambientGain);
      ambientGain.connect(ctx.destination);
      ambientGain.gain.setValueAtTime(0.15, ctx.currentTime);

      ambientSource = node;
    } catch (e) {
      console.warn("Could not start focus noise:", e);
    }
  },

  /**
   * Stop any running background focus noise generator cleanly.
   */
  stopFocusNoise() {
    if (ambientSource) {
      try {
        ambientSource.disconnect();
      } catch (e) {}
      ambientSource = null;
    }
    if (ambientGain) {
      try {
        ambientGain.disconnect();
      } catch (e) {}
      ambientGain = null;
    }
  }
};
