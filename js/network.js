/* =============================================
   LUDO NEXUS — Network (js/network.js)
   Firebase Online + LAN via Room Codes
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const Network = (() => {

  // ─── Firebase Config ───
  const firebaseConfig = {
    apiKey: "AIzaSyDhAhSJhg9cAefOC1qg0VNfaLxqBX0-Itk",
    authDomain: "ludo-game-fd743.firebaseapp.com",
    databaseURL: "https://ludo-game-fd743-default-rtdb.firebaseio.com",
    projectId: "ludo-game-fd743",
    storageBucket: "ludo-game-fd743.firebasestorage.app",
    messagingSenderId: "730048485099",
    appId: "1:730048485099:web:e897a332370427f6de50ae",
    measurementId: "G-GEG3CKBYWP"
  };

  let app = null, db = null;
  let currentRoom = null;
  let isHost = false;
  let myPlayerId = null;
  let roomListener = null;
  let isOnline = false;
  let isLAN = false;
  let onGameStart = null;
  let onStateUpdate = null;

  // ─── Init Firebase ───
  function initFirebase() {
    if (app) return true;
    try {
      if (typeof firebase === 'undefined') return false;
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.apps[0];
      }
      db = firebase.database();
      return true;
    } catch(e) {
      console.error('Firebase init error:', e);
      return false;
    }
  }

  // ─── Generate Room Code ───
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function getPlayerName(mode) {
    const id = mode === 'lan' ? 'lan-player-name' : 'online-player-name';
    return document.getElementById(id)?.value?.trim() || 'Player';
  }

  // ─── Check Connection ───
  async function checkConnection() {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    try {
      await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
      isOnline = true;
      if (dot) { dot.className = 'status-dot online'; }
      if (txt) txt.textContent = 'Online';
    } catch {
      isOnline = false;
      if (dot) { dot.className = 'status-dot offline'; }
      if (txt) txt.textContent = 'Offline';
    }
    return isOnline;
  }

  // ─── ONLINE: Create Room ───
  async function createRoom() {
    const name = getPlayerName('online');
    if (!name) { UI.toast('Enter your name!'); return; }

    if (!initFirebase()) {
      UI.toast('Firebase not loaded. Check connection.');
      return;
    }

    myPlayerId = 'p_' + Date.now();
    const code = generateCode();
    currentRoom = code;
    isHost = true;
    isLAN = false;

    const roomData = {
      code,
      host: myPlayerId,
      mode: 'classic',
      status: 'waiting',
      players: {
        [myPlayerId]: { name, color: 'red', ready: true, joinedAt: Date.now() }
      },
      createdAt: Date.now()
    };

    try {
      await db.ref(`rooms/${code}`).set(roomData);
      showRoomStatus(code, 'online');
      listenToRoom(code, 'online');
      UI.toast('Room created! Share the code.');
    } catch(e) {
      UI.toast('Failed to create room. Try again.');
      console.error(e);
    }
  }

  // ─── ONLINE: Join Room ───
  async function joinRoom() {
    const name = getPlayerName('online');
    const code = document.getElementById('room-code-input')?.value?.trim().toUpperCase();
    if (!name) { UI.toast('Enter your name!'); return; }
    if (!code || code.length < 4) { UI.toast('Enter room code!'); return; }

    if (!initFirebase()) { UI.toast('Firebase not loaded.'); return; }

    myPlayerId = 'p_' + Date.now();
    currentRoom = code;
    isHost = false;
    isLAN = false;

    const colors = ['red','blue','green','yellow'];
    try {
      const snap = await db.ref(`rooms/${code}`).once('value');
      const room = snap.val();
      if (!room) { UI.toast('Room not found!'); return; }
      if (room.status !== 'waiting') { UI.toast('Game already started!'); return; }

      const existingCount = Object.keys(room.players || {}).length;
      if (existingCount >= 4) { UI.toast('Room is full!'); return; }

      const myColor = colors[existingCount];
      await db.ref(`rooms/${code}/players/${myPlayerId}`).set({
        name, color: myColor, ready: true, joinedAt: Date.now()
      });

      showRoomStatus(code, 'online');
      listenToRoom(code, 'online');
      UI.toast('Joined room!');
    } catch(e) {
      UI.toast('Failed to join. Check code.');
      console.error(e);
    }
  }

  // ─── LAN: Create Room ───
  async function createLANRoom() {
    const name = getPlayerName('lan');
    if (!name) { UI.toast('Enter your name!'); return; }

    if (!initFirebase()) { UI.toast('Firebase not available.'); return; }

    myPlayerId = 'p_' + Date.now();
    const code = generateCode();
    currentRoom = code;
    isHost = true;
    isLAN = true;

    const roomData = {
      code,
      host: myPlayerId,
      type: 'lan',
      status: 'waiting',
      players: {
        [myPlayerId]: { name, color: 'red', ready: true, joinedAt: Date.now() }
      },
      createdAt: Date.now()
    };

    try {
      await db.ref(`lan_rooms/${code}`).set(roomData);
      showRoomStatus(code, 'lan');
      listenToRoom(code, 'lan');
      UI.toast('LAN room created!');
    } catch(e) {
      // Offline fallback: local LAN code
      UI.toast('Using local mode (same device).');
      simulateLAN(name, code);
    }
  }

  // ─── LAN: Join Room ───
  async function joinLANRoom() {
    const name = getPlayerName('lan');
    const code = document.getElementById('lan-room-code')?.value?.trim().toUpperCase();
    if (!name) { UI.toast('Enter your name!'); return; }
    if (!code) { UI.toast('Enter room code!'); return; }

    if (!initFirebase()) { UI.toast('Firebase not available.'); return; }

    myPlayerId = 'p_' + Date.now();
    currentRoom = code;
    isHost = false;
    isLAN = true;

    const colors = ['red','blue','green','yellow'];
    try {
      const snap = await db.ref(`lan_rooms/${code}`).once('value');
      const room = snap.val();
      if (!room) { UI.toast('Room not found!'); return; }
      if (room.status !== 'waiting') { UI.toast('Game already started!'); return; }

      const existingCount = Object.keys(room.players || {}).length;
      const myColor = colors[existingCount % 4];

      await db.ref(`lan_rooms/${code}/players/${myPlayerId}`).set({
        name, color: myColor, ready: true, joinedAt: Date.now()
      });

      showRoomStatus(code, 'lan');
      listenToRoom(code, 'lan');
      UI.toast('Joined LAN room!');
    } catch(e) {
      UI.toast('Failed to join LAN room.');
    }
  }

  // ─── Listen to Room ───
  function listenToRoom(code, type) {
    const ref = db.ref(`${type === 'lan' ? 'lan_rooms' : 'rooms'}/${code}`);
    if (roomListener) roomListener.off();
    roomListener = ref;

    ref.on('value', snap => {
      const room = snap.val();
      if (!room) return;
      updateRoomUI(room, type);
      if (room.status === 'playing' && room.gameState) {
        if (onGameStart) onGameStart(room);
      }
      if (room.gameState && onStateUpdate) {
        onStateUpdate(room.gameState);
      }
    });
  }

  function updateRoomUI(room, type) {
    const players = Object.values(room.players || {});
    const listId = type === 'lan' ? 'lan-players-list' : 'room-players-list';
    const startBtnId = type === 'lan' ? 'start-lan-btn' : 'start-online-btn';
    const list = document.getElementById(listId);
    const startBtn = document.getElementById(startBtnId);

    if (list) {
      list.innerHTML = players.map(p => `
        <div class="room-player-item">
          <div class="room-player-dot" style="background:${Board.PLAYER_COLORS[p.color]||'#888'}"></div>
          <span>${p.name}</span>
          <span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">${p.color}</span>
        </div>
      `).join('');
    }

    if (startBtn) {
      startBtn.style.display = isHost && players.length >= 2 ? 'flex' : 'none';
    }
  }

  // ─── Start Online Game ───
  async function startOnlineGame() {
    if (!isHost || !currentRoom) return;
    try {
      await db.ref(`rooms/${currentRoom}/status`).set('playing');
      UI.toast('Game starting!');
    } catch(e) { UI.toast('Error starting game.'); }
  }

  async function startLANGame() {
    if (!isHost || !currentRoom) return;
    try {
      await db.ref(`lan_rooms/${currentRoom}/status`).set('playing');
    } catch(e) { UI.toast('Error starting LAN game.'); }
  }

  // ─── Sync Game State ───
  async function syncState(state) {
    if (!currentRoom || !db) return;
    const prefix = isLAN ? 'lan_rooms' : 'rooms';
    try {
      await db.ref(`${prefix}/${currentRoom}/gameState`).set(JSON.parse(JSON.stringify(state)));
    } catch(e) {}
  }

  // ─── Copy Code ───
  function copyRoomCode() {
    const el = document.getElementById('display-room-code');
    if (!el) return;
    navigator.clipboard?.writeText(el.textContent);
    UI.toast('Room code copied!');
  }
  function copyLANCode() {
    const el = document.getElementById('lan-display-code');
    if (!el) return;
    navigator.clipboard?.writeText(el.textContent);
    UI.toast('Code copied!');
  }

  // ─── Show Room Status UI ───
  function showRoomStatus(code, type) {
    const statusId = type === 'lan' ? 'lan-room-status' : 'room-status';
    const codeId = type === 'lan' ? 'lan-display-code' : 'display-room-code';
    const el = document.getElementById(statusId);
    const codeEl = document.getElementById(codeId);
    if (el) el.classList.remove('hidden');
    if (codeEl) codeEl.textContent = code;
  }

  // ─── Simulate LAN (offline fallback) ───
  function simulateLAN(name, code) {
    const el = document.getElementById('lan-room-status');
    const codeEl = document.getElementById('lan-display-code');
    if (el) el.classList.remove('hidden');
    if (codeEl) codeEl.textContent = code;
    const list = document.getElementById('lan-players-list');
    if (list) list.innerHTML = `
      <div class="room-player-item">
        <div class="room-player-dot"></div>
        <span>${name}</span>
        <span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">(Host)</span>
      </div>
    `;
  }

  // ─── Cleanup ───
  function cleanup() {
    if (roomListener) { try { roomListener.off(); } catch(e) {} roomListener = null; }
    if (db && currentRoom) {
      const prefix = isLAN ? 'lan_rooms' : 'rooms';
      db.ref(`${prefix}/${currentRoom}/players/${myPlayerId}`).remove();
    }
    currentRoom = null; isHost = false;
  }

  // ─── State ───
  function getState() {
    return { isOnline, isLAN, isHost, myPlayerId, currentRoom };
  }

  function setCallbacks(onStart, onUpdate) {
    onGameStart = onStart;
    onStateUpdate = onUpdate;
  }

  // Init connection check
  checkConnection();
  setInterval(checkConnection, 30000);

  return {
    initFirebase, checkConnection,
    createRoom, joinRoom,
    createLANRoom, joinLANRoom,
    startOnlineGame, startLANGame,
    syncState, cleanup, getState, setCallbacks,
    copyRoomCode, copyLANCode
  };
})();
