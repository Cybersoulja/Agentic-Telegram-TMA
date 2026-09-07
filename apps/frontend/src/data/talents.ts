import type { Talent, CharacterClass } from '../types/game';

export const TALENTS: Record<string, Talent[]> = {
  warrior: [
    // Left Tree - Tank/Defense
    {
      id: 'warrior_fortify',
      name: 'Fortify',
      description: '+3 Constitution, +10% max health',
      requiredClass: 'warrior',
      requiredLevel: 5,
      tree: 'left',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { constitution: 3 } },
      ],
      icon: '🛡️',
    },
    {
      id: 'warrior_iron_skin',
      name: 'Iron Skin',
      description: '+5 armor, reduces all damage by 10%',
      requiredClass: 'warrior',
      requiredLevel: 10,
      tree: 'left',
      tier: 2,
      requirements: ['warrior_fortify'],
      effects: [
        { type: 'passive_ability', value: { armorBonus: 5, damageReduction: 0.1 } },
      ],
      icon: '⚙️',
    },
    {
      id: 'warrior_last_stand',
      name: 'Last Stand',
      description: 'When health drops below 25%, gain +50% defense for 3 turns',
      requiredClass: 'warrior',
      requiredLevel: 15,
      tree: 'left',
      tier: 3,
      requirements: ['warrior_iron_skin'],
      effects: [
        { type: 'passive_ability', value: { lastStand: true } },
      ],
      icon: '💪',
    },

    // Middle Tree - Balanced
    {
      id: 'warrior_veteran',
      name: 'Veteran Training',
      description: '+2 Strength, +2 Constitution',
      requiredClass: 'warrior',
      requiredLevel: 5,
      tree: 'middle',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { strength: 2, constitution: 2 } },
      ],
      icon: '⚔️',
    },
    {
      id: 'warrior_combat_mastery',
      name: 'Combat Mastery',
      description: '+15% damage with all attacks',
      requiredClass: 'warrior',
      requiredLevel: 10,
      tree: 'middle',
      tier: 2,
      requirements: ['warrior_veteran'],
      effects: [
        { type: 'damage_modifier', value: 1.15 },
      ],
      icon: '⚡',
    },
    {
      id: 'warrior_warlord',
      name: 'Warlord',
      description: '+3 to all combat stats, unlock Whirlwind Attack',
      requiredClass: 'warrior',
      requiredLevel: 15,
      tree: 'middle',
      tier: 3,
      requirements: ['warrior_combat_mastery'],
      effects: [
        { type: 'stat_boost', value: { strength: 3, constitution: 3, dexterity: 3 } },
        { type: 'unlock_spell', value: 'whirlwind' },
      ],
      icon: '👑',
    },

    // Right Tree - DPS/Offense
    {
      id: 'warrior_berserker',
      name: 'Berserker Rage',
      description: '+4 Strength, +20% critical chance',
      requiredClass: 'warrior',
      requiredLevel: 5,
      tree: 'right',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { strength: 4 } },
        { type: 'passive_ability', value: { critChance: 0.2 } },
      ],
      icon: '🔥',
    },
    {
      id: 'warrior_brutal_strikes',
      name: 'Brutal Strikes',
      description: 'Critical hits deal +100% damage',
      requiredClass: 'warrior',
      requiredLevel: 10,
      tree: 'right',
      tier: 2,
      requirements: ['warrior_berserker'],
      effects: [
        { type: 'passive_ability', value: { critDamage: 2.0 } },
      ],
      icon: '💥',
    },
    {
      id: 'warrior_titan',
      name: 'Titan',
      description: '+5 Strength, attacks hit all enemies',
      requiredClass: 'warrior',
      requiredLevel: 15,
      tree: 'right',
      tier: 3,
      requirements: ['warrior_brutal_strikes'],
      effects: [
        { type: 'stat_boost', value: { strength: 5 } },
        { type: 'passive_ability', value: { cleave: true } },
      ],
      icon: '⚡',
    },
  ],

  mage: [
    // Left Tree - Fire Magic
    {
      id: 'mage_fire_affinity',
      name: 'Fire Affinity',
      description: '+3 Intelligence, fire spells cost 25% less mana',
      requiredClass: 'mage',
      requiredLevel: 5,
      tree: 'left',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { intelligence: 3 } },
        { type: 'passive_ability', value: { fireManaCost: 0.75 } },
      ],
      icon: '🔥',
    },
    {
      id: 'mage_inferno',
      name: 'Inferno Master',
      description: 'Fire spells deal +50% damage and apply burn',
      requiredClass: 'mage',
      requiredLevel: 10,
      tree: 'left',
      tier: 2,
      requirements: ['mage_fire_affinity'],
      effects: [
        { type: 'damage_modifier', value: 1.5 },
      ],
      icon: '💥',
    },
    {
      id: 'mage_meteor',
      name: 'Meteor Storm',
      description: 'Unlock Meteor Storm spell (massive AOE damage)',
      requiredClass: 'mage',
      requiredLevel: 15,
      tree: 'left',
      tier: 3,
      requirements: ['mage_inferno'],
      effects: [
        { type: 'unlock_spell', value: 'meteor_storm' },
      ],
      icon: '☄️',
    },

    // Middle Tree - Arcane Magic
    {
      id: 'mage_arcane_focus',
      name: 'Arcane Focus',
      description: '+2 Intelligence, +2 Wisdom',
      requiredClass: 'mage',
      requiredLevel: 5,
      tree: 'middle',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { intelligence: 2, wisdom: 2 } },
      ],
      icon: '✨',
    },
    {
      id: 'mage_mana_well',
      name: 'Mana Well',
      description: '+50% max mana, regenerate 5 mana per turn',
      requiredClass: 'mage',
      requiredLevel: 10,
      tree: 'middle',
      tier: 2,
      requirements: ['mage_arcane_focus'],
      effects: [
        { type: 'passive_ability', value: { manaBonus: 0.5, manaRegen: 5 } },
      ],
      icon: '🔮',
    },
    {
      id: 'mage_archmage',
      name: 'Archmage',
      description: '+5 Intelligence, all spells deal +25% damage',
      requiredClass: 'mage',
      requiredLevel: 15,
      tree: 'middle',
      tier: 3,
      requirements: ['mage_mana_well'],
      effects: [
        { type: 'stat_boost', value: { intelligence: 5 } },
        { type: 'damage_modifier', value: 1.25 },
      ],
      icon: '🎭',
    },

    // Right Tree - Ice/Frost Magic
    {
      id: 'mage_frost_affinity',
      name: 'Frost Affinity',
      description: '+3 Intelligence, ice spells freeze enemies',
      requiredClass: 'mage',
      requiredLevel: 5,
      tree: 'right',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { intelligence: 3 } },
      ],
      icon: '❄️',
    },
    {
      id: 'mage_ice_barrier',
      name: 'Ice Barrier',
      description: 'Gain shield equal to 20% max health when casting ice spells',
      requiredClass: 'mage',
      requiredLevel: 10,
      tree: 'right',
      tier: 2,
      requirements: ['mage_frost_affinity'],
      effects: [
        { type: 'passive_ability', value: { iceShield: 0.2 } },
      ],
      icon: '🧊',
    },
    {
      id: 'mage_blizzard',
      name: 'Blizzard',
      description: 'Unlock Blizzard spell (freezes all enemies)',
      requiredClass: 'mage',
      requiredLevel: 15,
      tree: 'right',
      tier: 3,
      requirements: ['mage_ice_barrier'],
      effects: [
        { type: 'unlock_spell', value: 'blizzard' },
      ],
      icon: '🌨️',
    },
  ],

  rogue: [
    // Left Tree - Stealth/Evasion
    {
      id: 'rogue_shadow',
      name: 'Shadow Step',
      description: '+3 Dexterity, +15% evasion',
      requiredClass: 'rogue',
      requiredLevel: 5,
      tree: 'left',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { dexterity: 3 } },
        { type: 'passive_ability', value: { evasion: 0.15 } },
      ],
      icon: '👤',
    },
    {
      id: 'rogue_vanish',
      name: 'Vanish',
      description: 'Unlock Vanish ability (become untargetable for 1 turn)',
      requiredClass: 'rogue',
      requiredLevel: 10,
      tree: 'left',
      tier: 2,
      requirements: ['rogue_shadow'],
      effects: [
        { type: 'unlock_spell', value: 'vanish' },
      ],
      icon: '💨',
    },
    {
      id: 'rogue_shadow_master',
      name: 'Shadow Master',
      description: '+30% evasion, attacks from stealth deal double damage',
      requiredClass: 'rogue',
      requiredLevel: 15,
      tree: 'left',
      tier: 3,
      requirements: ['rogue_vanish'],
      effects: [
        { type: 'passive_ability', value: { evasion: 0.3, stealthDamage: 2.0 } },
      ],
      icon: '🌑',
    },

    // Middle Tree - Balanced
    {
      id: 'rogue_agility',
      name: 'Superior Agility',
      description: '+2 Dexterity, +2 Strength',
      requiredClass: 'rogue',
      requiredLevel: 5,
      tree: 'middle',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { dexterity: 2, strength: 2 } },
      ],
      icon: '🏃',
    },
    {
      id: 'rogue_dual_wield',
      name: 'Dual Wielding',
      description: 'Attack twice per turn with reduced damage',
      requiredClass: 'rogue',
      requiredLevel: 10,
      tree: 'middle',
      tier: 2,
      requirements: ['rogue_agility'],
      effects: [
        { type: 'passive_ability', value: { dualWield: true } },
      ],
      icon: '⚔️',
    },
    {
      id: 'rogue_assassin',
      name: 'Master Assassin',
      description: '+5 Dexterity, critical hits are lethal',
      requiredClass: 'rogue',
      requiredLevel: 15,
      tree: 'middle',
      tier: 3,
      requirements: ['rogue_dual_wield'],
      effects: [
        { type: 'stat_boost', value: { dexterity: 5 } },
        { type: 'passive_ability', value: { critDamage: 3.0 } },
      ],
      icon: '🗡️',
    },

    // Right Tree - Poison/DOT
    {
      id: 'rogue_poison',
      name: 'Poison Master',
      description: '+3 Dexterity, attacks apply poison',
      requiredClass: 'rogue',
      requiredLevel: 5,
      tree: 'right',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { dexterity: 3 } },
        { type: 'passive_ability', value: { poisonAttacks: true } },
      ],
      icon: '☠️',
    },
    {
      id: 'rogue_deadly_toxin',
      name: 'Deadly Toxin',
      description: 'Poison deals double damage',
      requiredClass: 'rogue',
      requiredLevel: 10,
      tree: 'right',
      tier: 2,
      requirements: ['rogue_poison'],
      effects: [
        { type: 'damage_modifier', value: 2.0 },
      ],
      icon: '🧪',
    },
    {
      id: 'rogue_plague',
      name: 'Plague Bearer',
      description: 'Poison spreads to all enemies',
      requiredClass: 'rogue',
      requiredLevel: 15,
      tree: 'right',
      tier: 3,
      requirements: ['rogue_deadly_toxin'],
      effects: [
        { type: 'passive_ability', value: { plagueSpread: true } },
      ],
      icon: '🦠',
    },
  ],

  cleric: [
    // Left Tree - Healing
    {
      id: 'cleric_divine_touch',
      name: 'Divine Touch',
      description: '+3 Wisdom, healing spells +50% effectiveness',
      requiredClass: 'cleric',
      requiredLevel: 5,
      tree: 'left',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { wisdom: 3 } },
        { type: 'passive_ability', value: { healingBonus: 0.5 } },
      ],
      icon: '💚',
    },
    {
      id: 'cleric_holy_aura',
      name: 'Holy Aura',
      description: 'Regenerate 5% health per turn',
      requiredClass: 'cleric',
      requiredLevel: 10,
      tree: 'left',
      tier: 2,
      requirements: ['cleric_divine_touch'],
      effects: [
        { type: 'passive_ability', value: { healthRegen: 0.05 } },
      ],
      icon: '✨',
    },
    {
      id: 'cleric_resurrection',
      name: 'Resurrection',
      description: 'Automatically revive once per combat at 50% health',
      requiredClass: 'cleric',
      requiredLevel: 15,
      tree: 'left',
      tier: 3,
      requirements: ['cleric_holy_aura'],
      effects: [
        { type: 'passive_ability', value: { resurrection: true } },
      ],
      icon: '⚕️',
    },

    // Middle Tree - Balanced
    {
      id: 'cleric_devotion',
      name: 'Devotion',
      description: '+2 Wisdom, +2 Constitution',
      requiredClass: 'cleric',
      requiredLevel: 5,
      tree: 'middle',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { wisdom: 2, constitution: 2 } },
      ],
      icon: '🙏',
    },
    {
      id: 'cleric_blessed_weapon',
      name: 'Blessed Weapon',
      description: 'Attacks deal holy damage (+25% vs undead)',
      requiredClass: 'cleric',
      requiredLevel: 10,
      tree: 'middle',
      tier: 2,
      requirements: ['cleric_devotion'],
      effects: [
        { type: 'passive_ability', value: { holyDamage: true } },
      ],
      icon: '🔆',
    },
    {
      id: 'cleric_champion',
      name: 'Divine Champion',
      description: '+4 all stats, balanced offense and defense',
      requiredClass: 'cleric',
      requiredLevel: 15,
      tree: 'middle',
      tier: 3,
      requirements: ['cleric_blessed_weapon'],
      effects: [
        {
          type: 'stat_boost',
          value: {
            strength: 2,
            constitution: 2,
            wisdom: 2,
            charisma: 2,
          },
        },
      ],
      icon: '👼',
    },

    // Right Tree - Offensive/Smite
    {
      id: 'cleric_righteous_fury',
      name: 'Righteous Fury',
      description: '+3 Strength, +20% damage with smite spells',
      requiredClass: 'cleric',
      requiredLevel: 5,
      tree: 'right',
      tier: 1,
      effects: [
        { type: 'stat_boost', value: { strength: 3 } },
        { type: 'damage_modifier', value: 1.2 },
      ],
      icon: '⚡',
    },
    {
      id: 'cleric_holy_fire',
      name: 'Holy Fire',
      description: 'Smite spells burn enemies with holy fire',
      requiredClass: 'cleric',
      requiredLevel: 10,
      tree: 'right',
      tier: 2,
      requirements: ['cleric_righteous_fury'],
      effects: [
        { type: 'passive_ability', value: { holyBurn: true } },
      ],
      icon: '🔥',
    },
    {
      id: 'cleric_wrath',
      name: 'Divine Wrath',
      description: 'Unlock Divine Wrath (massive holy damage)',
      requiredClass: 'cleric',
      requiredLevel: 15,
      tree: 'right',
      tier: 3,
      requirements: ['cleric_holy_fire'],
      effects: [
        { type: 'unlock_spell', value: 'divine_wrath' },
      ],
      icon: '💫',
    },
  ],
};

export function getTalentsByClass(characterClass: CharacterClass): Talent[] {
  return TALENTS[characterClass] || [];
}

export function getTalentById(talentId: string): Talent | undefined {
  for (const talents of Object.values(TALENTS)) {
    const talent = talents.find((t) => t.id === talentId);
    if (talent) return talent;
  }
  return undefined;
}

export function getAvailableTalents(
  characterClass: CharacterClass,
  level: number,
  chosenTalents: string[]
): Talent[] {
  return getTalentsByClass(characterClass).filter((talent) => {
    if (talent.requiredLevel > level) return false;
    if (chosenTalents.includes(talent.id)) return false;
    if (!talent.requirements) return true;
    return talent.requirements.every((req) => chosenTalents.includes(req));
  });
}
