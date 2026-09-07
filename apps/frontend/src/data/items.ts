/**
 * This file contains the item data for the game, including starting items, consumables, and treasures.
 */
import type { Item } from '../types/game';

export const STARTING_ITEMS: Record<string, Item[]> = {
  warrior: [
    {
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A well-crafted iron blade, sharp and reliable.',
      type: 'weapon',
      value: 50,
      rarity: 'common',
      damage: 8,
      stats: { strength: 1 }
    },
    {
      id: 'leather_armor',
      name: 'Leather Armor',
      description: 'Basic protection made from tough leather.',
      type: 'armor',
      value: 30,
      rarity: 'common',
      armor: 3,
      stats: { constitution: 1 }
    }
  ],
  mage: [
    {
      id: 'wooden_staff',
      name: 'Wooden Staff',
      description: 'A simple staff that channels magical energy.',
      type: 'weapon',
      value: 40,
      rarity: 'common',
      damage: 4,
      stats: { intelligence: 2 }
    },
    {
      id: 'cloth_robes',
      name: 'Cloth Robes',
      description: 'Comfortable robes that aid spellcasting.',
      type: 'armor',
      value: 25,
      rarity: 'common',
      armor: 1,
      stats: { wisdom: 1, intelligence: 1 }
    }
  ],
  rogue: [
    {
      id: 'steel_dagger',
      name: 'Steel Dagger',
      description: 'A sharp, lightweight blade perfect for quick strikes.',
      type: 'weapon',
      value: 35,
      rarity: 'common',
      damage: 6,
      stats: { dexterity: 2 }
    },
    {
      id: 'studded_leather',
      name: 'Studded Leather Armor',
      description: 'Leather armor reinforced with metal studs.',
      type: 'armor',
      value: 40,
      rarity: 'common',
      armor: 4,
      stats: { dexterity: 1 }
    }
  ],
  cleric: [
    {
      id: 'holy_mace',
      name: 'Holy Mace',
      description: 'A blessed weapon that channels divine power.',
      type: 'weapon',
      value: 45,
      rarity: 'common',
      damage: 7,
      stats: { wisdom: 1, charisma: 1 }
    },
    {
      id: 'chain_mail',
      name: 'Chain Mail',
      description: 'Interlocked metal rings provide solid protection.',
      type: 'armor',
      value: 50,
      rarity: 'common',
      armor: 5,
      stats: { constitution: 1 }
    }
  ]
};

export const CONSUMABLE_ITEMS: Item[] = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 25 health points when consumed.',
    type: 'consumable',
    value: 15,
    rarity: 'common',
    healing: 25,
    stackable: true,
    quantity: 1
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 20 mana points when consumed.',
    type: 'consumable',
    value: 20,
    rarity: 'common',
    stackable: true,
    quantity: 1
  },
  {
    id: 'bread',
    name: 'Bread',
    description: 'Simple sustenance that restores 5 health.',
    type: 'consumable',
    value: 2,
    rarity: 'common',
    healing: 5,
    stackable: true,
    quantity: 1
  }
];

export const TREASURE_ITEMS: Item[] = [
  {
    id: 'ancient_coin',
    name: 'Ancient Coin',
    description: 'A mysterious coin from a lost civilization.',
    type: 'misc',
    value: 100,
    rarity: 'rare'
  },
  {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    description: 'A shimmering scale from a mighty dragon.',
    type: 'misc',
    value: 500,
    rarity: 'epic'
  },
  {
    id: 'magic_crystal',
    name: 'Magic Crystal',
    description: 'A crystal pulsing with arcane energy.',
    type: 'misc',
    value: 200,
    rarity: 'uncommon'
  }
];
