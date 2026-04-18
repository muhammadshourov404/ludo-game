export const MagicEffects = { TRAP: 'trap', SPEED: 'speed', TELEPORT: 'teleport' };
export class CardSystem {
    constructor() { this.magicPositions = [10, 22, 35, 48]; }
    getEffectAt(position) {
        if (this.magicPositions.includes(position)) {
            const effects = Object.values(MagicEffects);
            return effects[Math.floor(Math.random() * effects.length)];
        }
        return null;
    }
    applyEffect(token, effect) {
        switch(effect) {
            case MagicEffects.TRAP: token.position = Math.max(0, token.position - 3); break;
            case MagicEffects.SPEED: token.position = Math.min(50, token.position + 2); break;
            case MagicEffects.TELEPORT: token.position = (token.position + 15) % 52; break;
        }
        return effect;
    }
}
