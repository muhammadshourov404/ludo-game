/* =============================================
   LUDO NEXUS — Sound System (js/sound.js)
   Web Audio API — No external files needed
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const Sound = (() => {
  let ctx = null;
  let enabled = true;
  let musicEnabled = true;
  let volume = 0.7;
  let musicGain = null;
  let musicOsc = null;
  let musicInterval = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ─── Core tone player ───
  function tone(freq, type = 'sine', dur = 0.15, vol = 0.4, delay = 0) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol * volume, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + dur + 0.05);
    } catch(e) {}
  }

  function noise(dur = 0.1, vol = 0.3, delay = 0) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const bufLen = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 800;
      src.buffer = buf;
      src.connect(filter); filter.connect(gain); gain.connect(c.destination);
      gain.gain.setValueAtTime(vol * volume, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      src.start(c.currentTime + delay);
      src.stop(c.currentTime + delay + dur + 0.05);
    } catch(e) {}
  }

  // ─── Sound Library ───
  const sounds = {
    dice() {
      // Shake rattle sound
      noise(0.08, 0.5);
      noise(0.06, 0.4, 0.08);
      noise(0.05, 0.3, 0.15);
      tone(200, 'square', 0.05, 0.2, 0.1);
      tone(180, 'square', 0.05, 0.2, 0.15);
    },
    diceResult(val) {
      const freqs = [220, 261, 294, 330, 370, 440];
      tone(freqs[val - 1] || 330, 'triangle', 0.2, 0.5);
      if (val === 6) {
        // Special 6 celebration
        tone(440, 'sine', 0.1, 0.4, 0.0);
        tone(554, 'sine', 0.1, 0.4, 0.1);
        tone(659, 'sine', 0.15, 0.4, 0.2);
      }
    },
    move() {
      tone(440, 'triangle', 0.08, 0.3);
      tone(520, 'triangle', 0.06, 0.2, 0.06);
    },
    cut() {
      // Dramatic cut sound
      tone(880, 'sawtooth', 0.05, 0.5);
      tone(660, 'sawtooth', 0.08, 0.4, 0.05);
      tone(440, 'sawtooth', 0.1, 0.3, 0.1);
      noise(0.15, 0.4, 0.05);
    },
    enter() {
      // Token entering home base
      tone(523, 'sine', 0.1, 0.4);
      tone(659, 'sine', 0.1, 0.4, 0.08);
      tone(784, 'sine', 0.15, 0.5, 0.16);
    },
    win() {
      const melody = [523,659,784,1046,784,1046];
      melody.forEach((f, i) => tone(f, 'triangle', 0.2, 0.5, i * 0.12));
    },
    button() {
      tone(440, 'sine', 0.06, 0.25);
    },
    magic() {
      [523,659,784,1046,1318].forEach((f, i) => {
        tone(f, 'sine', 0.15, 0.35, i * 0.07);
      });
    },
    shield() {
      tone(880, 'triangle', 0.2, 0.4);
      tone(1760, 'sine', 0.15, 0.2, 0.05);
    },
    freeze() {
      tone(440, 'triangle', 0.3, 0.4);
      tone(330, 'triangle', 0.25, 0.3, 0.1);
      tone(220, 'triangle', 0.2, 0.2, 0.2);
    },
    swap() {
      tone(523, 'sine', 0.1, 0.4);
      tone(784, 'sine', 0.1, 0.4, 0.1);
      tone(523, 'sine', 0.1, 0.4, 0.2);
    },
    timerTick() {
      tone(880, 'square', 0.04, 0.15);
    },
    timerUrgent() {
      tone(1100, 'square', 0.06, 0.25);
      tone(1100, 'square', 0.06, 0.25, 0.1);
    },
    notification() {
      tone(880, 'sine', 0.1, 0.3);
      tone(1100, 'sine', 0.1, 0.25, 0.1);
    },
    error() {
      tone(220, 'sawtooth', 0.1, 0.3);
      tone(180, 'sawtooth', 0.1, 0.3, 0.1);
    },
    gameStart() {
      [261,329,392,523].forEach((f, i) => tone(f, 'triangle', 0.2, 0.5, i * 0.1));
    },
    powerUp() {
      for (let i = 0; i < 5; i++) {
        tone(200 + i * 120, 'sine', 0.12, 0.4, i * 0.06);
      }
    }
  };

  // ─── Background Music ───
  function startMusic() {
    if (!musicEnabled || musicOsc) return;
    try {
      const c = getCtx();
      musicGain = c.createGain();
      musicGain.connect(c.destination);
      musicGain.gain.value = 0.04 * volume;

      const scale = [261, 294, 329, 349, 392, 440, 494, 523];
      let step = 0;

      function playNote() {
        if (!musicEnabled || !musicGain) return;
        const c2 = getCtx();
        const osc = c2.createOscillator();
        const g = c2.createGain();
        osc.connect(g); g.connect(musicGain);
        osc.type = 'sine';
        osc.frequency.value = scale[step % scale.length];
        g.gain.setValueAtTime(0.8, c2.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.4);
        osc.start(c2.currentTime);
        osc.stop(c2.currentTime + 0.45);
        step = (step + Math.floor(Math.random() * 3) + 1) % scale.length;
      }

      musicInterval = setInterval(playNote, 600);
    } catch(e) {}
  }

  function stopMusic() {
    if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
    if (musicGain) {
      try { musicGain.disconnect(); } catch(e) {}
      musicGain = null;
    }
    musicOsc = null;
  }

  // ─── Public API ───
  return {
    play(name, ...args) {
      if (!enabled) return;
      const fn = sounds[name];
      if (fn) { try { fn(...args); } catch(e) {} }
    },
    toggle() {
      enabled = !enabled;
      const btn = document.querySelector('.hud-btn[onclick*="Sound.toggle"]');
      if (btn) btn.textContent = enabled ? '🔊' : '🔇';
      if (!enabled) stopMusic();
      else this.startBgMusic();
    },
    setSFX(val) { enabled = val; },
    setMusic(val) {
      musicEnabled = val;
      if (musicEnabled) startMusic();
      else stopMusic();
    },
    setVolume(val) {
      volume = val / 100;
      if (musicGain) musicGain.gain.value = 0.04 * volume;
      const el = document.getElementById('volume-val');
      if (el) el.textContent = val + '%';
    },
    startBgMusic() { if (musicEnabled) startMusic(); },
    stopBgMusic()  { stopMusic(); },
    init() {
      // Start on first user interaction
      document.addEventListener('click', () => {
        this.startBgMusic();
      }, { once: true });
    }
  };
})();

Sound.init();
