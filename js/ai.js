/* =============================================
   LUDO NEXUS — AI Bot (js/ai.js)
   Multi-difficulty AI with strategy
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const AI = (() => {

  // ─── Evaluate a token move ───
  function scoreMove(state, playerIdx, tokenIdx, diceValue) {
    const player = state.players[playerIdx];
    const token = player.tokens[tokenIdx];
    let score = 0;

    if (token.pos === -1 && diceValue !== 6) return -999; // Can't move
    if (token.pos >= 56) return -999; // Already finished

    const newPos = token.pos === -1 ? 0 : token.pos + diceValue;
    if (newPos > 56) return -500; // Can't overshoot

    const startPos = Board.getStartPos()[player.color];
    const absNewPos = (startPos + newPos) % 56;

    // ─── Scoring weights by difficulty ───
    const diff = state.aiDifficulty || 'medium';

    // Progress score
    score += newPos * 2;

    // Finishing
    if (newPos === 56) score += 200;

    // Entering home stretch
    if (newPos >= 50 && token.pos < 50) score += 60;

    // Check if can cut opponent
    let canCut = false;
    state.players.forEach((p, pi) => {
      if (pi === playerIdx) return;
      p.tokens.forEach(t => {
        if (t.pos < 0 || t.pos >= 50) return;
        const absT = (Board.getStartPos()[p.color] + t.pos) % 56;
        if (absT === absNewPos && !Board.getSafeCells().has(absNewPos) && !t.shielded) {
          canCut = true;
          score += 80;
        }
      });
    });

    // Safe cell bonus
    if (Board.getSafeCells().has(absNewPos)) score += 20;

    // Check if landing puts us in danger (only on medium+)
    if (diff !== 'easy') {
      state.players.forEach((p, pi) => {
        if (pi === playerIdx) return;
        p.tokens.forEach(t => {
          if (t.pos < 0 || t.pos >= 50) return;
          for (let d = 1; d <= 6; d++) {
            const absOpp = (Board.getStartPos()[p.color] + t.pos + d) % 56;
            if (absOpp === absNewPos && !Board.getSafeCells().has(absNewPos) && !token.shielded) {
              score -= 35;
            }
          }
        });
      });
    }

    // Prefer tokens closest to home (on hard+)
    if (diff === 'hard' || diff === 'expert') {
      if (token.pos > 30) score += 15;
      if (token.pos > 45) score += 25;
    }

    // Expert: advanced threat detection
    if (diff === 'expert') {
      // Avoid clustering
      let sameCell = 0;
      player.tokens.forEach((t, ti) => {
        if (ti === tokenIdx) return;
        if (t.pos === newPos) sameCell++;
      });
      if (sameCell > 0) score -= 10 * sameCell;
    }

    // Easy: add noise
    if (diff === 'easy') score += (Math.random() - 0.5) * 80;
    if (diff === 'medium') score += (Math.random() - 0.5) * 30;

    return score;
  }

  // ─── Choose best token to move ───
  function chooseBestToken(state, playerIdx, diceValue) {
    const player = state.players[playerIdx];
    let bestScore = -Infinity;
    let bestToken = -1;

    player.tokens.forEach((token, ti) => {
      if (token.pos >= 56) return;
      // Validate move
      if (token.pos === -1 && diceValue !== 6) return;
      const newPos = token.pos === -1 ? 0 : token.pos + diceValue;
      if (newPos > 56) return;

      const score = scoreMove(state, playerIdx, ti, diceValue);
      if (score > bestScore) {
        bestScore = score;
        bestToken = ti;
      }
    });

    return bestToken;
  }

  // ─── AI Turn ───
  function takeTurn(state, playerIdx, diceValue, callback) {
    const diff = state.aiDifficulty || 'medium';
    const delays = { easy: 900, medium: 700, hard: 500, expert: 400 };
    const delay = delays[diff] || 700;

    setTimeout(() => {
      const tokenIdx = chooseBestToken(state, playerIdx, diceValue);
      callback(tokenIdx);
    }, delay);
  }

  // ─── Choose magic card action (Expert AI) ───
  function chooseCardAction(state, playerIdx) {
    const player = state.players[playerIdx];
    if (!player.cards || !player.cards.length) return null;

    // Prioritize: boost if far, shield if threatened, freeze if someone close
    const card = player.cards[0];
    return { cardIdx: 0, tokenIdx: 0 };
  }

  return { takeTurn, chooseBestToken, scoreMove, chooseCardAction };
})();
