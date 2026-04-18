import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDhAhSJhg9cAefOC1qg0VNfaLxqBX0-Itk", authDomain: "ludo-game-fd743.firebaseapp.com",
    databaseURL: "https://ludo-game-fd743-default-rtdb.firebaseio.com", projectId: "ludo-game-fd743",
    storageBucket: "ludo-game-fd743.firebasestorage.app", messagingSenderId: "730048485099", appId: "1:730048485099:web:e897a332370427f6de50ae"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export class NetworkManager {
    constructor(gameInstance) {
        this.game = gameInstance; this.roomId = null; this.isHost = false; this.playerId = null;
        this.setupUI();
    }
    setupUI() {
        document.getElementById('host-btn').addEventListener('click', () => this.hostRoom());
        document.getElementById('join-btn').addEventListener('click', () => this.joinRoom());
    }
    generateRoomCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
    hostRoom() {
        this.roomId = this.generateRoomCode(); this.isHost = true; this.playerId = 'red';
        const roomRef = ref(db, 'rooms/' + this.roomId);
        set(roomRef, { host: 'connected', joiner: 'waiting', gameState: { currentPlayer: 'red', diceValue: 6, tokens: this.game.tokens } });
        onDisconnect(roomRef).remove();
        document.getElementById('room-display').innerText = `Room Code: ${this.roomId} (Waiting...)`;
        document.querySelector('.network-buttons').classList.add('hidden');
        this.listenForUpdates();
    }
    joinRoom() {
        const inputCode = document.getElementById('room-input').value.trim();
        if (inputCode.length !== 6) return alert("Invalid Room Code!");
        this.roomId = inputCode; this.isHost = false; this.playerId = 'green';
        const roomRef = ref(db, 'rooms/' + this.roomId);
        update(roomRef, { joiner: 'connected' });
        document.getElementById('room-display').innerText = `Connected to: ${this.roomId}`;
        document.querySelector('.network-buttons').classList.add('hidden');
        this.listenForUpdates();
    }
    listenForUpdates() {
        onValue(ref(db, `rooms/${this.roomId}/gameState`), (snapshot) => {
            const data = snapshot.val();
            if (data && data.lastActionBy !== this.playerId) this.game.syncFromNetwork(data);
        });
    }
    sendUpdate() {
        if (!this.roomId) return;
        update(ref(db, `rooms/${this.roomId}/gameState`), { currentPlayer: this.game.currentPlayer, diceValue: this.game.diceValue, tokens: this.game.tokens, lastActionBy: this.playerId });
    }
}
