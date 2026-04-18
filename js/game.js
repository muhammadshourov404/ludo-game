// js/game.js
// V4MPIR3 Ludo - Core Game Logic with Home Path & Win Logic
import { sounds } from './sound.js';
import { CardSystem, MagicEffects } from './cards.js';

class LudoGame {
    constructor() {
        this.diceValue = 0;
        this.currentPlayer = 'red'; 
        this.isRolling = false;
        this.diceRolled = false; 
        
        this.tokens = {
            red: [{ id: 0, state: 'base', position: -1, basePos: [2, 2] }, { id: 1, state: 'base', position: -1, basePos: [2, 3] }, { id: 2, state: 'base', position: -1, basePos: [3, 2] }, { id: 3, state: 'base', position: -1, basePos: [3, 3] }],
            green: [{ id: 0, state: 'base', position: -1, basePos: [2, 11] }, { id: 1, state: 'base', position: -1, basePos: [2, 12] }, { id: 2, state: 'base', position: -1, basePos: [3, 11] }, { id: 3, state: 'base', position: -1, basePos: [3, 12] }],
            yellow: [{ id: 0, state: 'base', position: -1, basePos: [11, 11] }, { id: 1, state: 'base', position: -1, basePos: [11, 12] }, { id: 2, state: 'base', position: -1, basePos: [12, 11] }, { id: 3, state: 'base', position: -1, basePos: [12, 12] }],
            blue: [{ id: 0, state: 'base', position: -1, basePos: [11, 2] }, { id: 1, state: 'base', position: -1, basePos: [11, 3] }, { id: 2, state: 'base', position: -1, basePos: [12, 2] }, { id: 3, state: 'base', position: -1, basePos: [12, 3] }]
        };

        // Outer Board Path (52 Steps)
        this.masterPath = [
            [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6], [0,7], [0,8], 
            [1,8], [2,8], [3,8], [4,8], [5,8], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14], [7,14], [8,14],
            [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], [14,7], [14,6],
            [13,6], [12,6], [11,6], [10,6], [9,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0], [7,0], [6,0]
        ];

        // Specific Home Paths for each color (Entering the center)
        this.homePaths = {
            red: [[7,1], [7,2], [7,3], [7,4], [7,5], [7,6]], // 7,6 is center Goal
            green: [[1,7], [2,7], [3,7], [4,7], [5,7], [6,7]],
            yellow: [[7,13], [7,12], [7,11], [7,10], [7,9], [7,8]],
            blue: [[13,7], [12,7], [11,7], [10,7], [9,7], [8,7]]
        };

        this.safeZones = [[6,1], [2,6], [1,8], [6,12], [8,13], [12,8], [13,6], [8,2]];
        this.pathOffsets = { red: 0, green: 13, yellow: 26, blue: 39 };

        this.diceFaces = {
            1: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="50" cy="50" r="10" fill="black"/></svg>',
            2: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="30" r="10" fill="black"/><circle cx="70" cy="70" r="10" fill="black"/></svg>',
            3: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="25" cy="25" r="10" fill="black"/><circle cx="50" cy="50" r="10" fill="black"/><circle cx="75" cy="75" r="10" fill="black"/></svg>',
            4: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="30" r="10" fill="black"/><circle cx="70" cy="30" r="10" fill="black"/><circle cx="30" cy="70" r="10" fill="black"/><circle cx="70" cy="70" r="10" fill="black"/></svg>',
            5: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="25" cy="25" r="10" fill="black"/><circle cx="75" cy="25" r="10" fill="black"/><circle cx="50" cy="50" r="10" fill="black"/><circle cx="25" cy="75" r="10" fill="black"/><circle cx="75" cy="75" r="10" fill="black"/></svg>',
            6: '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="white"/><circle cx="30" cy="20" r="10" fill="black"/><circle cx="30" cy="50" r="10" fill="black"/><circle cx="30" cy="80" r="10" fill="black"/><circle cx="70" cy="20" r="10" fill="black"/><circle cx="70" cy="50" r="10" fill="black"/><circle cx="70" cy="80" r="10" fill="black"/></svg>'
        };

