/* =============================================
   LUDO NEXUS — Core Game Engine (js/game.js)
   Complete Ludo Game Logic
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

// ─── UI Module ───
const UI = (() => {
  let currentScreen = null;
  let previousScreen = null;
  let deferredPrompt = null;
  const prefs = {
    theme: 'dark',
    sfx: true, music: true, volume: 70,
    vibration: true, animation: true, hints: true
  };

  function loadPrefs() {
    try {
      const saved = localStorage.getItem('ludo_prefs');
      if (saved) Object.assign(prefs, JSON.parse(saved));
    } catch(e) {}
  }
  function savePrefs() {
    try { localStorage.setItem('ludo_prefs', JSON.stringify(prefs)); } catch(e) {}
  }

  function showScreen(id) {
    if (currentScreen) {
      const el = document.getElementById(currentScreen);
      if (el) el.classList.add('hidden');
      previousScreen = currentScreen;
    }
    const next = document.getElementById(id);
    if (next) { next.classList.remove('hidden'); Sound.play('button'); }
    currentScreen = id;
  }

  function back() {
    if (previousScreen) showScreen(previousScreen);
    else showScreen('main-menu');
  }

  function togglePause() {
    const pm = document.getElementById('pause-menu');
    if (!pm) return;
    if (pm.classList.contains('hidden')) {
      pm.classList.remove('hidden');
      if (Game.state) Game.state.paused = true;
    } else {
      pm.classList.add('hidden');
      if (Game.state) Game.state.paused = false;
    }
  }

  function exitToMenu() {
    const pm = document.getElementById('pause-menu');
    if (pm) pm.classList.add('hidden');
    Network.cleanup();
    showScreen('main-menu');
    Sound.startBgMusic();
  }

  function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    prefs.theme = theme;
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
    savePrefs();
    toast(`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
  }

  function toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 300);
    }, duration);
  }

  function vibrate(pattern) {
    if (prefs.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }

  function installPWA() {
    if (deferredPrompt) deferredPrompt.prompt();
  }

  function applyPrefs() {
    setTheme(prefs.theme);
    Sound.setSFX(prefs.sfx);
    Sound.setMusic(prefs.music);
    Sound.setVolume(prefs.volume);
    const sfxT = document.getElementById('sfx-toggle');
    const musT = document.getElementById('music-toggle');
    const volS = document.getElementById('volume-slider');
    if (sfxT) sfxT.checked = prefs.sfx;
    if (musT) musT.checked = prefs.music;
    if (volS) volS.value = prefs.volume;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    const btn = document.getElementById('install-btn');
    if (btn) btn.style.display = 'flex';
  });

  return { showScreen, back, togglePause, exitToMenu, setTheme, toast, vibrate, installPWA, applyPrefs, loadPrefs, savePrefs, prefs };
})();

// ─── Settings Module ───
const Settings = {
  setVibration(val) { UI.prefs.vibration = val; UI.savePrefs(); },
  setAnimation(val) { UI.prefs.animation = val; UI.savePrefs(); },
  setHints(val) { UI.prefs.hints = val; UI.savePrefs(); }
};

// ─── GAME MODULE ───
const Game = (() => {

  const COLORS = ['red', 'blue', 'green', 'yellow'];
  const COLOR_NAMES = { red:'Red', blue:'Blue', green:'Green', yellow:'Yellow' };

  let state = null;
  let selectedMode = 'classic';
  let playerCount = 4;
  let playerSetups = [];
  let timerInterval = null;
  let animationFrame = null;
  let gameStartTime = null;

  // ─── Mode Selection ───
  function selectMode(mode) {
    selectedMode = mode;
    UI.showScreen('player-setup');
    const badge = document.getElementById('setup-mode-badge');
    if (badge) badge.textContent = mode.toUpperCase() + ' MODE';
    buildPlayerCards();
  }

  function setPlayerCount(count) {
    playerCount = count;
    document.querySelectorAll('.count-btn').forEach(b => {
      b.classList.toggle('active', b.textContent === count + 'P');
    });
    buildPlayerCards();
  }

  function buildPlayerCards() {
    const container = document.getElementById('player-cards-container');
    if (!container) return;
    container.innerHTML = '';
    playerSetups = [];

    COLORS.slice(0, playerCount).forEach((color, i) => {
      playerSetups.push({ color, name: COLOR_NAMES[color] + ' Player', type: 'human' });
      const card = document.createElement('div');
      card.className = `player-card ${color}-player`;
      card.innerHTML = `
        <div class="player-color-dot" style="background:${Board.PLAYER_COLORS[color]};color:${Board.PLAYER_COLORS[color]}"></div>
        <input type="text" value="${COLOR_NAMES[color]} Player" maxlength="12"
          onchange="Game.updatePlayerName(${i}, this.value)" placeholder="Player name" />
        <div class="player-type-select">
          <button class="player-type-btn active" onclick="Game.setPlayerType(${i},'human',this)">👤 Human</button>
          <button class="player-type-btn" onclick="Game.setPlayerType(${i},'ai',this)">🤖 AI</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function updatePlayerName(idx, name) {
    if (playerSetups[idx]) playerSetups[idx].name = name.trim() || COLOR_NAMES[COLORS[idx]] + ' Player';
  }

  function setPlayerType(idx, type, btn) {
    if (playerSetups[idx]) playerSetups[idx].type = type;
    btn.closest('.player-type-select').querySelectorAll('.player-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function toggleAI(enabled) {
    const sel = document.getElementById('ai-difficulty');
    if (sel) sel.disabled = !enabled;
    if (enabled) {
      playerSetups.forEach((p, i) => { if (i > 0) p.type = 'ai'; });
    } else {
      playerSetups.forEach(p => { p.type = 'human'; });
    }
  }

  // ─── Start Game ───
  function startGame() {
    const difficulty = document.getElementById('ai-difficulty')?.value || 'medium';
    const players = playerSetups.map((setup, i) => ({
      color: setup.color,
      name: setup.name,
      type: setup.type,
      tokens: [
        { pos: -1, visible: true, shielded: false, frozen: false, selected: false },
        { pos: -1, visible: true, shielded: false, frozen: false, selected: false },
        { pos: -1, visible: true, shielded: false, frozen: false, selected: false },
        { pos: -1, visible: true, shielded: false, frozen: false, selected: false }
      ],
      cards: [],
      frozen: 0,
      doubleTurn: false,
      tokensDone: 0,
      rank: 0
    }));

    state = {
      players,
      currentPlayer: 0,
      diceValue: null,
      diceRolled: false,
      phase: 'roll', // roll | select | animate
      mode: selectedMode,
      aiDifficulty: difficulty,
      paused: false,
      hints: [],
      lastMoves: {},
      turnCount: 0,
      rankings: [],
      gameOver: false,
      isNetworked: false
    };

    gameStartTime = Date.now();
    UI.showScreen('game-screen');
    Board.init();
    Sound.play('gameStart');

    buildScoreStrip();
    updateHUD();
    Board.drawAll(state);

    // Setup canvas click
    const canvas = document.getElementById('ludo-board');
    canvas.onclick = onBoardClick;

    // AI first turn if needed
    if (getCurrentPlayer().type === 'ai') {
      setTimeout(() => triggerAIRoll(), 800);
    }

    Sound.startBgMusic();
  }

  // ─── Score Strip ───
  function buildScoreStrip() {
    const strip = document.getElementById('score-strip');
    if (!strip) return;
    strip.innerHTML = state.players.map((p, i) => `
      <div class="score-item ${i === state.currentPlayer ? 'active' : ''}" id="score-item-${i}">
        <div class="score-dot" style="background:${Board.PLAYER_COLORS[p.color]}"></div>
        <span>${p.name.split(' ')[0]}</span>
        <span class="score-tokens" id="score-tokens-${i}">0/4</span>
      </div>
    `).join('');
    updateScoreStrip();
  }

  function updateScoreStrip() {
    state.players.forEach((p, i) => {
      const done = p.tokens.filter(t => t.pos >= 56).length;
      const el = document.getElementById(`score-tokens-${i}`);
      if (el) el.textContent = `${done}/4`;
      const item = document.getElementById(`score-item-${i}`);
      if (item) item.classList.toggle('active', i === state.currentPlayer);
    });
  }

  // ─── HUD ───
  function updateHUD() {
    const player = getCurrentPlayer();
    const nameEl = document.getElementById('turn-player-name');
    const dotEl = document.getElementById('turn-color-dot');
    if (nameEl) nameEl.textContent = player.name;
    if (dotEl) {
      dotEl.style.background = Board.PLAYER_COLORS[player.color];
      dotEl.style.color = Board.PLAYER_COLORS[player.color];
    }
    // Timer
    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.style.display = state.mode === 'rush' ? 'block' : 'none';
    // Magic cards
    if (state.mode === 'magical') {
      Cards.renderCardRow(player.cards);
    }
  }

  function setActionMsg(msg, highlight = false) {
    const el = document.getElementById('action-msg');
    if (!el) return;
    el.textContent = msg;
    el.className = 'action-msg' + (highlight ? ' highlight' : '');
  }

  // ─── Dice ───
  function rollDice() {
    if (!state || state.paused || state.gameOver) return;
    if (state.phase !== 'roll') return;
    if (getCurrentPlayer().type === 'ai') return;
    if (getCurrentPlayer().frozen > 0) {
      skipFrozenTurn();
      return;
    }
    performRoll();
  }

  function performRoll() {
    Sound.play('dice');
    UI.vibrate([30, 20, 30]);

    // Animate dice
    const dice = document.getElementById('dice');
    if (dice) dice.classList.add('rolling');

    // Random roll animation
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      const temp = Math.floor(Math.random() * 6) + 1;
      showDiceFace(temp);
      rollCount++;
      if (rollCount >= 8) {
        clearInterval(rollInterval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        state.diceValue = finalVal;
        showDiceFace(finalVal);
        if (dice) dice.classList.remove('rolling');
        Sound.play('diceResult', finalVal);
        onDiceRolled(finalVal);
      }
    }, 80);
  }

  function showDiceFace(val) {
    const dice = document.getElementById('dice');
    const valEl = document.getElementById('dice-value');
    if (!dice) return;

    const rotations = {
      1: 'rotateX(0deg) rotateY(0deg)',
      2: 'rotateX(0deg) rotateY(180deg)',
      3: 'rotateX(0deg) rotateY(-90deg)',
      4: 'rotateX(0deg) rotateY(90deg)',
      5: 'rotateX(-90deg) rotateY(0deg)',
      6: 'rotateX(90deg) rotateY(0deg)'
    };
    dice.style.transform = rotations[val] || rotations[1];
    if (valEl) valEl.textContent = val;
  }

  function onDiceRolled(val) {
    state.diceRolled = true;
    state.phase = 'select';

    const player = getCurrentPlayer();
    const movable = getMovableTokens(player, val);

    if (movable.length === 0) {
      setActionMsg(`No moves for ${val}. Skipping...`);
      setTimeout(nextTurn, 1200);
      return;
    }

    if (movable.length === 1 && !UI.prefs.hints) {
      // Auto-move if only one option
      setTimeout(() => moveToken(movable[0], val), 400);
      return;
    }

    // Show hints
    if (UI.prefs.hints) {
      state.hints = movable.map(ti => {
        const token = player.tokens[ti];
        const newPos = token.pos === -1 ? 0 : token.pos + val;
        const absPos = (Board.getStartPos()[player.color] + newPos) % 56;
        if (newPos < 50 && absPos < Board.getMainPath().length) {
          const [c, r] = Board.getMainPath()[absPos];
          return { col: c, row: r, tokenIdx: ti };
        }
        return {};
      });
      Board.drawAll(state);
    }

    // Mark movable tokens
    player.tokens.forEach((t, i) => {
      t.selected = movable.includes(i);
    });

    setActionMsg(val === 6 ? '🎲 Six! Choose a token' : `Rolled ${val} — choose a token`);
  }

  function getMovableTokens(player, val) {
    return player.tokens.reduce((acc, token, i) => {
      if (token.pos >= 56) return acc; // already done
      if (token.pos === -1 && val === 6) { acc.push(i); return acc; }
      if (token.pos === -1) return acc;
      const newPos = token.pos + val;
      if (newPos <= 56) acc.push(i);
      return acc;
    }, []);
  }

  // ─── Board Click ───
  function onBoardClick(e) {
    if (!state || state.phase !== 'select' || state.gameOver || state.paused) return;
    const player = getCurrentPlayer();
    if (player.type === 'ai') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX, py = e.clientY;
    const hit = Board.getTokenAtPixel(px, py, state);
    if (!hit) return;

    const { tokenIndex } = hit;
    const token = player.tokens[tokenIndex];
    if (!token.selected) return;

    moveToken(tokenIndex, state.diceValue);
  }

  // ─── Move Token ───
  function moveToken(tokenIdx, val) {
    const player = getCurrentPlayer();
    const token = player.tokens[tokenIdx];

    // Save last move for reverse card
    if (!state.lastMoves) state.lastMoves = {};
    state.lastMoves[state.currentPlayer] = { fromPos: token.pos, tokenIdx };

    const fromPos = token.pos;
    const toPos = token.pos === -1 ? 0 : token.pos + val;

    Sound.play('move');
    UI.vibrate(30);

    // Clear selections & hints
    player.tokens.forEach(t => { t.selected = false; });
    state.hints = [];
    state.phase = 'animate';

    // Animate step by step
    animateMove(tokenIdx, fromPos, toPos, () => {
      afterMove(tokenIdx, toPos, val);
    });
  }

  function animateMove(tokenIdx, from, to, callback) {
    const player = getCurrentPlayer();
    const token = player.tokens[tokenIdx];
    let current = from;
    const step = from === -1 ? 0 : from;

    if (from === -1) {
      // Entering from home
      token.pos = 0;
      Board.drawAll(state);
      Sound.play('enter');
      setTimeout(callback, 300);
      return;
    }

    const steps = to - from;
    let moved = 0;

    function doStep() {
      if (moved >= steps) { callback(); return; }
      moved++;
      token.pos = from + moved;
      Board.drawAll(state);
      Sound.play('move');
      setTimeout(doStep, UI.prefs.animation ? 220 : 50);
    }
    doStep();
  }

  // ─── After Move Logic ───
  function afterMove(tokenIdx, newPos, diceVal) {
    const player = getCurrentPlayer();
    const token = player.tokens[tokenIdx];
    token.pos = newPos;

    // Check win
    if (newPos >= 56) {
      token.pos = 56;
      player.tokensDone++;
      Sound.play('enter');
      UI.toast(`🎯 ${player.name} got a token home!`);

      if (player.tokensDone === 4) {
        handleWin(state.currentPlayer);
        return;
      }
    }

    // Check cutting (only on main path)
    if (newPos < 50 && newPos >= 0) {
      const startPos = Board.getStartPos()[player.color];
      const absPos = (startPos + newPos) % 56;

      if (!Board.getSafeCells().has(absPos)) {
        state.players.forEach((p, pi) => {
          if (pi === state.currentPlayer) return;
          p.tokens.forEach(t => {
            if (t.pos < 0 || t.pos >= 50) return;
            const absT = (Board.getStartPos()[p.color] + t.pos) % 56;
            if (absT === absPos) {
              if (t.shielded) {
                t.shielded = false;
                Sound.play('shield');
                UI.toast(`🛡 ${p.name}'s shield blocked the cut!`);
              } else {
                t.pos = -1;
                Sound.play('cut');
                UI.vibrate([50, 30, 50]);
                UI.toast(`⚔ ${player.name} cut ${p.name}!`);
                // Bonus roll on cut
                diceVal = 0; // Will get extra roll
              }
            }
          });
        });
      }
    }

    // Magic card chance
    if (state.mode === 'magical' && Math.random() < 0.15) {
      const card = Cards.randomCard();
      player.cards.push({ id: card.id });
      Cards.renderCardRow(player.cards);
      Sound.play('magic');
      UI.toast(`✨ Got card: ${card.icon} ${card.name}!`);
    }

    // Check 6 or cutting (extra roll)
    if (diceVal === 6) {
      setActionMsg('🎲 Six! Roll again!');
      Sound.play('diceResult', 6);
      state.phase = 'roll';
      state.diceRolled = false;
      updateScoreStrip();
      Board.drawAll(state);
      if (getCurrentPlayer().type === 'ai') setTimeout(() => triggerAIRoll(), 700);
      return;
    }

    // Double turn card
    if (player.doubleTurn) {
      player.doubleTurn = false;
      setActionMsg('⚡ Double turn! Roll again!');
      state.phase = 'roll';
      state.diceRolled = false;
      updateScoreStrip();
      Board.drawAll(state);
      return;
    }

    updateScoreStrip();
    Board.drawAll(state);
    setTimeout(nextTurn, 400);
  }

  // ─── Rush Mode Timer ───
  function startTurnTimer() {
    clearInterval(timerInterval);
    if (state.mode !== 'rush') return;
    let remaining = 15;
    const el = document.getElementById('timer-count');
    const disp = document.getElementById('timer-display');
    if (disp) disp.classList.remove('urgent');
    if (el) el.textContent = remaining;

    timerInterval = setInterval(() => {
      remaining--;
      if (el) el.textContent = remaining;
      if (remaining <= 5) {
        if (disp) disp.classList.add('urgent');
        Sound.play(remaining <= 3 ? 'timerUrgent' : 'timerTick');
      }
      if (remaining <= 0) {
        clearInterval(timerInterval);
        setActionMsg('⏰ Time up! Skipping...');
        UI.vibrate([100, 50, 100]);
        setTimeout(nextTurn, 600);
      }
    }, 1000);
  }

  // ─── Frozen Turn ───
  function skipFrozenTurn() {
    const player = getCurrentPlayer();
    player.frozen--;
    setActionMsg(`❄ ${player.name} is frozen! Skipping...`);
    Sound.play('freeze');
    setTimeout(nextTurn, 1200);
  }

  // ─── Next Turn ───
  function nextTurn() {
    clearInterval(timerInterval);
    if (!state || state.gameOver) return;

    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    state.phase = 'roll';
    state.diceRolled = false;
    state.hints = [];
    state.players.forEach(p => p.tokens.forEach(t => t.selected = false));
    state.turnCount++;

    // Skip finished players
    let skips = 0;
    while (state.players[state.currentPlayer].tokensDone === 4 && skips < state.players.length) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
      skips++;
    }

    updateHUD();
    updateScoreStrip();
    Board.drawAll(state);

    const player = getCurrentPlayer();

    // Frozen?
    if (player.frozen > 0) {
      skipFrozenTurn(); return;
    }

    const turnEl = document.getElementById('turn-indicator');
    if (turnEl) turnEl.classList.add('changed');
    setTimeout(() => { if (turnEl) turnEl.classList.remove('changed'); }, 400);

    setActionMsg(player.type === 'ai' ? `${player.name} (AI) is thinking...` : 'Tap dice to roll');

    if (state.mode === 'rush') startTurnTimer();

    if (player.type === 'ai') {
      setTimeout(() => triggerAIRoll(), 600);
    }

    // Sync network state
    if (state.isNetworked) Network.syncState(state);
  }

  // ─── AI Roll ───
  function triggerAIRoll() {
    if (!state || state.phase !== 'roll' || state.paused || state.gameOver) return;
    performRoll();
    setTimeout(() => {
      AI.takeTurn(state, state.currentPlayer, state.diceValue, (tokenIdx) => {
        if (tokenIdx === -1) { nextTurn(); return; }
        moveToken(tokenIdx, state.diceValue);
      });
    }, 400);
  }

  // ─── Magic Card Use ───
  function useCard(cardIdx) {
    if (!state || state.mode !== 'magical') return;
    const player = getCurrentPlayer();
    if (!player.cards[cardIdx]) return;
    const card = Cards.getCard(player.cards[cardIdx].id);
    if (!card) return;

    // Simple activation for non-targeting cards
    if (!card.requiresTarget && !card.requiresPlayer && !card.requiresCell) {
      const success = card.action(state, state.currentPlayer, 0);
      if (success) {
        player.cards.splice(cardIdx, 1);
        Cards.renderCardRow(player.cards);
        Board.drawAll(state);
      }
      return;
    }

    // For targeting cards — pick first movable token and first opponent
    const tokenIdx = 0;
    const targetPlayerIdx = (state.currentPlayer + 1) % state.players.length;
    const success = card.action(state, state.currentPlayer, tokenIdx, targetPlayerIdx, 0);
    if (success) {
      player.cards.splice(cardIdx, 1);
      Cards.renderCardRow(player.cards);
      Board.drawAll(state);
    }
  }

  // ─── Win ───
  function handleWin(playerIdx) {
    clearInterval(timerInterval);
    state.gameOver = true;
    state.rankings.push(playerIdx);
    Sound.play('win');
    Sound.stopBgMusic();
    UI.vibrate([100, 50, 100, 50, 200]);

    const player = state.players[playerIdx];
    const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    document.getElementById('win-player-name').textContent = player.name;
    document.getElementById('win-player-name').style.color = Board.PLAYER_COLORS[player.color];
    document.getElementById('win-stats').innerHTML = `
      Turns: ${state.turnCount}<br>
      Time: ${mins}m ${secs}s<br>
      Color: ${COLOR_NAMES[player.color]}
    `;

    spawnConfetti();
    UI.showScreen('win-screen');
  }

  function spawnConfetti() {
    const container = document.getElementById('win-particles');
    if (!container) return;
    const colors = ['#e84040','#4080e8','#40c860','#e8c040','#bf7fff','#fff'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText = `
        left:${Math.random()*100}%;
        top:${-Math.random()*20}%;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        width:${6+Math.random()*8}px;
        height:${6+Math.random()*8}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confetti-fall ${1.5 + Math.random()*2}s ${Math.random()*0.5}s linear forwards;
        transform: rotate(${Math.random()*360}deg);
      `;
      container.appendChild(p);
    }
  }

  // ─── Restart ───
  function restartGame() {
    const pm = document.getElementById('pause-menu');
    if (pm) pm.classList.add('hidden');
    const wp = document.getElementById('win-particles');
    if (wp) wp.innerHTML = '';
    startGame();
  }

  // ─── Helpers ───
  function getCurrentPlayer() { return state.players[state.currentPlayer]; }

  // ─── Public ───
  return {
    selectMode, setPlayerCount, buildPlayerCards,
    updatePlayerName, setPlayerType, toggleAI,
    startGame, rollDice, onBoardClick, moveToken, useCard,
    restartGame, nextTurn,
    get state() { return state; }
  };
})();

// ─── Loading Screen ───
window.addEventListener('load', () => {
  UI.loadPrefs();
  UI.applyPrefs();

  const bar = document.getElementById('loading-bar');
  const txt = document.getElementById('loading-text');
  const steps = [
    [15, 'Loading board engine...'],
    [35, 'Building game systems...'],
    [55, 'Connecting services...'],
    [75, 'Loading audio engine...'],
    [90, 'Preparing interface...'],
    [100, 'Ready!']
  ];

  let i = 0;
  // Spawn loading particles
  const lp = document.getElementById('loading-particles');
  if (lp) {
    for (let j = 0; j < 20; j++) {
      const p = document.createElement('div');
      p.className = 'load-particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        bottom:${-Math.random()*10}%;
        width:${3+Math.random()*5}px;
        height:${3+Math.random()*5}px;
        background: hsl(${Math.random()*60+30}, 80%, 60%);
        animation: confetti-fall ${2+Math.random()*3}s ${Math.random()*2}s linear infinite;
      `;
      lp.appendChild(p);
    }
  }

  const loadInterval = setInterval(() => {
    if (!steps[i]) { clearInterval(loadInterval); return; }
    const [pct, msg] = steps[i++];
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = msg;
    if (pct >= 100) {
      clearInterval(loadInterval);
      setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.style.opacity = '0'; ls.style.transition = 'opacity 0.5s'; }
        setTimeout(() => {
          if (ls) ls.style.display = 'none';
          UI.showScreen('main-menu');
          Network.checkConnection();
        }, 500);
      }, 400);
    }
  }, 280);
});
