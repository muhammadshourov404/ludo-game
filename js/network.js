// js/network.js - By V4MPIR3
// Firebase Realtime Multiplayer Engine

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Your exact Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDhAhSJhg9cAefOC1qg0VNfaLxqBX0-Itk",
    authDomain: "ludo-game-fd743.firebaseapp.com",
    databaseURL: "https://ludo-game-fd743-default-rtdb.firebaseio.com",
    projectId: "ludo-game-fd743",
    storageBucket: "ludo-game-fd743.firebasestorage.app",
    messagingSenderId: "730048485099",
    appId: "1:730048485099:web:e897a332370427f6de50ae"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export class NetworkManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.roomId = null;
        this.isHost = false;
        this.playerId = null; // 'red' (host) or 'green' (joiner)
        
        this.setupUI();
    }

    setupUI() {
        document.getElementById('host-btn').addEventListener('click', () => this.hostRoom());
        document.getElementById('join-btn').addEventListener('click', () => this.joinRoom());
    }

    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    }

    hostRoom() {
        this.roomId = this.generateRoomCode();
        this.isHost = true;
        this.playerId = 'red'; // Host plays as Red

        const roomRef = ref(db, 'rooms/' + this.roomId);
        
        // Initialize room state
        set(roomRef, {
            host: 'connected',
            joiner: 'waiting',
            gameState: {
                currentPlayer: 'red',
                diceValue: 6,
                tokens: this.game.tokens
            }
        });

        // Delete room automatically if host disconnects
        onDisconnect(roomRef).remove();

        document.getElementById('room-display').innerText = `Room Code: ${this.roomId} (Waiting...)`;
        document.querySelector('.network-buttons').classList.add('hidden');
        
        this.listenForUpdates();
        console.log(`[Network] Hosted Room: ${this.roomId}`);
    }

    joinRoom() {
        const inputCode = document.getElementById('room-input').value.trim();
        if (inputCode.length !== 6) return alert("Please enter a valid 6-digit Room Code!");

        this.roomId = inputCode;
        this.isHost = false;
        this.playerId = 'green'; // Joiner plays as Green

        const roomRef = ref(db, 'rooms/' + this.roomId);
        
        // Update room to show joiner is connected
        update(roomRef, { joiner: 'connected' });

        document.getElementById('room-display').innerText = `Connected to Room: ${this.roomId}`;
        document.querySelector('.network-buttons').classList.add('hidden');

        this.listenForUpdates();
        console.log(`[Network] Joined Room: ${this.roomId}`);
    }

    listenForUpdates() {
        const stateRef = ref(db, `rooms/${this.roomId}/gameState`);
        onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Ignore update if it's my own turn (prevents loop)
                if (data.lastActionBy !== this.playerId) {
                    this.game.syncFromNetwork(data);
                }
            }
        });
    }

    sendUpdate() {
        if (!this.roomId) return; // Don't send if offline

        const stateRef = ref(db, `rooms/${this.roomId}/gameState`);
        update(stateRef, {
            currentPlayer: this.game.currentPlayer,
            diceValue: this.game.diceValue,
            tokens: this.game.tokens,
            lastActionBy: this.playerId // Identifies who made the change
        });
    }
}
