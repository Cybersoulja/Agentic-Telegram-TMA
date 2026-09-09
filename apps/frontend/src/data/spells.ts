import type { Spell, CharacterClass } from '../types/game';

export const SPELLS: Record<string, Spell> = {
  // Warrior Spells
  battle_cry: {
    id: 'battle_cry',
    name: 'Battle Cry',
    description: 'Unleash a mighty roar, boosting your strength for 3 turns.',
    manaCost: 5,
    effect: 'buff_strength',
    targetType: 'self',
    requiredClass: ['warrior'],
    requiredLevel: 3,
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Bash an enemy with your shield, dealing damage and stunning them.',
    manaCost: 8,
    damage: 15,
    effect: 'stun',
    targetType: 'single',
    requiredClass: ['warrior'],
    requiredLevel: 5,
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Whirlwind Attack',
    description: 'Spin in a circle, hitting all enemies.',
    manaCost: 12,
    damage: 20,
    targetType: 'area',
    requiredClass: ['warrior'],
    requiredLevel: 10,
  },

  // Mage Spells
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a ball of fire that burns enemies.',
    manaCost: 15,
    damage: 30,
    effect: 'burn',
    targetType: 'single',
    requiredClass: ['mage'],
    requiredLevel: 1,
  },
  ice_shard: {
    id: 'ice_shard',
    name: 'Ice Shard',
    description: 'Fire a shard of ice that freezes the target.',
    manaCost: 12,
    damage: 20,
    effect: 'freeze',
    targetType: 'single',
    requiredClass: ['mage'],
    requiredLevel: 3,
  },
  arcane_blast: {
    id: 'arcane_blast',
    name: 'Arcane Blast',
    description: 'Unleash pure arcane energy.',
    manaCost: 20,
    damage: 40,
    targetType: 'single',
    requiredClass: ['mage'],
    requiredLevel: 7,
  },
  lightning_storm: {
    id: 'lightning_storm',
    name: 'Lightning Storm',
    description: 'Summon lightning to strike all enemies.',
    manaCost: 25,
    damage: 35,
    targetType: 'area',
    requiredClass: ['mage'],
    requiredLevel: 10,
  },

  // Rogue Spells
  poison_strike: {
    id: 'poison_strike',
    name: 'Poison Strike',
    description: 'Strike with a poisoned blade.',
    manaCost: 8,
    damage: 10,
    effect: 'poison',
    targetType: 'single',
    requiredClass: ['rogue'],
    requiredLevel: 2,
  },
  shadow_step: {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Teleport behind an enemy for a devastating strike.',
    manaCost: 10,
    damage: 25,
    targetType: 'single',
    requiredClass: ['rogue'],
    requiredLevel: 5,
  },
  blade_dance: {
    id: 'blade_dance',
    name: 'Blade Dance',
    description: 'Dance through enemies with your blades.',
    manaCost: 15,
    damage: 18,
    targetType: 'area',
    requiredClass: ['rogue'],
    requiredLevel: 8,
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    description: 'Throw a smoke bomb, reducing enemy accuracy.',
    manaCost: 6,
    effect: 'debuff_attack',
    targetType: 'area',
    requiredClass: ['rogue'],
    requiredLevel: 4,
  },

  // Cleric Spells
  heal: {
    id: 'heal',
    name: 'Heal',
    description: 'Channel divine energy to restore health.',
    manaCost: 10,
    healing: 30,
    targetType: 'self',
    requiredClass: ['cleric'],
    requiredLevel: 1,
  },
  divine_shield: {
    id: 'divine_shield',
    name: 'Divine Shield',
    description: 'Surround yourself with holy protection.',
    manaCost: 12,
    effect: 'buff_defense',
    targetType: 'self',
    requiredClass: ['cleric'],
    requiredLevel: 3,
  },
  smite: {
    id: 'smite',
    name: 'Smite',
    description: 'Strike down evil with holy power.',
    manaCost: 15,
    damage: 28,
    targetType: 'single',
    requiredClass: ['cleric'],
    requiredLevel: 5,
  },
  holy_light: {
    id: 'holy_light',
    name: 'Holy Light',
    description: 'Bathe the battlefield in healing light.',
    manaCost: 20,
    healing: 20,
    targetType: 'area',
    requiredClass: ['cleric'],
    requiredLevel: 7,
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Grant continuous healing over time.',
    manaCost: 15,
    effect: 'regeneration',
    targetType: 'self',
    requiredClass: ['cleric'],
    requiredLevel: 6,
  },
};

export function getSpellsByClass(characterClass: CharacterClass): Spell[] {
  return Object.values(SPELLS).filter(
    (spell) =>
      spell.requiredClass && spell.requiredClass.includes(characterClass)
  );
}

export function getSpellById(spellId: string): Spell | undefined {
  return SPELLS[spellId];
}

export function getAvailableSpells(characterClass: CharacterClass, level: number): Spell[] {
  return getSpellsByClass(characterClass).filter(
    (spell) => spell.requiredLevel <= level
  );
}
