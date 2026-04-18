// js/ai.js - By V4MPIR3
// Smart AI Logic for Ludo Bot

export class LudoAI {
    constructor(game, color) {
        this.game = game;
        this.color = color; // 'green' by default
    }

    // AI এর চাল দেওয়ার প্রধান ফাংশন
    decideMove() {
        const tokens = this.game.tokens[this.color];
        const diceValue = this.game.diceValue;

        // ১. প্রায়োরিটি: যদি ৬ ওঠে এবং কোনো গুটি বেসে থাকে
        const baseToken = tokens.find(t => t.state === 'base');
        if (diceValue === 6 && baseToken) {
            return baseToken.id;
        }

        // ২. প্রায়োরিটি: এমন কোনো চাল আছে কি যা দিয়ে অন্যের গুটি কাটা যাবে?
        for (let token of tokens) {
            if (token.state === 'active') {
                let futurePos = token.position + diceValue;
                if (futurePos <= 50) {
                    let masterIndex = (this.game.pathOffsets[this.color] + futurePos) % 52;
                    let [r, c] = this.game.masterPath[masterIndex];
                    if (this.game.checkCapture(r, c, this.color, true)) { // true = simulation mode
                        return token.id;
                    }
                }
            }
        }

        // ৩. প্রায়োরিটি: হোমে ঢুকতে পারে বা গোল করতে পারে এমন গুটি
        const scoringToken = tokens.find(t => t.state === 'active' && (t.position + diceValue >= 50));
        if (scoringToken && (scoringToken.position + diceValue <= 56)) {
            return scoringToken.id;
        }

        // ৪. ডিফল্ট: যেকোনো একটি সক্রিয় গুটি বেছে নেওয়া
        const activeTokens = tokens.filter(t => t.state === 'active' && (t.position + diceValue <= 56));
        if (activeTokens.length > 0) {
            return activeTokens[Math.floor(Math.random() * activeTokens.length)].id;
        }

        return null; // কোনো চাল না থাকলে
    }
}
