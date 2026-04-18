// Core Game Logic
export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
export const PLAYER_NAMES = ['লাল', 'নীল', 'সবুজ', 'হলুদ'];

export class LudoGame {
  constructor(options = {}) {
    this.mode = options.mode || 'classic'; // classic, rush, magical
    this.players = options.players || [
      { type: 'human', color: 0 },
      { type: 'ai', color: 1 },
      { type: 'ai', color: 2 },
      { type: 'ai', color: 3 }
    ];
    
    this.currentPlayer = 0;
    this.diceValue = null;
    this.diceRolled = false;
    this.canRollAgain = false; // for getting a 6
    this.winner = null;
    
    // Board state: 0-51 main path, each player has home path (4 steps) and home base
    // We'll represent pieces as an array for each player: positions.
    // Position -1 = home base, 0-50 = main path, 51-55 = home run (relative to player)
    this.pieces = [
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1]
    ];
    
    // Safe spots (global index)
    this.safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
    
    // Starting positions for each player (index on main path)
    this.startPositions = [0, 13, 26, 39];
    
    // Home run start index (after completing full circle) relative to player
    this.homeRunStart = 51;
    
    // Magic cards state
    this.cards = {
      deck: [],
      current: null,
      cooldown: 0
    };
    
    // Game event listeners
    this.listeners = [];
  }
  
  addListener(fn) { this.listeners.push(fn); }
  notifyListeners(event) { this.listeners.forEach(fn => fn(event)); }
  
  rollDice() {
    if (this.diceRolled && !this.canRollAgain) return false;
    if (this.winner !== null) return false;
    
    let value;
    if (this.mode === 'rush') {
      // Rush mode: biased to 4-6
      value = Math.floor(Math.random() * 3) + 4; // 4,5,6
    } else {
      value = Math.floor(Math.random() * 6) + 1;
    }
    
    this.diceValue = value;
    this.diceRolled = true;
    
    // Check if player can move
    const movablePieces = this.getMovablePieces(this.currentPlayer, value);
    if (movablePieces.length === 0) {
      // No moves possible, turn ends automatically
      this.canRollAgain = false;
      this.notifyListeners({ type: 'no-moves', player: this.currentPlayer });
    } else {
      if (value === 6) {
        this.canRollAgain = true;
        this.notifyListeners({ type: 'got-six', player: this.currentPlayer });
      } else {
        this.canRollAgain = false;
      }
    }
    
    this.notifyListeners({ type: 'dice-rolled', value, player: this.currentPlayer });
    
    // Magic mode: draw card after every 3 rolls
    if (this.mode === 'magical') {
      this.cards.cooldown++;
      if (this.cards.cooldown >= 3) {
        this.drawMagicCard();
        this.cards.cooldown = 0;
      }
    }
    
    return value;
  }
  
  getMovablePieces(player, dice) {
    const pieces = this.pieces[player];
    const movable = [];
    
    for (let i = 0; i < pieces.length; i++) {
      const pos = pieces[i];
      // If piece is home (-1) and dice == 6, can move out
      if (pos === -1 && dice === 6) {
        movable.push(i);
        continue;
      }
      // If piece is on board and not in home stretch completed
      if (pos >= 0 && pos < 51) {
        const newPos = this.calculateNewPosition(player, pos, dice);
        if (newPos !== null) movable.push(i);
      } else if (pos >= 51 && pos < 56) {
        // Home run
        const newHomePos = pos + dice;
        if (newHomePos <= 55) movable.push(i);
      }
    }
    return movable;
  }
  
  calculateNewPosition(player, currentPos, steps) {
    // Convert global position to relative to player's start
    const relativePos = (currentPos - this.startPositions[player] + 52) % 52;
    const newRelative = relativePos + steps;
    
    if (newRelative > 50) {
      // Entering home run
      const homeStep = newRelative - 51;
      if (homeStep < 4) {
        return 51 + homeStep;
      } else {
        return null; // overshoot
      }
    } else {
      // Still on main path
      let newGlobal = (this.startPositions[player] + newRelative) % 52;
      return newGlobal;
    }
  }
  
  movePiece(pieceIndex) {
    if (!this.diceRolled) return false;
    const player = this.currentPlayer;
    const pieces = this.pieces[player];
    const pos = pieces[pieceIndex];
    const dice = this.diceValue;
    
    let newPos;
    let captured = null;
    
    if (pos === -1) {
      if (dice !== 6) return false;
      newPos = this.startPositions[player];
    } else if (pos >= 0 && pos < 51) {
      newPos = this.calculateNewPosition(player, pos, dice);
      if (newPos === null) return false;
    } else if (pos >= 51) {
      newPos = pos + dice;
      if (newPos > 55) return false;
    }
    
    // Check for capture (only on main path)
    if (newPos < 51 && !this.safeSpots.includes(newPos)) {
      for (let p = 0; p < 4; p++) {
        if (p === player) continue;
        const targetPieces = this.pieces[p];
        for (let i = 0; i < targetPieces.length; i++) {
          if (targetPieces[i] === newPos) {
            captured = { player: p, piece: i };
            targetPieces[i] = -1;
            break;
          }
        }
      }
    }
    
    pieces[pieceIndex] = newPos;
    this.diceRolled = false;
    
    // Check win condition
    if (this.checkWin(player)) {
      this.winner = player;
      this.notifyListeners({ type: 'game-over', winner: player });
    } else {
      // Next turn logic
      if (dice === 6 && this.mode !== 'rush') {
        // Player gets another turn, keep currentPlayer
        this.notifyListeners({ type: 'extra-turn', player });
      } else {
        this.nextPlayer();
      }
    }
    
    this.notifyListeners({ 
      type: 'piece-moved', 
      player, piece: pieceIndex, 
      newPos, captured 
    });
    
    return true;
  }
  
  nextPlayer() {
    this.currentPlayer = (this.currentPlayer + 1) % 4;
    this.diceRolled = false;
    this.canRollAgain = false;
    this.notifyListeners({ type: 'turn-change', player: this.currentPlayer });
  }
  
  checkWin(player) {
    return this.pieces[player].every(p => p >= 55);
  }
  
  drawMagicCard() {
    const cards = [
      { name: 'Extra Dice', effect: 'extra-dice', icon: '🎲' },
      { name: 'Shield', effect: 'shield', icon: '🛡️' },
      { name: 'Swap', effect: 'swap', icon: '🔄' },
      { name: 'Double Move', effect: 'double', icon: '⚡' }
    ];
    const card = cards[Math.floor(Math.random() * cards.length)];
    this.cards.current = card;
    this.notifyListeners({ type: 'card-drawn', card });
  }
  
  useMagicCard() {
    if (!this.cards.current) return false;
    // Implement effects later
    this.cards.current = null;
    this.notifyListeners({ type: 'card-used' });
    return true;
  }
  
  // For AI and network synchronization
  getState() {
    return {
      pieces: JSON.parse(JSON.stringify(this.pieces)),
      currentPlayer: this.currentPlayer,
      diceValue: this.diceValue,
      diceRolled: this.diceRolled,
      winner: this.winner,
      mode: this.mode,
      cards: { ...this.cards }
    };
  }
  
  setState(state) {
    Object.assign(this, state);
    this.pieces = JSON.parse(JSON.stringify(state.pieces));
    this.notifyListeners({ type: 'state-sync' });
  }
}
