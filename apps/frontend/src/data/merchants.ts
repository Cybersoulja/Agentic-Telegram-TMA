import type { Merchant } from '../types/game';
import { CONSUMABLE_ITEMS, TREASURE_ITEMS } from './items';

export const MERCHANTS: Record<string, Merchant> = {
  gareth: {
    id: 'gareth',
    name: 'Gareth the Trader',
    greeting: "Welcome, friend! I've got the finest wares in all of Millbrook!",
    inventory: [
      {
        item: { ...CONSUMABLE_ITEMS[0] }, // Health Potion
        stock: 10,
        priceModifier: 1.2,
      },
      {
        item: { ...CONSUMABLE_ITEMS[1] }, // Mana Potion
        stock: 10,
        priceModifier: 1.3,
      },
      {
        item: { ...CONSUMABLE_ITEMS[2] }, // Bread
        stock: 20,
        priceModifier: 1.0,
      },
      {
        item: {
          id: 'steel_sword_shop',
          name: 'Steel Sword',
          description: 'A well-crafted steel blade.',
          type: 'weapon',
          value: 150,
          rarity: 'uncommon',
          damage: 12,
          stats: { strength: 2 },
        },
        stock: 2,
        priceModifier: 1.5,
      },
      {
        item: {
          id: 'iron_armor',
          name: 'Iron Armor',
          description: 'Solid iron protection.',
          type: 'armor',
          value: 120,
          rarity: 'uncommon',
          armor: 7,
          stats: { constitution: 2 },
        },
        stock: 2,
        priceModifier: 1.5,
      },
      {
        item: {
          id: 'amulet_of_protection',
          name: 'Amulet of Protection',
          description: 'A protective charm.',
          type: 'misc',
          value: 200,
          rarity: 'rare',
          stats: { constitution: 2, wisdom: 1 },
        },
        stock: 1,
        priceModifier: 2.0,
      },
    ],
    buyPriceModifier: 1.5,
    sellPriceModifier: 0.5,
    refreshInterval: 3600000, // 1 hour in milliseconds
  },

  traveling_merchant: {
    id: 'traveling_merchant',
    name: 'Mysterious Merchant',
    greeting: 'Rare treasures for the discerning adventurer...',
    inventory: [
      {
        item: { ...TREASURE_ITEMS[0] }, // Ancient Coin
        stock: 5,
        priceModifier: 1.0,
      },
      {
        item: { ...TREASURE_ITEMS[2] }, // Magic Crystal
        stock: 3,
        priceModifier: 1.2,
      },
      {
        item: {
          id: 'enchanted_ring',
          name: 'Enchanted Ring',
          description: 'A ring pulsing with magical energy.',
          type: 'misc',
          value: 400,
          rarity: 'epic',
          stats: { intelligence: 3, wisdom: 2 },
        },
        stock: 1,
        priceModifier: 2.5,
      },
      {
        item: {
          id: 'elven_bow',
          name: 'Elven Bow',
          description: 'A masterwork bow from the elven forests.',
          type: 'weapon',
          value: 500,
          rarity: 'rare',
          damage: 18,
          stats: { dexterity: 4 },
        },
        stock: 1,
        priceModifier: 3.0,
      },
      {
        item: {
          id: 'greater_health_potion',
          name: 'Greater Health Potion',
          description: 'Restores 50 health points.',
          type: 'consumable',
          value: 50,
          rarity: 'uncommon',
          healing: 50,
          stackable: true,
          quantity: 1,
        },
        stock: 5,
        priceModifier: 1.5,
      },
      {
        item: {
          id: 'scroll_of_teleport',
          name: 'Scroll of Teleport',
          description: 'Instantly escape from combat.',
          type: 'consumable',
          value: 100,
          rarity: 'rare',
          stackable: true,
          quantity: 1,
        },
        stock: 2,
        priceModifier: 2.0,
      },
    ],
    buyPriceModifier: 2.0,
    sellPriceModifier: 0.7,
    refreshInterval: 7200000, // 2 hours
  },

  blacksmith: {
    id: 'blacksmith',
    name: 'Borin the Blacksmith',
    greeting: 'Looking for quality steel? You\'ve come to the right place!',
    inventory: [
      {
        item: {
          id: 'iron_sword',
          name: 'Iron Sword',
          description: 'A standard iron blade.',
          type: 'weapon',
          value: 75,
          rarity: 'common',
          damage: 10,
          stats: { strength: 1 },
        },
        stock: 5,
        priceModifier: 1.3,
      },
      {
        item: {
          id: 'battle_axe',
          name: 'Battle Axe',
          description: 'A heavy axe for crushing blows.',
          type: 'weapon',
          value: 180,
          rarity: 'uncommon',
          damage: 15,
          stats: { strength: 3 },
        },
        stock: 2,
        priceModifier: 1.4,
      },
      {
        item: {
          id: 'plate_armor',
          name: 'Plate Armor',
          description: 'Heavy plates of protective steel.',
          type: 'armor',
          value: 250,
          rarity: 'uncommon',
          armor: 10,
          stats: { constitution: 3 },
        },
        stock: 2,
        priceModifier: 1.5,
      },
      {
        item: {
          id: 'shield',
          name: 'Iron Shield',
          description: 'A sturdy shield for defense.',
          type: 'armor',
          value: 100,
          rarity: 'common',
          armor: 5,
          stats: { constitution: 2 },
        },
        stock: 3,
        priceModifier: 1.3,
      },
    ],
    buyPriceModifier: 1.4,
    sellPriceModifier: 0.6,
  },

  apothecary: {
    id: 'apothecary',
    name: 'Elara the Apothecary',
    greeting: 'Need something for your ailments? I have just the remedy!',
    inventory: [
      {
        item: { ...CONSUMABLE_ITEMS[0] }, // Health Potion
        stock: 15,
        priceModifier: 1.0,
      },
      {
        item: { ...CONSUMABLE_ITEMS[1] }, // Mana Potion
        stock: 15,
        priceModifier: 1.0,
      },
      {
        item: {
          id: 'antidote',
          name: 'Antidote',
          description: 'Cures poison and other ailments.',
          type: 'consumable',
          value: 30,
          rarity: 'common',
          stackable: true,
          quantity: 1,
        },
        stock: 10,
        priceModifier: 1.2,
      },
      {
        item: {
          id: 'elixir_of_strength',
          name: 'Elixir of Strength',
          description: 'Temporarily increases strength.',
          type: 'consumable',
          value: 100,
          rarity: 'rare',
          stackable: true,
          quantity: 1,
          stats: { strength: 5 },
        },
        stock: 3,
        priceModifier: 1.8,
      },
      {
        item: {
          id: 'elixir_of_wisdom',
          name: 'Elixir of Wisdom',
          description: 'Temporarily increases wisdom.',
          type: 'consumable',
          value: 100,
          rarity: 'rare',
          stackable: true,
          quantity: 1,
          stats: { wisdom: 5 },
        },
        stock: 3,
        priceModifier: 1.8,
      },
    ],
    buyPriceModifier: 1.3,
    sellPriceModifier: 0.6,
  },
};

export function getMerchantById(merchantId: string): Merchant | undefined {
  return MERCHANTS[merchantId];
}

export function calculateBuyPrice(basePrice: number, merchant: Merchant, charisma: number = 10): number {
  const charismaDiscount = Math.max(0, (charisma - 10) * 0.02);
  const finalModifier = merchant.buyPriceModifier * (1 - charismaDiscount);
  return Math.floor(basePrice * finalModifier);
}

export function calculateSellPrice(basePrice: number, merchant: Merchant, charisma: number = 10): number {
  const charismaBonus = Math.max(0, (charisma - 10) * 0.02);
  const finalModifier = merchant.sellPriceModifier * (1 + charismaBonus);
  return Math.floor(basePrice * finalModifier);
}
