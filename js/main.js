import { LudoGame, PLAYER_COLORS, PLAYER_NAMES } from './game.js';
import { BoardRenderer } from './board.js';
import { AIPlayer } from './ai.js';
import { NetworkManager } from './network.js';
import { soundManager } from './sound.js';

// DOM Elements
const screens = {
  menu: document.getElementById('menu-screen'),
  setup: document.getElementById('setup-screen'),
  game: document.getElementById('game-screen'),
  settings: document.getElementById('settings-screen'),
  rules: document.getElementById('rules-screen')
};

let game, renderer, network, aiPlayers = [];
let currentMode = 'offline'; // offline, local, online
let roomId = null;

// Initialize
function init() {
  setupEventListeners();
  registerServiceWorker();
  loadSettings();
  showScreen('menu');
}

function setupEventListeners() {
  // Menu buttons
  document.querySelector('[data-action="play-offline"]').addEventListener('click', () => startSetup('offline'));
  document.querySelector('[data-action="play-local"]').addEventListener('click', () => startSetup('local'));
  document.querySelector('[data-action="play-online"]').addEventListener('click', () => startSetup('online'));
  document.querySelector('[data-action="show-settings"]').addEventListener('click', () => showScreen('settings'));
  document.querySelector('[data-action="show-rules"]').addEventListener('click', () => showScreen('rules'));
  
  document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('close-settings').addEventListener('click', () => showScreen('menu'));
  document.getElementById('close-rules').addEventListener('click', () => showScreen('menu'));
  document.getElementById('menu-toggle-btn').addEventListener('click', () => showScreen('menu'));
  
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('roll-dice-btn').addEventListener('click', () => rollDice());
  document.getElementById('end-turn-btn').addEventListener('click', () => endTurn());
  
  // Settings
  document.getElementById('theme-select').addEventListener('change', applyTheme);
  document.getElementById('sound-toggle').addEventListener('change', (e) => soundManager.enabled = e.target.checked);
}

function startSetup(mode) {
  currentMode = mode;
  document.getElementById('mode-title').innerText = 
    mode === 'offline' ? '🤖 অফলাইন মোড' : (mode === 'local' ? '📡 লোকাল LAN' : '🌐 অনলাইন');
  
  // Show/hide online options
  document.getElementById('online-room-options').style.display = mode === 'online' ? 'block' : 'none';
  
  // Set player types default
  if (mode === 'offline') {
    // Default: human red, others AI
    document.querySelectorAll('.player-type').forEach((select, idx) => {
      select.value = idx === 0 ? 'human' : 'ai';
    });
  } else {
    // Multiplayer: all human
    document.querySelectorAll('.player-type').forEach(select => select.value = 'human');
  }
  
  showScreen('setup');
}

async function startGame() {
  const mode = document.querySelector('input[name="game-mode"]:checked').value;
  const playerTypes = [];
  document.querySelectorAll('.player-type').forEach((select, idx) => {
    playerTypes[idx] = select.value;
  });
  
  // Create game instance
  const players = playerTypes.map((type, idx) => ({ type, color: idx }));
  game = new LudoGame({ mode, players });
  
  // Setup network if needed
  if (currentMode === 'online') {
    network = new NetworkManager('online');
    const roomInput = document.getElementById('room-id-input').value;
    try {
      if (roomInput) {
        await network.joinRoom(roomInput);
        roomId = roomInput;
      } else {
        roomId = await network.createRoom();
        alert(`রুম তৈরি হয়েছে! রুম আইডি: ${roomId}`);
      }
      network.onMessage = handleNetworkMessage;
    } catch (e) {
      alert('অনলাইন সংযোগ ব্যর্থ: ' + e.message);
      return;
    }
  } else if (currentMode === 'local') {
    network = new NetworkManager('local');
    // LAN setup will be done via prompt
    const isHost = confirm('আপনি কি হোস্ট? (OK = হোস্ট, Cancel = জয়েন)');
    if (isHost) {
      const offer = await network.setupLAN(true);
      prompt('এই কোডটি অন্য খেলোয়াড়কে দিন:', offer);
    } else {
      const answer = prompt('হোস্টের দেওয়া কোড পেস্ট করুন:');
      const myAnswer = await network.connectLAN(answer);
      prompt('আপনার কোড হোস্টকে দিন:', myAnswer);
    }
    network.onMessage = handleNetworkMessage;
  }
  
  // Initialize AI
  aiPlayers = playerTypes.map((type, idx) => type === 'ai' ? new AIPlayer(document.getElementById('ai-difficulty').value) : null);
  
  // Renderer
  const canvas = document.getElementById('board-canvas');
  renderer = new BoardRenderer(canvas);
  
  // Listen to game events
  game.addListener(handleGameEvent);
  
  showScreen('game');
  updateUI();
  renderer.render(game);
  
  // Start first turn
  if (game.players[game.currentPlayer].type === 'ai') {
    setTimeout(() => aiTurn(), 500);
  }
}

