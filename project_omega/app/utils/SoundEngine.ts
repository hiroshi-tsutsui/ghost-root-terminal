export class SoundEngine {
  private ctx: AudioContext | null = null;
  private targetOsc: OscillatorNode | null = null;
  private playerOsc: OscillatorNode | null = null;
  private targetGain: GainNode | null = null;
  private playerGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = true; // Start muted for UX

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0; // Start muted
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  start() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Create Oscillators if not exist
    if (!this.targetOsc) {
       this.targetOsc = this.ctx.createOscillator();
       this.targetOsc.type = 'sine';
       this.targetGain = this.ctx.createGain();
       this.targetGain.gain.value = 0; 
       this.targetOsc.connect(this.targetGain);
       if (this.masterGain) this.targetGain.connect(this.masterGain);
       this.targetOsc.start();
    }

    if (!this.playerOsc) {
       this.playerOsc = this.ctx.createOscillator();
       this.playerOsc.type = 'triangle'; 
       this.playerGain = this.ctx.createGain();
       this.playerGain.gain.value = 0; 
       this.playerOsc.connect(this.playerGain);
       if (this.masterGain) this.playerGain.connect(this.masterGain);
       this.playerOsc.start();
    }
  }

  update(params: {
      targetFreq: number, 
      playerFreq: number, 
      targetAmp: number, 
      playerAmp: number, 
      resonance: number
  }) {
    if (!this.ctx || !this.targetOsc || !this.playerOsc) return;

    const now = this.ctx.currentTime;
    
    // Frequencies (Base 220Hz)
    // Scale factor: 0.5 - 3.0 => 110Hz - 660Hz
    const baseFreq = 220;
    
    // Clamp frequencies to avoid ultra-low/high
    const f1 = Math.max(50, Math.min(2000, baseFreq * params.targetFreq));
    const f2 = Math.max(50, Math.min(2000, baseFreq * params.playerFreq));

    this.targetOsc.frequency.setTargetAtTime(f1, now, 0.1);
    this.playerOsc.frequency.setTargetAtTime(f2, now, 0.1);

    // Amplitude (Volume)
    // Max volume 0.15 per osc to avoid clipping
    const tVol = Math.min(0.15, params.targetAmp * 0.05);
    const pVol = Math.min(0.15, params.playerAmp * 0.05);

    if (this.targetGain) this.targetGain.gain.setTargetAtTime(tVol, now, 0.1);
    if (this.playerGain) this.playerGain.gain.setTargetAtTime(pVol, now, 0.1);

    // Timbre / Phase Shift Auditory Feedback
    // If resonance is high, player becomes Sine (Pure Harmony)
    if (params.resonance > 95) {
        this.playerOsc.type = 'sine';
    } else {
        this.playerOsc.type = 'triangle'; // Buzzier
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        // Fade in/out to avoid popping
        this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.3, now, 0.1);
        
        if (!this.isMuted && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    return this.isMuted;
  }
  
  stop() {
     if (this.targetOsc) {
         try { this.targetOsc.stop(); this.targetOsc.disconnect(); } catch(e){}
         this.targetOsc = null;
     }
     if (this.playerOsc) {
         try { this.playerOsc.stop(); this.playerOsc.disconnect(); } catch(e){}
         this.playerOsc = null;
     }
  }
}
