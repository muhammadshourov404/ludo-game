export const cardEffects = {
  'extra-dice': (game, player) => {
    // Allow another dice roll immediately
    game.canRollAgain = true;
    game.notifyListeners({ type: 'card-effect', effect: 'extra-dice' });
  },
  'shield': (game, player) => {
    // Protect a piece from capture for one turn (implementation in capture logic)
    game.shieldActive = { player, turns: 1 };
  },
  'swap': (game, player) => {
    // Swap a piece with opponent
    // Implement UI selection
  },
  'double': (game, player) => {
    // Double dice value for one move
    game.diceValue *= 2;
  }
};