        this.init();
    }

    init() {
        this.diceContainer = document.getElementById('dice-container');
        this.rollBtn = document.getElementById('roll-btn');
        this.diceContainer.innerHTML = this.diceFaces[6]; 

        this.rollBtn.addEventListener('click', () => this.rollDice());
        this.diceContainer.addEventListener('click', () => this.rollDice());

        setTimeout(() => this.renderAllTokens(), 100);
        this.updateActiveUI();
    }

    updateActiveUI() {
        document.getElementById('player-1-info').style.opacity = (this.currentPlayer === 'red') ? '1' : '0.5';
        document.getElementById('player-2-info').style.opacity = (this.currentPlayer === 'green') ? '1' : '0.5';
    }

    rollDice() {
        if (this.isRolling || this.diceRolled) return; 
        this.isRolling = true;
        sounds.play('dice');

        this.diceContainer.classList.add('rolling');
        if (navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            this.diceContainer.innerHTML = this.diceFaces[this.diceValue];
            this.diceContainer.classList.remove('rolling');
            this.diceRolled = true;

            this.checkAvailableMoves();
        }, 400);
    }

    checkAvailableMoves() {
        let canMove = false;
        this.tokens[this.currentPlayer].forEach(token => {
            if (token.state === 'base' && this.diceValue === 6) canMove = true;
            if (token.state === 'active' && (token.position + this.diceValue <= 56)) canMove = true;
        });

        if (!canMove) {
            console.log(`[Game] No valid moves. Turn passes.`);
            setTimeout(() => this.switchTurn(), 800); 
        }
    }

    handleTokenClick(color, id) {
        if (color !== this.currentPlayer || !this.diceRolled) return;

        const token = this.tokens[color][id];

        // 1. Get out of base
        if (token.state === 'base' && this.diceValue === 6) {
            token.state = 'active';
            token.position = 0; 
            this.moveTokenDOM(color, id);
            this.diceRolled = false; 
            return;
        }

        // 2. Move active token
        if (token.state === 'active') {
            let newPos = token.position + this.diceValue;

            // Check if move is valid (Can't exceed position 56, which is the goal)
            if (newPos > 56) {
                console.log(`[Game] Invalid move! Exact roll required.`);
                return; // Token shakes or ignores click
            }

            token.position = newPos;

            // Check Capture Logic (Only on outer track, not in home path)
            let capturedOpponent = false;
            if (token.position <= 50) {
                let targetMasterIndex = (this.pathOffsets[color] + token.position) % 52;
                let [targetR, targetC] = this.masterPath[targetMasterIndex];
                capturedOpponent = this.checkCapture(targetR, targetC, color);
            }

            // Check if Token reached the GOAL (Position 56)
            let reachedGoal = false;
            if (token.position === 56) {
                token.state = 'goal';
                reachedGoal = true;
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Celebrate!
                console.log(`🎉 ${color} token ${id} REACHED THE GOAL!`);
                this.checkWinCondition(color);
            }
sounds.play('move');

// Check for Magic Effect
const effect = this.magicSystem.getEffectAt(token.position);
if(effect) {
    this.magicSystem.applyEffect(token, effect);
    alert(`✨ Magic: ${effect.toUpperCase()}`); // পরে এটি সুন্দর ইমোজি দিয়ে রিপ্লেস করব
}

            this.moveTokenDOM(color, id);
            
            // Bonus turns for rolling 6, capturing, or reaching goal
            if (capturedOpponent || this.diceValue === 6 || reachedGoal) {
                this.diceRolled = false; 
            } else {
                this.diceRolled = false;
                this.switchTurn();
            }
        }
    }

    checkCapture(r, c, attackerColor) {
        const isSafe = this.safeZones.some(zone => zone[0] === r && zone[1] === c);
        if (isSafe) return false;

        let captureHappened = false;

        for (const [color, tokensArray] of Object.entries(this.tokens)) {
            if (color !== attackerColor) {
                tokensArray.forEach(token => {
                    if (token.state === 'active' && token.position <= 50) {
                        let masterIndex = (this.pathOffsets[color] + token.position) % 52;
                        let [enemyR, enemyC] = this.masterPath[masterIndex];
                        
                        if (enemyR === r && enemyC === c) {
                            token.state = 'base';
                            token.position = -1;
                            captureHappened = true;
                            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
                        }
                    }
                });
            }
        }
        return captureHappened;
    }

    checkWinCondition(color) {
        // Check if all 4 tokens of this color are in the goal
        const allHome = this.tokens[color].every(token => token.state === 'goal');
        if (allHome) {
            setTimeout(() => {
                alert(`🏆 GAME OVER! ${color.toUpperCase()} WINS! 🏆`);
                // Later we will build a beautiful UI Modal for this instead of alert
            }, 500);
        }
    }

    switchTurn() {
        this.currentPlayer = (this.currentPlayer === 'red') ? 'green' : 'red';
        this.updateActiveUI();
        this.renderAllTokens(); 
    }

    renderAllTokens() {
        document.querySelectorAll('.token').forEach(el => el.remove());

        for (const [color, tokensArray] of Object.entries(this.tokens)) {
            tokensArray.forEach(tokenData => {
                let r, c;

                if (tokenData.state === 'base') {
                    [r, c] = tokenData.basePos;
                } 
                else if (tokenData.state === 'active' || tokenData.state === 'goal') {
                    if (tokenData.position <= 50) {
                        // Outer Track
                        let masterIndex = (this.pathOffsets[color] + tokenData.position) % 52;
                        [r, c] = this.masterPath[masterIndex];
                    } else if (tokenData.position > 50 && tokenData.position <= 56) {
                        // Inner Home Path
                        let homeIndex = tokenData.position - 51; // 51->0, 52->1...
                        [r, c] = this.homePaths[color][homeIndex];
                    }
                }

                if(r !== undefined && c !== undefined) {
                    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        const tokenEl = document.createElement('div');
                        tokenEl.classList.add('token', `token-${color}`);
                        
                        if (color === this.currentPlayer && tokenData.state !== 'goal') {
                            tokenEl.classList.add('token-active');
                        }
                        if (tokenData.state === 'goal') {
                            tokenEl.style.transform = 'scale(0.6)'; // Shrink tokens in the goal
                            tokenEl.style.opacity = '0.8';
                        }
                        
                        tokenEl.id = `token-${color}-${tokenData.id}`;
                        tokenEl.addEventListener('click', () => this.handleTokenClick(color, tokenData.id));
                        cell.appendChild(tokenEl);
                    }
                }
            });
        }
    }

    moveTokenDOM(color, id) {
        this.renderAllTokens();
        if (navigator.vibrate) navigator.vibrate(20);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('ludo-board')) {
        window.ludo = new LudoGame();
    }
});
