// js/cards.js - By V4MPIR3
// Magical Mode: Power-ups and Traps

export const MagicEffects = {
    TRAP: 'trap',           // ৩ ঘর পিছিয়ে যাবে
    SPEED: 'speed',         // ২ ঘর বোনাস সামনে যাবে
    SHIELD: 'shield',       // ১ বার গুটি কাটা থেকে রক্ষা পাবে
    TELEPORT: 'teleport'    // বোর্ডের অন্য একটি র‍্যান্ডম ঘরে যাবে
};

export class CardSystem {
    constructor() {
        // বোর্ডে ম্যাজিক ঘরগুলোর পজিশন (ইন্ডেক্স)
        this.magicPositions = [10, 22, 35, 48]; 
    }

    getEffectAt(position) {
        if (this.magicPositions.includes(position)) {
            const effects = Object.values(MagicEffects);
            return effects[Math.floor(Math.random() * effects.length)];
        }
        return null;
    }

    applyEffect(token, effect) {
        console.log(`✨ Magic Applied: ${effect}`);
        switch(effect) {
            case MagicEffects.TRAP:
                token.position = Math.max(0, token.position - 3);
                break;
            case MagicEffects.SPEED:
                token.position += 2;
                break;
            case MagicEffects.TELEPORT:
                token.position = (token.position + 15) % 52;
                break;
            // Shield logic will be implemented in game.js capture check
        }
        return effect;
    }
}
