// Sound system using Web Audio API
class SoundManager {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.initAudio();
  }
  
  initAudio() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }
  
  async playDiceRoll() {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }
  
  async playMove() {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }
  
  async playCapture() {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + 0.15);
    
    setTimeout(() => {
      const osc2 = this.context.createOscillator();
      const gain2 = this.context.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.value = 800;
      gain2.gain.setValueAtTime(0.15, this.context.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
      osc2.connect(gain2);
      gain2.connect(this.context.destination);
      osc2.start();
      osc2.stop(this.context.currentTime + 0.1);
    }, 150);
  }
  
  async playWin() {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();
    
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, this.context.currentTime + i*0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i*0.15 + 0.3);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(this.context.currentTime + i*0.15);
      osc.stop(this.context.currentTime + i*0.15 + 0.3);
    });
  }
  
  async playCardDraw() {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }
}

export const soundManager = new SoundManager();
