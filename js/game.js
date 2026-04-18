// js/game.js
// V4MPIR3 Ludo - Core Game Logic & Dice System

class LudoGame {
    constructor() {
        this.diceValue = 1;
        this.currentPlayer = 'red'; // Turns: red, green, yellow, blue
        this.isRolling = false;
        
        // Pure SVG Dice Faces (No external images required)
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
        
        // Initial Dice setup (Shows 6 by default)
        this.diceContainer.innerHTML = this.diceFaces[6];

        // Event Listeners for rolling
        this.rollBtn.addEventListener('click', () => this.rollDice());
        this.diceContainer.addEventListener('click', () => this.rollDice());

        // Wait a few milliseconds to ensure board.js has rendered the DOM cells
        setTimeout(() => this.placeInitialTokens(), 100);
    }

    rollDice() {
        if (this.isRolling) return;
        this.isRolling = true;

        // Trigger CSS Animation
        this.diceContainer.classList.add('rolling');
        
        // Haptic Feedback for mobile browsers (Vibration)
        if (navigator.vibrate) navigator.vibrate(50);

        // Calculate result after animation ends
        setTimeout(() => {
            // Generate Random Number between 1 and 6
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            
            // Update SVG
            this.diceContainer.innerHTML = this.diceFaces[this.diceValue];
            
            // Remove animation class
            this.diceContainer.classList.remove('rolling');
            this.isRolling = false;
            
            console.log(`[Game Engine] Player: ${this.currentPlayer} rolled a ${this.diceValue}`);
            
            // Logic to move token will be called here next
            
        }, 400); // 400ms matches CSS animation duration
    }

    placeInitialTokens() {
        // Safe Home Coordinates [row, col] for all 16 tokens
        const homes = {
            red: [[2, 2], [2, 3], [3, 2], [3, 3]],
            green: [[2, 11], [2, 12], [3, 11], [3, 12]],
            blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
            yellow: [[11, 11], [11, 12], [12, 11], [12, 12]]
        };

        for (const [color, positions] of Object.entries(homes)) {
            positions.forEach((pos, index) => {
                this.createToken(color, index, pos[0], pos[1]);
            });
        }
        console.log("[Game Engine] All 16 Tokens Placed in Bases successfully.");
    }

    createToken(color, id, row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            const token = document.createElement('div');
            token.classList.add('token', `token-${color}`);
            token.id = `token-${color}-${id}`;
            
            // Adding pulse animation only to the current player's token (visual indicator)
            if (color === this.currentPlayer) {
                token.classList.add('token-active');
            }
            
            cell.appendChild(token);
        }
    }
}

// Start Game Engine automatically when files load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if board exists
    if(document.getElementById('ludo-board')) {
        window.ludo = new LudoGame();
    }
});
