/* =============================================
   LUDO NEXUS — Magic Cards (js/cards.js)
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const Cards = (() => {

  const CARD_DEFS = [
    {
      id: 'boost',
      icon: '🚀',
      name: 'Boost',
      desc: 'Move +3 extra steps',
      color: '#ff8040',
      rarity: 'common',
      action(state, playerIdx, tokenIdx) {
        const player = state.players[playerIdx];
        const token = player.tokens[tokenIdx];
        if (token.pos === -1 || token.pos >= 56) return false;
        const newPos = Math.min(token.pos + 3, 56);
        token.pos = newPos;
        Sound.play('powerUp');
        UI.toast('🚀 Boost! +3 steps!');
        return true;
      }
    },
    {
      id: 'shield',
      icon: '🛡',
      name: 'Shield',
      desc: 'Protect from 1 cut',
      color: '#40c8ff',
      rarity: 'common',
      action(state, playerIdx, tokenIdx) {
        const player = state.players[playerIdx];
        const token = player.tokens[tokenIdx];
        if (token.pos === -1) return false;
        token.shielded = true;
        Sound.play('shield');
        UI.toast('🛡 Shield activated!');
        return true;
      }
    },
    {
      id: 'swap',
      icon: '🌀',
      name: 'Swap',
      desc: 'Swap with opponent token',
      color: '#bf7fff',
      rarity: 'rare',
      requiresTarget: true,
      action(state, playerIdx, tokenIdx, targetPlayerIdx, targetTokenIdx) {
        const myPlayer = state.players[playerIdx];
        const myToken = myPlayer.tokens[tokenIdx];
        const targetPlayer = state.players[targetPlayerIdx];
        const targetToken = targetPlayer.tokens[targetTokenIdx];
        if (!targetToken || targetToken.pos === -1 || targetToken.pos >= 56) return false;
        const tmp = myToken.pos;
        myToken.pos = targetToken.pos;
        targetToken.pos = tmp;
        Sound.play('swap');
        UI.toast(`🌀 Swapped with ${targetPlayer.name}!`);
        return true;
      }
    },
    {
      id: 'freeze',
      icon: '❄',
      name: 'Freeze',
      desc: 'Freeze opponent for 1 turn',
      color: '#80d4ff',
      rarity: 'rare',
      requiresPlayer: true,
      action(state, playerIdx, tokenIdx, targetPlayerIdx) {
        const targetPlayer = state.players[targetPlayerIdx];
        if (!targetPlayer || targetPlayerIdx === playerIdx) return false;
        targetPlayer.frozen = 2; // freeze 2 turns
        Sound.play('freeze');
        UI.toast(`❄ ${targetPlayer.name} frozen!`);
        return true;
      }
    },
    {
      id: 'double',
      icon: '⚡',
      name: 'Double',
      desc: 'Roll dice twice this turn',
      color: '#ffe040',
      rarity: 'rare',
      action(state, playerIdx) {
        state.players[playerIdx].doubleTurn = true;
        Sound.play('magic');
        UI.toast('⚡ Double turn activated!');
        return true;
      }
    },
    {
      id: 'reverse',
      icon: '🔄',
      name: 'Reverse',
      desc: "Reverse opponent's last move",
      color: '#ff6080',
      rarity: 'epic',
      action(state, playerIdx, tokenIdx, targetPlayerIdx, targetTokenIdx) {
        const targetPlayer = state.players[targetPlayerIdx];
        const targetToken = targetPlayer ? targetPlayer.tokens[targetTokenIdx] : null;
        if (!targetToken || targetToken.pos === -1) return false;
        const lastMove = state.lastMoves && state.lastMoves[targetPlayerIdx];
        if (!lastMove) return false;
        targetToken.pos = lastMove.fromPos;
        Sound.play('magic');
        UI.toast(`🔄 Reversed ${targetPlayer.name}'s move!`);
        return true;
      }
    },
    {
      id: 'teleport',
      icon: '🌟',
      name: 'Teleport',
      desc: 'Move to nearest safe square',
      color: '#ffd700',
      rarity: 'epic',
      action(state, playerIdx, tokenIdx) {
        const player = state.players[playerIdx];
        const token = player.tokens[tokenIdx];
        if (token.pos === -1 || token.pos >= 50) return false;
        // Find next safe cell
        const safeCells = Board.getSafeCells();
        const startPos = Board.getStartPos()[player.color];
        let target = token.pos;
        for (let i = token.pos + 1; i < 50; i++) {
          const absPos = (startPos + i) % 56;
          if (safeCells.has(absPos)) { target = i; break; }
        }
        token.pos = Math.min(target, 49);
        Sound.play('powerUp');
        UI.toast('🌟 Teleported to safe square!');
        return true;
      }
    },
    {
      id: 'bomb',
      icon: '💣',
      name: 'Bomb',
      desc: 'Send all tokens on a cell home',
      color: '#ff4040',
      rarity: 'legendary',
      requiresCell: true,
      action(state, playerIdx, tokenIdx, targetPlayerIdx, targetTokenIdx, targetCell) {
        let sent = 0;
        state.players.forEach((p, pi) => {
          if (pi === playerIdx) return;
          p.tokens.forEach(t => {
            if (!targetCell) return;
            // Check if token is at targetCell
            const startPos = Board.getStartPos()[p.color];
            const absPos = (startPos + t.pos) % 56;
            const [tc, tr] = Board.getMainPath()[targetCell] || [];
            const [pc, pr] = Board.getMainPath()[absPos] || [];
            if (tc === pc && tr === pr && t.pos >= 0 && t.pos < 50 && !t.shielded) {
              t.pos = -1; sent++;
            } else if (t.shielded) { t.shielded = false; }
          });
        });
        Sound.play('cut');
        UI.toast(`💣 Bomb! ${sent} token(s) sent home!`);
        return true;
      }
    }
  ];

  const RARITIES = { common: 60, rare: 30, epic: 8, legendary: 2 };

  function randomCard() {
    let roll = Math.random() * 100;
    let rarity = 'common';
    if (roll < RARITIES.legendary) rarity = 'legendary';
    else if (roll < RARITIES.legendary + RARITIES.epic) rarity = 'epic';
    else if (roll < RARITIES.legendary + RARITIES.epic + RARITIES.rare) rarity = 'rare';

    const pool = CARD_DEFS.filter(c => c.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getCard(id) { return CARD_DEFS.find(c => c.id === id); }

  function renderCardRow(playerCards) {
    const row = document.getElementById('magic-cards-row');
    if (!row) return;
    row.innerHTML = '';
    if (!playerCards || !playerCards.length) { row.style.display = 'none'; return; }
    row.style.display = 'flex';

    playerCards.forEach((card, i) => {
      const def = getCard(card.id);
      if (!def) return;
      const el = document.createElement('div');
      el.className = 'magic-card';
      el.style.borderColor = def.color + '88';
      el.innerHTML = `
        <span class="magic-card-icon">${def.icon}</span>
        <span>${def.name}</span>
      `;
      el.title = def.desc;
      el.onclick = () => Game.useCard(i);
      row.appendChild(el);
    });
  }

  function showMagicEffect(x, y) {
    const layer = document.getElementById('magic-effects');
    if (!layer) return;
    const burst = document.createElement('div');
    burst.className = 'magic-burst';
    burst.style.left = (x - 20) + 'px';
    burst.style.top  = (y - 20) + 'px';
    layer.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  return { CARD_DEFS, randomCard, getCard, renderCardRow, showMagicEffect };
})();
