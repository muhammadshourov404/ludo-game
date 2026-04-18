// js/game.js
// V4MPIR3 Ludo - Core Game Logic, Movement & Turn System

class LudoGame {
    constructor() {
        this.diceValue = 0;
        // The game starts with Red
        this.currentPlayer = 'red'; 
        this.isRolling = false;
        this.diceRolled = false; // To track if the player has rolled the dice in their turn
        
        // Token State Management
        this.tokens = {
            red: [
                { id: 0, state: 'base', position: -1, basePos: [2, 2] },
                { id: 1, state: 'base', position: -1, basePos: [2, 3] },
                { id: 2, state: 'base', position: -1, basePos: [3, 2] },
                { id: 3, state: 'base', position: -1, basePos: [3, 3] }
            ],
            green: [
                { id: 0, state: 'base', position: -1, basePos: [2, 11] },
                { id: 1, state: 'base', position: -1, basePos: [2, 12] },
                { id: 2, state: 'base', position: -1, basePos: [3, 11] },
                { id: 3, state: 'base', position: -1, basePos: [3, 12] }
            ],
            yellow: [
                { id: 0, state: 'base', position: -1, basePos: [11, 11] },
                { id: 1, state: 'base', position: -1, basePos: [11, 12] },
                { id: 2, state: 'base', position: -1, basePos: [12, 11] },
                { id: 3, state: 'base', position: -1, basePos: [12, 12] }
            ],
            blue: [
                { id: 0, state: 'base', position: -1, basePos: [11, 2] },
                { id: 1, state: 'base', position: -1, basePos: [11, 3] },
                { id: 2, state: 'base', position: -1, basePos: [12, 2] },
                { id: 3, state: 'base', position: -1, basePos: [12, 3] }
            ]
        };

        // Master Path Array (52 Steps covering the entire outer track)
        this.masterPath = [
            [6,1], [6,2], [6,3], [6,4], [6,5], // Red start
            [5,6], [4,6], [3,6], [2,6], [1,6], [0,6], // Up to Green
            [0,7], [0,8], 
            [1,8], [2,8], [3,8], [4,8], [5,8], // Green start
            [6,9], [6,10], [6,11], [6,12], [6,13], [6,14], // Right to Yellow
            [7,14], [8,14],
            [8,13], [8,12], [8,11], [8,10], [8,9], // Yellow start
            [9,8], [10,8], [11,8], [12,8], [13,8], [14,8], // Down to Blue
            [14,7], [14,6],
            [13,6], [12,6], [11,6], [10,6], [9,6], // Blue start
            [8,5], [8,4], [8,3], [8,2], [8,1], [8,0], // Left to Red
            [7,0], [6,0]
        ];

        // Player Offsets (Where they enter the masterPath)
        this.pathOffsets = { red: 0, green: 13, yellow: 26, blue: 39 };

        // Pure SVG Dice Faces
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
        this.diceContainer.innerHTML = this.diceFaces[6]; // Default view

        this.rollBtn.addEventListener('click', () => this.rollDice());
        this.diceContainer.addEventListener('click', () => this.rollDice());

        setTimeout(() => this.renderAllTokens(), 100);
        this.updateActiveUI();
    }

    updateActiveUI() {
        // Highlight active player name
        document.getElementById('player-1-info').style.opacity = (this.currentPlayer === 'red') ? '1' : '0.5';
        document.getElementById('player-2-info').style.opacity = (this.currentPlayer === 'green') ? '1' : '0.5';
    }

    rollDice() {
        if (this.isRolling || this.diceRolled) return; // Prevent multiple rolls
        this.isRolling = true;
        this.diceContainer.classList.add('rolling');
        if (navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            this.diceContainer.innerHTML = this.diceFaces[this.diceValue];
            this.diceContainer.classList.remove('rolling');
            this.isRolling = false;
            this.diceRolled = true;

            console.log(`[Game] ${this.currentPlayer} rolled a ${this.diceValue}`);
            this.checkAvailableMoves();

        }, 400);
    }

    checkAvailableMoves() {
        let canMove = false;
        const currentTokens = this.tokens[this.currentPlayer];

        currentTokens.forEach(token => {
            if (token.state === 'base' && this.diceValue === 6) canMove = true;
            if (token.state === 'active') canMove = true;
        });

        if (!canMove) {
            console.log(`[Game] No valid moves for ${this.currentPlayer}. Turn passes.`);
            setTimeout(() => this.switchTurn(), 1000); // Wait 1 sec then switch
        } else {
            console.log(`[Game] Waiting for ${this.currentPlayer} to select a token.`);
        }
    }

    handleTokenClick(color, id) {
        if (color !== this.currentPlayer || !this.diceRolled) return;

        const token = this.tokens[color][id];

        // Rule 1: Get out of base with a 6
        if (token.state === 'base' && this.diceValue === 6) {
            token.state = 'active';
            token.position = 0; // Relative starting position (0 means their specific start square)
            this.moveTokenDOM(color, id);
            this.diceRolled = false; // Gets another turn after rolling 6
            console.log(`[Game] ${color} token ${id} is out of base!`);
            return;
        }

        // Rule 2: Move token forward
        if (token.state === 'active') {
            token.position += this.diceValue;
            this.moveTokenDOM(color, id);
            
            // Turn Logic (If not 6, switch turn)
            if (this.diceValue !== 6) {
                this.diceRolled = false;
                this.switchTurn();
            } else {
                this.diceRolled = false; // Keep turn
            }
        }
    }

    switchTurn() {
        // Simple 2-player switch for now (Red <-> Green). Will expand to 4 later.
        this.currentPlayer = (this.currentPlayer === 'red') ? 'green' : 'red';
        this.diceRolled = false;
        this.diceValue = 0;
        this.updateActiveUI();
        
        // Remove active pulse from all tokens, add to new current player
        document.querySelectorAll('.token').forEach(t => t.classList.remove('token-active'));
        document.querySelectorAll(`.token-${this.currentPlayer}`).forEach(t => t.classList.add('token-active'));
        
        console.log(`[Game] Turn switched to ${this.currentPlayer}`);
    }

    renderAllTokens() {
        // Clear board of existing tokens before redrawing
        document.querySelectorAll('.token').forEach(el => el.remove());

        for (const [color, tokensArray] of Object.entries(this.tokens)) {
            tokensArray.forEach(tokenData => {
                let r, c;

                if (tokenData.state === 'base') {
                    [r, c] = tokenData.basePos;
                } else if (tokenData.state === 'active') {
                    // Calculate absolute position on master path
                    let masterIndex = (this.pathOffsets[color] + tokenData.position) % 52;
                    [r, c] = this.masterPath[masterIndex];
                }

                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (cell) {
                    const tokenEl = document.createElement('div');
                    tokenEl.classList.add('token', `token-${color}`);
                    if (color === this.currentPlayer) tokenEl.classList.add('token-active');
                    tokenEl.id = `token-${color}-${tokenData.id}`;
                    
                    // Add Click Listener directly to the DOM element
                    tokenEl.addEventListener('click', () => this.handleTokenClick(color, tokenData.id));
                    
                    cell.appendChild(tokenEl);
                }
            });
        }
    }

    moveTokenDOM(color, id) {
        // To keep it perfectly synchronized without bugs, we re-render the board positions
        this.renderAllTokens();
        if (navigator.vibrate) navigator.vibrate(20); // Small haptic bump when moved
    }
}

// Start Game Engine
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('ludo-board')) {
        window.ludo = new LudoGame();
    }
});
