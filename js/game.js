import { sounds } from './sound.js';
import { CardSystem } from './cards.js';
import { LudoAI } from './ai.js';
import { NetworkManager } from './network.js';

class LudoGame {
    constructor() {
        this.diceValue = 6; this.currentPlayer = 'red'; this.isRolling = false; this.diceRolled = false;
        
        this.tokens = {
            red: [{id: 0, state: 'base', position: -1, basePos: [2,2]}, {id: 1, state: 'base', position: -1, basePos: [2,3]}, {id: 2, state: 'base', position: -1, basePos: [3,2]}, {id: 3, state: 'base', position: -1, basePos: [3,3]}],
            green: [{id: 0, state: 'base', position: -1, basePos: [2,11]}, {id: 1, state: 'base', position: -1, basePos: [2,12]}, {id: 2, state: 'base', position: -1, basePos: [3,11]}, {id: 3, state: 'base', position: -1, basePos: [3,12]}]
        };

        this.masterPath = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
        this.homePaths = { red: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], green: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]] };
        this.safeZones = [[6,1],[2,6],[1,8],[6,12],[8,13],[12,8],[13,6],[8,2]];
        this.pathOffsets = { red: 0, green: 13 };

        this.diceFaces = {
            1: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="50" cy="50" r="10" fill="black"/></svg>',
            2: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="30" r="10" fill="black"/><circle cx="70" cy="70" r="10" fill="black"/></svg>',
            3: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="25" cy="25" r="10" fill="black"/><circle cx="50" cy="50" r="10" fill="black"/><circle cx="75" cy="75" r="10" fill="black"/></svg>',
            4: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="30" r="10" fill="black"/><circle cx="70" cy="30" r="10" fill="black"/><circle cx="30" cy="70" r="10" fill="black"/><circle cx="70" cy="70" r="10" fill="black"/></svg>',
            5: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="25" cy="25" r="10" fill="black"/><circle cx="75" cy="25" r="10" fill="black"/><circle cx="50" cy="50" r="10" fill="black"/><circle cx="25" cy="75" r="10" fill="black"/><circle cx="75" cy="75" r="10" fill="black"/></svg>',
            6: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="20" r="10" fill="black"/><circle cx="30" cy="50" r="10" fill="black"/><circle cx="30" cy="80" r="10" fill="black"/><circle cx="70" cy="20" r="10" fill="black"/><circle cx="70" cy="50" r="10" fill="black"/><circle cx="70" cy="80" r="10" fill="black"/></svg>'
        };

        this.magicSystem = new CardSystem();
        this.aiPlayer = new LudoAI(this, 'green');
        this.network = new NetworkManager(this);
        this.init();
    }

    init() {
        this.diceContainer = document.getElementById('dice-container');
        this.diceContainer.innerHTML = this.diceFaces[6];
        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
        this.diceContainer.addEventListener('click', () => this.rollDice());
        setTimeout(() => this.renderAllTokens(), 100);
    }

    updateActiveUI() {
        document.getElementById('player-1-info').style.opacity = (this.currentPlayer === 'red') ? '1' : '0.5';
        document.getElementById('player-2-info').style.opacity = (this.currentPlayer === 'green') ? '1' : '0.5';
    }

    rollDice() {
        if (this.isRolling || this.diceRolled) return;
        
        // Network Check: Only allow roll if it's your turn in multiplayer
        if (this.network.roomId && this.network.playerId !== this.currentPlayer) return;

        this.isRolling = true; this.diceContainer.classList.add('rolling');
        sounds.play('dice'); if(navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            this.diceContainer.innerHTML = this.diceFaces[this.diceValue];
            this.diceContainer.classList.remove('rolling');
            this.diceRolled = true; this.isRolling = false;
            if(this.network.roomId) this.network.sendUpdate();
            this.checkAvailableMoves();
        }, 400);
    }

    checkAvailableMoves() {
        let canMove = false;
        this.tokens[this.currentPlayer].forEach(t => {
            if (t.state === 'base' && this.diceValue === 6) canMove = true;
            if (t.state === 'active' && (t.position + this.diceValue <= 56)) canMove = true;
        });

        if (!canMove) {
            setTimeout(() => this.switchTurn(), 800);
        } else if (this.currentPlayer === 'green' && !this.network.roomId) {
            setTimeout(() => {
                const aiMove = this.aiPlayer.decideMove();
                if(aiMove !== null) this.handleTokenClick('green', aiMove);
            }, 800);
        }
    }

    handleTokenClick(color, id) {
        if (color !== this.currentPlayer || !this.diceRolled) return;
        if (this.network.roomId && this.network.playerId !== this.currentPlayer) return;

        const token = this.tokens[color][id];
        let bonusTurn = false;

        if (token.state === 'base' && this.diceValue === 6) {
            token.state = 'active'; token.position = 0; bonusTurn = true;
        } else if (token.state === 'active' && token.position + this.diceValue <= 56) {
            token.position += this.diceValue;
            
            const effect = this.magicSystem.getEffectAt(token.position);
            if(effect) this.magicSystem.applyEffect(token, effect);

            if (token.position <= 50) {
                let targetIndex = (this.pathOffsets[color] + token.position) % 52;
                let [r, c] = this.masterPath[targetIndex];
                if(this.checkCapture(r, c, color)) bonusTurn = true;
            }

            if (token.position === 56) {
                token.state = 'goal'; bonusTurn = true; sounds.play('home');
                if(navigator.vibrate) navigator.vibrate([200,100,200]);
                this.checkWin(color);
            }
            if(this.diceValue === 6) bonusTurn = true;
        } else return;

        sounds.play('move');
        this.moveTokenDOM();
        this.diceRolled = false;
        if(!bonusTurn) this.switchTurn();
        else if(this.network.roomId) this.network.sendUpdate();
    }

    checkCapture(r, c, attackerColor, simulate = false) {
        if(this.safeZones.some(z => z[0]===r && z[1]===c)) return false;
        let capture = false;
        for (const [col, arr] of Object.entries(this.tokens)) {
            if (col !== attackerColor) {
                arr.forEach(t => {
                    if (t.state === 'active' && t.position <= 50) {
                        let idx = (this.pathOffsets[col] + t.position) % 52;
                        let [er, ec] = this.masterPath[idx];
                        if (er === r && ec === c) {
                            if(!simulate) {
                                t.state = 'base'; t.position = -1; capture = true;
                                sounds.play('capture'); if(navigator.vibrate) navigator.vibrate([100,50,100]);
                            } else capture = true;
                        }
                    }
                });
            }
        }
        return capture;
    }

    checkWin(color) {
        if(this.tokens[color].every(t => t.state === 'goal')) {
            document.getElementById('win-modal').classList.remove('hidden');
            document.getElementById('winner-text').innerText = `${color.toUpperCase()} WINS!`;
        }
    }

    switchTurn() {
        this.currentPlayer = (this.currentPlayer === 'red') ? 'green' : 'red';
        this.diceRolled = false; this.updateActiveUI(); this.renderAllTokens();
        if(this.network.roomId) this.network.sendUpdate();
        
        if (this.currentPlayer === 'green' && !this.network.roomId) {
            setTimeout(() => this.rollDice(), 1000);
        }
    }

    syncFromNetwork(data) {
        this.currentPlayer = data.currentPlayer; this.diceValue = data.diceValue; this.tokens = data.tokens;
        this.diceContainer.innerHTML = this.diceFaces[this.diceValue];
        this.updateActiveUI(); this.renderAllTokens();
    }

    renderAllTokens() {
        document.querySelectorAll('.token').forEach(el => el.remove());
        for (const [color, arr] of Object.entries(this.tokens)) {
            arr.forEach(t => {
                let r, c;
                if (t.state === 'base') [r, c] = t.basePos;
                else if (t.state === 'active' || t.state === 'goal') {
                    if (t.position <= 50) {
                        let idx = (this.pathOffsets[color] + t.position) % 52;
                        [r, c] = this.masterPath[idx];
                    } else if(t.position > 50 && t.position <= 56) {
                        [r, c] = this.homePaths[color][t.position - 51];
                    }
                }
                if(r !== undefined && c !== undefined) {
                    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        const el = document.createElement('div'); el.classList.add('token', `token-${color}`);
                        if (color === this.currentPlayer && t.state !== 'goal') el.classList.add('token-active');
                        if (t.state === 'goal') { el.style.transform = 'scale(0.6)'; el.style.opacity = '0.8'; }
                        el.id = `token-${color}-${t.id}`;
                        el.addEventListener('click', () => this.handleTokenClick(color, t.id));
                        cell.appendChild(el);
                    }
                }
            });
        }
    }
    moveTokenDOM() { this.renderAllTokens(); if(navigator.vibrate) navigator.vibrate(20); }
}

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.ludo = new LudoGame(); }, 200); });
