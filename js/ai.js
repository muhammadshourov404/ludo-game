export class LudoAI {
    constructor(game, color) { this.game = game; this.color = color; }
    decideMove() {
        const tokens = this.game.tokens[this.color];
        const diceVal = this.game.diceValue;
        
        const baseToken = tokens.find(t => t.state === 'base');
        if (diceVal === 6 && baseToken) return baseToken.id;

        for (let token of tokens) {
            if (token.state === 'active') {
                let futurePos = token.position + diceVal;
                if (futurePos <= 50) {
                    let masterIndex = (this.game.pathOffsets[this.color] + futurePos) % 52;
                    let [r, c] = this.game.masterPath[masterIndex];
                    if (this.game.checkCapture(r, c, this.color, true)) return token.id;
                }
            }
        }
        const scoringToken = tokens.find(t => t.state === 'active' && (t.position + diceVal >= 50));
        if (scoringToken && (scoringToken.position + diceVal <= 56)) return scoringToken.id;

        const activeTokens = tokens.filter(t => t.state === 'active' && (t.position + diceVal <= 56));
        if (activeTokens.length > 0) return activeTokens[Math.floor(Math.random() * activeTokens.length)].id;
        return null;
    }
}
