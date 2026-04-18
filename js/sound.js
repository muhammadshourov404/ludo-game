class SoundEngine {
    constructor() { this.context = new (window.AudioContext || window.webkitAudioContext)(); }
    play(type) {
        if (this.context.state === 'suspended') this.context.resume();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain); gain.connect(this.context.destination);
        
        if (type === 'dice') {
            osc.type = 'square'; osc.frequency.setValueAtTime(150, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            osc.start(); osc.stop(this.context.currentTime + 0.1);
        } else if (type === 'move') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
            osc.start(); osc.stop(this.context.currentTime + 0.05);
        } else if (type === 'capture') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.context.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, this.context.currentTime); gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);
            osc.start(); osc.stop(this.context.currentTime + 0.3);
        } else if (type === 'home') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.5, this.context.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, this.context.currentTime); gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);
            osc.start(); osc.stop(this.context.currentTime + 0.2);
        }
    }
}
export const sounds = new SoundEngine();
