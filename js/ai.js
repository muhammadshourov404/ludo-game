export class AIPlayer {
  constructor(difficulty = 'easy') {
    this.difficulty = difficulty;
  }
  
  decideMove(game, playerIndex) {
    const movable = game.getMovablePieces(playerIndex, game.diceValue);
    if (movable.length === 0) return null;
    
    if (this.difficulty === 'easy') {
      // Random move
      return movable[Math.floor(Math.random() * movable.length)];
    } else {
      // Hard: prioritize pieces that can capture or reach safe spots
      let bestScore = -1;
      let bestPiece = movable[0];
      
      movable.forEach(pieceIdx => {
        const pos = game.pieces[playerIndex][pieceIdx];
        let newPos;
        if (pos === -1) newPos = game.startPositions[playerIndex];
        else if (pos < 51) newPos = game.calculateNewPosition(playerIndex, pos, game.diceValue);
        else newPos = pos + game.diceValue;
        
        let score = 0;
        // Capture potential
        if (newPos < 51 && !game.safeSpots.includes(newPos)) {
          for (let p = 0; p < 4; p++) {
            if (p === playerIndex) continue;
            if (game.pieces[p].includes(newPos)) {
              score += 50;
            }
          }
        }
        // Safe spot
        if (game.safeSpots.includes(newPos)) score += 30;
        // Progress towards home
        if (pos >= 0 && pos < 51) {
          score += (newPos - pos + 52) % 52;
        } else if (pos === -1) {
          score += 20; // getting out
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestPiece = pieceIdx;
        }
      });
      return bestPiece;
    }
  }
}
