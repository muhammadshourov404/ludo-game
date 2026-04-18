import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, onValue, push, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

export class NetworkManager {
  constructor(mode) {
    this.mode = mode; // 'local' (LAN) or 'online'
    this.roomId = null;
    this.playerId = null;
    this.db = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.onMessage = null;
    
    if (mode === 'online') {
      const app = initializeApp(firebaseConfig);
      this.db = getDatabase(app);
    }
  }
  
  // Online using Firebase
  async createRoom() {
    if (!this.db) throw new Error('Firebase not initialized');
    const roomRef = push(ref(this.db, 'rooms'));
    this.roomId = roomRef.key;
    this.playerId = 0; // host is player 0
    await set(roomRef, {
      host: this.playerId,
      players: { 0: { ready: true } },
      gameState: null,
      currentTurn: 0
    });
    this.listenToRoom();
    return this.roomId;
  }
  
  async joinRoom(roomId) {
    this.roomId = roomId;
    const roomRef = ref(this.db, `rooms/${roomId}`);
    // Check room exists and assign player id
    const snapshot = await new Promise(resolve => onValue(roomRef, resolve, { onlyOnce: true }));
    if (!snapshot.exists()) throw new Error('Room not found');
    const data = snapshot.val();
    const players = data.players || {};
    let assignedId = null;
    for (let i = 1; i < 4; i++) {
      if (!players[i]) {
        assignedId = i;
        break;
      }
    }
    if (assignedId === null) throw new Error('Room full');
    this.playerId = assignedId;
    await update(roomRef, { [`players/${assignedId}`]: { ready: true } });
    this.listenToRoom();
    return assignedId;
  }
  
  listenToRoom() {
    const roomRef = ref(this.db, `rooms/${this.roomId}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.gameState && this.onMessage) {
        this.onMessage({ type: 'state-update', state: data.gameState });
      }
      if (data && data.currentTurn !== undefined) {
        // Notify turn
      }
    });
  }
  
  sendGameState(state) {
    if (!this.roomId || !this.db) return;
    const roomRef = ref(this.db, `rooms/${this.roomId}`);
    update(roomRef, { gameState: state, currentTurn: state.currentPlayer });
  }
  
  // LAN using WebRTC (simplified with manual signaling via prompt)
  // We'll implement a simple copy-paste signaling for LAN.
  async setupLAN(host = true) {
    // Create RTCPeerConnection
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.peerConnection = new RTCPeerConnection(configuration);
    
    if (host) {
      this.dataChannel = this.peerConnection.createDataChannel('game');
      this.setupDataChannel();
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      // Wait for ICE gathering
      await new Promise(resolve => {
        if (this.peerConnection.iceGatheringState === 'complete') resolve();
        else this.peerConnection.addEventListener('icegatheringstatechange', resolve, { once: true });
      });
      return JSON.stringify(this.peerConnection.localDescription);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
    
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', JSON.stringify(event.candidate));
      }
    };
  }
  
  async connectLAN(remoteDesc) {
    await this.peerConnection.setRemoteDescription(JSON.parse(remoteDesc));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await new Promise(resolve => {
      if (this.peerConnection.iceGatheringState === 'complete') resolve();
      else this.peerConnection.addEventListener('icegatheringstatechange', resolve, { once: true });
    });
    return JSON.stringify(this.peerConnection.localDescription);
  }
  
  setupDataChannel() {
    this.dataChannel.onopen = () => console.log('Data channel open');
    this.dataChannel.onmessage = (event) => {
      if (this.onMessage) {
        this.onMessage(JSON.parse(event.data));
      }
    };
  }
  
  sendLAN(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }
  }
}
