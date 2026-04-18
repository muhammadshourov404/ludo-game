/* =============================================
   LUDO NEXUS — Board Renderer (js/board.js)
   Complete Canvas-based Ludo Board
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const Board = (() => {
  const GRID = 15; // 15x15 grid
  let canvas, ctx, cellSize, offsetX, offsetY;

  // Colors for 4 players
  const PLAYER_COLORS = {
    red:    '#e84040',
    blue:   '#4080e8',
    green:  '#40c860',
    yellow: '#e8c040'
  };
  const PLAYER_LIGHT = {
    red:    '#f8a0a0',
    blue:   '#a0c0f8',
    green:  '#a0e8b8',
    yellow: '#f8e0a0'
  };
  const PLAYER_DARK = {
    red:    '#8a1010',
    blue:   '#103080',
    green:  '#106030',
    yellow: '#806010'
  };

  // Safe squares indices on the main path
  const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

  // ─── Board path definition (56 squares) ───
  // Each entry: [col, row] on the 15x15 grid
  const PATH = [];
  function buildPath() {
    // Left side going down (col 0-5), red home entry
    const p = [];
    // Start at (6,13), go left, up, right... standard Ludo layout
    // Path goes: bottom-left → left col up → top-left → top row right →
    //            top-right → right col down → bottom-right → bottom row left
    const coords = [
      // Red start (bottom-left area)
      [6,13],[6,12],[6,11],[6,10],[6,9],
      [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
      [0,7],[0,6],
      [1,6],[2,6],[3,6],[4,6],[5,6],
      [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
      [7,0],[8,0],
      [8,1],[8,2],[8,3],[8,4],[8,5],
      [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
      [14,7],[14,8],
      [13,8],[12,8],[11,8],[10,8],[9,8],
      [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
      [7,14],[6,14]
    ];
    coords.forEach(c => p.push(c));
    return p;
  }

  // Home columns (color-coded center paths)
  const HOME_PATHS = {
    red:    [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
    blue:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
    green:  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
    yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]
  };

  // Home base positions (4 tokens each)
  const HOME_BASES = {
    red:    [[1,9],[3,9],[1,11],[3,11]],
    blue:   [[1,1],[3,1],[1,3],[3,3]],
    green:  [[9,1],[11,1],[9,3],[11,3]],
    yellow: [[11,9],[13,9],[11,11],[13,11]]
  };

  // Player start positions (index in PATH)
  const START_POS = { red: 0, blue: 13, green: 26, yellow: 39 };

  const mainPath = buildPath();

  // ─── Init ───
  function init() {
    canvas = document.getElementById('ludo-board');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const size = Math.min(
      canvas.parentElement.clientWidth,
      canvas.parentElement.clientHeight,
      600
    );
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID;
    offsetX = 0;
    offsetY = 0;
    if (typeof Game !== 'undefined' && Game.state) drawAll(Game.state);
    else drawEmpty();
  }

  // ─── Helpers ───
  function cell(col, row) {
    return {
      x: offsetX + col * cellSize,
      y: offsetY + row * cellSize,
      w: cellSize, h: cellSize,
      cx: offsetX + col * cellSize + cellSize / 2,
      cy: offsetY + row * cellSize + cellSize / 2
    };
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function drawStar(cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const ri = i === 0 ? r : (i % 2 === 0 ? r : r * 0.4);
      const a = (i * Math.PI * 2 / 5) - Math.PI / 2;
      const b = a + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(b) * (r * 0.42), Math.sin(b) * (r * 0.42));
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ─── Draw Board ───
  function drawEmpty() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard(null);
  }

  function drawAll(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard(state);
    drawPieces(state);
    if (state && state.hints && state.hints.length) drawHints(state.hints);
  }

  function drawBoard(state) {
    const S = canvas.width;
    const C = cellSize;

    // Background
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-secondary') || '#1a1230';
    ctx.fillRect(0, 0, S, S);

    // ─── Draw all 15x15 cells ───
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cl = cell(c, r);
        let color = getCellColor(c, r);
        roundRect(cl.x + 1, cl.y + 1, cl.w - 2, cl.h - 2, 3, color, null);
      }
    }

    // ─── Draw home base quadrants ───
    drawHomeQuadrant(0, 0, 'red');
    drawHomeQuadrant(9 * C, 0, 'green');
    drawHomeQuadrant(0, 9 * C, 'blue');
    drawHomeQuadrant(9 * C, 9 * C, 'yellow');

    // ─── Draw center triangle (finish zones) ───
    drawCenterTriangles();

    // ─── Draw safe stars ───
    drawSafeCells();

    // ─── Draw grid lines ───
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * C, 0); ctx.lineTo(i * C, S);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * C); ctx.lineTo(S, i * C);
      ctx.stroke();
    }

    // ─── Draw arrows on home paths ───
    drawHomePathArrows();
  }

  function getCellColor(c, r) {
    const dark = getComputedStyle(document.body).getPropertyValue('--bg-card') || '#1e1535';
    const path_color = 'rgba(255,255,255,0.06)';

    // Center 3x3 (final home)
    if (c >= 6 && c <= 8 && r >= 6 && r <= 8) return 'rgba(255,255,255,0.04)';

    // Red home path (col 7, rows 9-13)
    if (c === 7 && r >= 9 && r <= 13) return 'rgba(232,64,64,0.35)';
    // Blue home path (col 1-5, row 7)
    if (r === 7 && c >= 1 && c <= 5) return 'rgba(64,128,232,0.35)';
    // Green home path (col 7, rows 1-5)
    if (c === 7 && r >= 1 && r <= 5) return 'rgba(64,200,96,0.35)';
    // Yellow home path (col 9-13, row 7)
    if (r === 7 && c >= 9 && c <= 13) return 'rgba(232,192,64,0.35)';

    // Start squares (bold colors)
    if (c === 6 && r === 13) return PLAYER_COLORS.red + '88';
    if (c === 1 && r === 8)  return PLAYER_COLORS.blue + '88';
    if (c === 8 && r === 1)  return PLAYER_COLORS.green + '88';
    if (c === 13 && r === 6) return PLAYER_COLORS.yellow + '88';

    // Main path
    if (isOnMainPath(c, r)) return path_color;

    return dark;
  }

  function isOnMainPath(c, r) {
    return mainPath.some(([pc, pr]) => pc === c && pr === r);
  }

  function drawHomeQuadrant(x, y, color) {
    const C = cellSize;
    const size = C * 6;
    const pc = PLAYER_COLORS[color];
    const pl = PLAYER_LIGHT[color];

    ctx.save();
    ctx.translate(x, y);

    // Outer quadrant background
    roundRect(C * 0.5, C * 0.5, size - C, size - C, 8,
      pc + '22', pc + '88');
    ctx.lineWidth = 2;
    roundRect(C * 0.5, C * 0.5, size - C, size - C, 8, null, pc);

    // Inner home circle area
    const hx = C * 1, hy = C * 1, hw = C * 4, hh = C * 4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(hx, hy, hw, hh, 12) : ctx.rect(hx, hy, hw, hh);
    ctx.fillStyle = pl + '33';
    ctx.fill();
    ctx.strokeStyle = pc + 'aa';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Color label
    ctx.font = `bold ${C * 0.55}px Rajdhani`;
    ctx.fillStyle = pc;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = { red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW' };
    ctx.fillText(labels[color], C * 3, C * 5.5);

    ctx.restore();
  }

  function drawCenterTriangles() {
    const C = cellSize;
    const cx = 7.5 * C, cy = 7.5 * C;
    const r = C * 1.4;
    const colors = [
      PLAYER_COLORS.red, PLAYER_COLORS.blue,
      PLAYER_COLORS.green, PLAYER_COLORS.yellow
    ];
    const angles = [Math.PI / 2 * 2, Math.PI / 2 * 3, Math.PI / 2 * 0, Math.PI / 2 * 1];

    colors.forEach((color, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a1 = angles[i] - Math.PI / 4;
      const a2 = angles[i] + Math.PI / 4;
      ctx.lineTo(cx + Math.cos(a1) * r * 2, cy + Math.sin(a1) * r * 2);
      ctx.lineTo(cx + Math.cos(a2) * r * 2, cy + Math.sin(a2) * r * 2);
      ctx.closePath();
      ctx.fillStyle = color + 'cc';
      ctx.fill();
    });

    // Center star
    drawStar(cx, cy, C * 0.6, 'rgba(255,255,255,0.9)');
  }

  function drawSafeCells() {
    SAFE_CELLS.forEach(idx => {
      if (idx >= mainPath.length) return;
      const [c, r] = mainPath[idx];
      const cl = cell(c, r);
      // Draw star on safe cell
      ctx.save();
      ctx.globalAlpha = 0.7;
      drawStar(cl.cx, cl.cy, cellSize * 0.28, '#ffffff88');
      ctx.restore();
    });
  }

  function drawHomePathArrows() {
    const C = cellSize;
    const arrows = [
      { path: HOME_PATHS.red,    color: PLAYER_COLORS.red },
      { path: HOME_PATHS.blue,   color: PLAYER_COLORS.blue },
      { path: HOME_PATHS.green,  color: PLAYER_COLORS.green },
      { path: HOME_PATHS.yellow, color: PLAYER_COLORS.yellow }
    ];

    arrows.forEach(({ path, color }) => {
      if (!path.length) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = C * 0.25;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      path.forEach(([c, r], i) => {
        const cl = cell(c, r);
        if (i === 0) ctx.moveTo(cl.cx, cl.cy);
        else ctx.lineTo(cl.cx, cl.cy);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  // ─── Draw Pieces ───
  function drawPieces(state) {
    if (!state) return;
    state.players.forEach(player => {
      player.tokens.forEach((token, ti) => {
        drawToken(token, player.color, ti, state);
      });
    });
  }

  function drawToken(token, color, index, state) {
    if (!token.visible) return;
    const pos = getTokenPixelPos(token, color, index, state);
    if (!pos) return;

    const C = cellSize;
    const r = C * 0.3;
    const { x, y } = pos;

    // Shadow
    ctx.save();
    ctx.shadowColor = PLAYER_COLORS[color];
    ctx.shadowBlur = token.selected ? 16 : 6;

    // Piece body (circle)
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_COLORS[color];
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_LIGHT[color];
    ctx.fill();

    // Selection ring
    if (token.selected) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Shield indicator
    if (token.shielded) {
      ctx.beginPath();
      ctx.arc(x, y, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#64c8ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Frozen indicator
    if (token.frozen) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.4)';
      ctx.fill();
    }

    // Token number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${C * 0.22}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index + 1, x, y + 1);

    ctx.restore();
  }

  function getTokenPixelPos(token, color, index, state) {
    const C = cellSize;
    const offsets = [[-0.22,-0.22],[0.22,-0.22],[-0.22,0.22],[0.22,0.22]];

    if (token.pos === -1) {
      // At home base
      const [bc, br] = HOME_BASES[color][index];
      const cl = cell(bc, br);
      return { x: cl.cx, y: cl.cy };
    }

    if (token.pos >= 56) {
      // Finished — in center
      const [oc, or2] = offsets[index];
      return { x: canvas.width / 2 + oc * C, y: canvas.height / 2 + or2 * C };
    }

    // On main path or home path
    const absolutePos = (START_POS[color] + token.pos) % 56;

    if (token.pos >= 50) {
      // On home stretch
      const homeIdx = token.pos - 50;
      const homePath = HOME_PATHS[color];
      if (homeIdx < homePath.length) {
        const [hc, hr] = homePath[homeIdx];
        const cl = cell(hc, hr);
        // Offset for stacking
        const [oc, or2] = offsets[index];
        return { x: cl.cx + oc * C * 0.4, y: cl.cy + or2 * C * 0.4 };
      }
    }

    if (absolutePos < mainPath.length) {
      const [pc, pr] = mainPath[absolutePos];
      const cl = cell(pc, pr);
      // Count pieces on same cell for offset
      const stackOffset = getStackOffset(token, color, absolutePos, state, index);
      return { x: cl.cx + stackOffset.x, y: cl.cy + stackOffset.y };
    }
    return null;
  }

  function getStackOffset(token, color, pos, state, myIndex) {
    const offsets = [
      {x: 0, y: 0}, {x: cellSize * 0.22, y: 0},
      {x: 0, y: cellSize * 0.22}, {x: cellSize * 0.22, y: cellSize * 0.22}
    ];
    let count = 0;
    // Find how many tokens are stacked at this position
    if (state) {
      state.players.forEach(p => {
        p.tokens.forEach((t, ti) => {
          if (t.pos !== -1 && t.pos < 56) {
            const absP = (START_POS[p.color] + t.pos) % 56;
            if (absP === pos) count++;
          }
        });
      });
    }
    if (count <= 1) return {x: 0, y: 0};
    return offsets[myIndex % 4];
  }

  // ─── Draw Hints ───
  function drawHints(hints) {
    hints.forEach(hint => {
      if (hint.col === undefined) return;
      const cl = cell(hint.col, hint.row);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(cl.cx, cl.cy, cellSize * 0.34, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ─── Click Detection ───
  function getClickedCell(px, py) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = Math.floor((px - rect.left) * scaleX / cellSize);
    const cy = Math.floor((py - rect.top) * scaleY / cellSize);
    return { c: cx, r: cy };
  }

  function getTokenAtPixel(px, py, state) {
    if (!state) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (px - rect.left) * scaleX;
    const my = (py - rect.top) * scaleY;

    let found = null;
    state.players.forEach(player => {
      if (player.color !== state.players[state.currentPlayer].color) return;
      player.tokens.forEach((token, ti) => {
        const pos = getTokenPixelPos(token, player.color, ti, state);
        if (!pos) return;
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist < cellSize * 0.4) {
          found = { player, token, tokenIndex: ti };
        }
      });
    });
    return found;
  }

  // ─── Export path utils ───
  function getMainPath() { return mainPath; }
  function getHomePaths() { return HOME_PATHS; }
  function getHomeBases() { return HOME_BASES; }
  function getStartPos()  { return START_POS; }
  function getSafeCells() { return SAFE_CELLS; }

  return {
    init, drawAll, drawEmpty, resize,
    getTokenAtPixel, getClickedCell,
    getMainPath, getHomePaths, getHomeBases,
    getStartPos, getSafeCells,
    PLAYER_COLORS, PLAYER_LIGHT, PLAYER_DARK
  };
})();
