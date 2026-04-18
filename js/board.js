import { PLAYER_COLORS } from './game.js';

export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = 600; // fixed 600x600
    this.cellSize = this.size / 15; // 15x15 grid
  }
  
  render(game) {
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.drawBoard();
    this.drawSafeSpots(game.safeSpots);
    this.drawHomeAreas();
    this.drawPieces(game.pieces);
    this.drawCurrentPlayerIndicator(game.currentPlayer);
  }
  
  drawBoard() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    
    // Background
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--board-bg').trim() || '#fdfaf6';
    ctx.fillRect(0, 0, this.size, this.size);
    
    // Draw grid lines (paths)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#95a5a6';
    
    // Main path: we'll draw a stylized cross and square.
    // For simplicity, draw colored rectangles for home columns and rows.
    // We'll draw a standard Ludo board pattern.
    
    const colors = PLAYER_COLORS;
    
    // Home bases (corners)
    // Red (top-left)
    ctx.fillStyle = colors[0] + '40';
    ctx.fillRect(0, 0, 6*cs, 6*cs);
    // Blue (top-right)
    ctx.fillStyle = colors[1] + '40';
    ctx.fillRect(9*cs, 0, 6*cs, 6*cs);
    // Green (bottom-left)
    ctx.fillStyle = colors[2] + '40';
    ctx.fillRect(0, 9*cs, 6*cs, 6*cs);
    // Yellow (bottom-right)
    ctx.fillStyle = colors[3] + '40';
    ctx.fillRect(9*cs, 9*cs, 6*cs, 6*cs);
    
    // Center square
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(6*cs, 6*cs, 3*cs, 3*cs);
    
    // Path lines (simplified)
    ctx.beginPath();
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    // Horizontal middle
    ctx.moveTo(0, 7*cs); ctx.lineTo(6*cs, 7*cs);
    ctx.moveTo(9*cs, 7*cs); ctx.lineTo(15*cs, 7*cs);
    ctx.moveTo(0, 8*cs); ctx.lineTo(6*cs, 8*cs);
    ctx.moveTo(9*cs, 8*cs); ctx.lineTo(15*cs, 8*cs);
    // Vertical middle
    ctx.moveTo(7*cs, 0); ctx.lineTo(7*cs, 6*cs);
    ctx.moveTo(7*cs, 9*cs); ctx.lineTo(7*cs, 15*cs);
    ctx.moveTo(8*cs, 0); ctx.lineTo(8*cs, 6*cs);
    ctx.moveTo(8*cs, 9*cs); ctx.lineTo(8*cs, 15*cs);
    ctx.stroke();
    
    // Draw colored paths (home columns)
    // Red column (col 1)
    ctx.fillStyle = colors[0] + '80';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(1*cs, (i+6)*cs, cs, cs);
    }
    // Blue column (col 13)
    ctx.fillStyle = colors[1] + '80';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(13*cs, (i+6)*cs, cs, cs);
    }
    // Green row (row 1)
    ctx.fillStyle = colors[2] + '80';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect((i+6)*cs, 1*cs, cs, cs);
    }
    // Yellow row (row 13)
    ctx.fillStyle = colors[3] + '80';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect((i+6)*cs, 13*cs, cs, cs);
    }
    
    // Home stretch squares (colored)
    // We'll draw them as small rectangles later.
  }
  
  drawSafeSpots(safeSpots) {
    // Safe spots are stars, we can draw star symbol
    const ctx = this.ctx;
    ctx.font = `${this.cellSize*0.6}px Arial`;
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const positions = this.getCellCoordinatesFromIndex(0); // placeholder, we need mapping
    // We'll implement mapping later. For now skip.
  }
  
  drawHomeAreas() {
    // Draw home circles
  }
  
  getCellCoordinatesFromIndex(index) {
    // Convert global index 0-51 to x,y on canvas
    // Simplified: return center of cell
    const cs = this.cellSize;
    // Mapping: We'll create a path array later.
    // For now return dummy.
    return { x: 0, y: 0 };
  }
  
  drawPieces(pieces) {
    const ctx = this.ctx;
    const cs = this.cellSize;
    
    pieces.forEach((playerPieces, player) => {
      playerPieces.forEach((pos, idx) => {
        if (pos === -1) {
          // Draw in home base
          const baseX = (player % 2) * 9*cs + 1.5*cs + (idx%2)*2*cs;
          const baseY = Math.floor(player/2) * 9*cs + 1.5*cs + Math.floor(idx/2)*2*cs;
          this.drawPiece(baseX, baseY, player);
        } else {
          // Calculate position from index
          const coord = this.indexToCoord(pos, player);
          if (coord) this.drawPiece(coord.x, coord.y, player);
        }
      });
    });
  }
  
  indexToCoord(index, player) {
    // Full mapping of global path 0-51 and home run 51-55
    // We'll implement a proper path array.
    // For brevity, we'll use a precomputed path in a separate module.
    // But here we'll implement a basic one.
    const cs = this.cellSize;
    // Example mapping:
    if (index < 52) {
      // main path
      const path = this.getMainPath();
      const point = path[index];
      return { x: point.x * cs + cs/2, y: point.y * cs + cs/2 };
    } else {
      // home run for specific player
      const homeStart = {
        0: { x: 1, y: 7 }, // red
        1: { x: 13, y: 7 }, // blue
        2: { x: 7, y: 1 }, // green
        3: { x: 7, y: 13 } // yellow
      };
      const start = homeStart[player];
      const step = index - 51;
      if (player === 0) return { x: start.x * cs + cs/2, y: (start.y - step) * cs + cs/2 };
      if (player === 1) return { x: start.x * cs + cs/2, y: (start.y + step) * cs + cs/2 };
      if (player === 2) return { x: (start.x + step) * cs + cs/2, y: start.y * cs + cs/2 };
      if (player === 3) return { x: (start.x - step) * cs + cs/2, y: start.y * cs + cs/2 };
    }
    return null;
  }
  
  getMainPath() {
    // Returns array of {x, y} in grid coordinates (0-14)
    // We'll generate clockwise path starting from red start (0) = (1,6)
    const path = [];
    // First column 1, rows 6 down to 0? Actually standard Ludo: 
    // We'll build a 52-length array.
    // For simplicity, we'll create a dummy path.
    const cs = this.cellSize;
    // Placeholder: fill with dummy values
    for (let i = 0; i < 52; i++) {
      path.push({ x: (i % 13) + 1, y: Math.floor(i / 13) + 1 });
    }
    return path;
  }
  
  drawPiece(x, y, player) {
    const ctx = this.ctx;
    const rad = this.cellSize * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, 2*Math.PI);
    ctx.fillStyle = PLAYER_COLORS[player];
    ctx.shadowColor = '#00000040';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner highlight
    ctx.beginPath();
    ctx.arc(x-2, y-2, rad*0.3, 0, 2*Math.PI);
    ctx.fillStyle = '#ffffff60';
    ctx.fill();
  }
  
  drawCurrentPlayerIndicator(player) {
    // Will be handled by CSS/HTML
  }
}
