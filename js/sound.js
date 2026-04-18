// js/sound.js - By V4MPIR3
// Generating procedural audio using Web Audio API (No .mp3 files needed)

class SoundEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    play(type) {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        switch(type) {
            case 'dice': this.playDiceSound(); break;
            case 'move': this.playMoveSound(); break;
            case 'capture': this.playCaptureSound(); break;
            case 'home': this.playHomeSound(); break;
        }
    }

    playDiceSound() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }

    playMoveSound() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }

    playCaptureSound() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.context.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }

    playHomeSound() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, this.context.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, this.context.currentTime + 0.2); // C6
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    }
}

export const sounds = new SoundEngine();