function handleGameEvent(event) {
  switch(event.type) {
    case 'dice-rolled':
      soundManager.playDiceRoll();
      updateDiceVisual(event.value);
      break;
    case 'piece-moved':
      soundManager.playMove();
      if (event.captured) soundManager.playCapture();
      break;
    case 'game-over':
      soundManager.playWin();
      alert(`${PLAYER_NAMES[event.winner]} জিতেছে! 🎉`);
      break;
    case 'turn-change':
    case 'extra-turn':
    case 'state-sync':
      break;
  }
  updateUI();
  renderer.render(game);
  
  // Check AI turn
  if (!game.winner && game.players[game.currentPlayer].type === 'ai') {
    setTimeout(() => aiTurn(), 500);
  }
  
  // Network sync
  if (network && game.players[game.currentPlayer].type === 'human') {
    if (currentMode === 'online') network.sendGameState(game.getState());
    else if (currentMode === 'local') network.sendLAN({ type: 'state', state: game.getState() });
  }
}

function aiTurn() {
  if (game.winner) return;
  const ai = aiPlayers[game.currentPlayer];
  if (!ai) return;
  
  if (!game.diceRolled) {
    rollDice();
    setTimeout(() => {
      if (game.diceRolled) {
        const piece = ai.decideMove(game, game.currentPlayer);
        if (piece !== null) {
          game.movePiece(piece);
        } else {
          endTurn();
        }
      }
    }, 800);
  }
}

function rollDice() {
  if (game.players[game.currentPlayer].type !== 'human') return;
  game.rollDice();
}

function endTurn() {
  if (game.canRollAgain) {
    // Player got 6 and can roll again, but they can also pass
  }
  game.nextPlayer();
  updateUI();
}

function handleNetworkMessage(msg) {
  if (msg.type === 'state-update' || msg.type === 'state') {
    game.setState(msg.state);
    updateUI();
    renderer.render(game);
  }
}

function updateUI() {
  document.getElementById('current-player-indicator').innerHTML = 
    `বর্তমান: <span style="color:${PLAYER_COLORS[game.currentPlayer]}">${PLAYER_NAMES[game.currentPlayer]}</span>`;
  
  const diceVal = game.diceValue || '?';
  const diceSymbol = ['⚀','⚁','⚂','⚃','⚄','⚅'][diceVal-1] || '🎲';
  document.getElementById('dice-value').innerHTML = diceSymbol;
  document.getElementById('dice-visual').innerHTML = diceSymbol;
  
  // Show move options
  if (game.diceRolled && game.players[game.currentPlayer].type === 'human') {
    const movable = game.getMovablePieces(game.currentPlayer, game.diceValue);
    const container = document.getElementById('move-options');
    container.innerHTML = '';
    movable.forEach(idx => {
      const btn = document.createElement('button');
      btn.className = 'move-btn';
      btn.innerText = `গুটি ${idx+1} চালান`;
      btn.onclick = () => { game.movePiece(idx); };
      container.appendChild(btn);
    });
  } else {
    document.getElementById('move-options').innerHTML = '';
  }
}

function updateDiceVisual(value) {
  const diceEl = document.getElementById('dice-visual');
  diceEl.classList.add('dice-rolling');
  setTimeout(() => diceEl.classList.remove('dice-rolling'), 400);
}

function applyTheme() {
  const theme = document.getElementById('theme-select').value;
  document.body.className = `theme-${theme}`;
  localStorage.setItem('ludo-theme', theme);
  if (renderer) renderer.render(game);
}

function loadSettings() {
  const savedTheme = localStorage.getItem('ludo-theme') || 'classic';
  document.getElementById('theme-select').value = savedTheme;
  applyTheme();
}

function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/ludo-game/sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW failed', err));
  }
}

// Start app
init();
