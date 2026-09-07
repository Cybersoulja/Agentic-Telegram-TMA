import type { Recipe, Item } from '../types/game';

export const RECIPES: Recipe[] = [
  // Weapon Recipes
  {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'A sturdy sword forged from steel.',
    requiredItems: [
      { itemId: 'iron_sword', quantity: 1 },
      { itemId: 'magic_crystal', quantity: 1 },
    ],
    output: {
      id: 'steel_sword',
      name: 'Steel Sword',
      description: 'A superior blade forged from refined steel.',
      type: 'weapon',
      value: 150,
      rarity: 'uncommon',
      damage: 12,
      stats: { strength: 2 },
    },
    requiredLevel: 5,
    requiredClass: ['warrior'],
    category: 'weapon',
  },
  {
    id: 'enchanted_staff',
    name: 'Enchanted Staff',
    description: 'A staff imbued with magical power.',
    requiredItems: [
      { itemId: 'wooden_staff', quantity: 1 },
      { itemId: 'magic_crystal', quantity: 2 },
    ],
    output: {
      id: 'enchanted_staff',
      name: 'Enchanted Staff',
      description: 'A staff crackling with arcane energy.',
      type: 'weapon',
      value: 200,
      rarity: 'rare',
      damage: 8,
      stats: { intelligence: 4, wisdom: 2 },
    },
    requiredLevel: 6,
    requiredClass: ['mage'],
    category: 'weapon',
  },
  {
    id: 'poison_dagger',
    name: 'Poison Dagger',
    description: 'A deadly dagger coated in poison.',
    requiredItems: [
      { itemId: 'steel_dagger', quantity: 1 },
      { itemId: 'ancient_coin', quantity: 2 },
    ],
    output: {
      id: 'poison_dagger',
      name: 'Poison Dagger',
      description: 'A blade that delivers deadly poison with each strike.',
      type: 'weapon',
      value: 180,
      rarity: 'uncommon',
      damage: 10,
      stats: { dexterity: 3 },
    },
    requiredLevel: 5,
    requiredClass: ['rogue'],
    category: 'weapon',
  },

  // Armor Recipes
  {
    id: 'reinforced_leather',
    name: 'Reinforced Leather Armor',
    description: 'Leather armor strengthened with metal plates.',
    requiredItems: [
      { itemId: 'leather_armor', quantity: 1 },
      { itemId: 'ancient_coin', quantity: 3 },
    ],
    output: {
      id: 'reinforced_leather',
      name: 'Reinforced Leather Armor',
      description: 'Leather armor reinforced for better protection.',
      type: 'armor',
      value: 120,
      rarity: 'uncommon',
      armor: 6,
      stats: { constitution: 2, dexterity: 1 },
    },
    requiredLevel: 4,
    category: 'armor',
  },
  {
    id: 'dragon_scale_armor',
    name: 'Dragon Scale Armor',
    description: 'Legendary armor crafted from dragon scales.',
    requiredItems: [
      { itemId: 'chain_mail', quantity: 1 },
      { itemId: 'dragon_scale', quantity: 3 },
      { itemId: 'magic_crystal', quantity: 2 },
    ],
    output: {
      id: 'dragon_scale_armor',
      name: 'Dragon Scale Armor',
      description: 'Impenetrable armor forged from dragon scales.',
      type: 'armor',
      value: 800,
      rarity: 'legendary',
      armor: 15,
      stats: { constitution: 5, strength: 3 },
    },
    requiredLevel: 15,
    category: 'armor',
  },

  // Consumable Recipes
  {
    id: 'greater_health_potion',
    name: 'Greater Health Potion',
    description: 'A powerful healing potion.',
    requiredItems: [
      { itemId: 'health_potion', quantity: 2 },
      { itemId: 'magic_crystal', quantity: 1 },
    ],
    output: {
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
    requiredLevel: 3,
    category: 'consumable',
  },
  {
    id: 'greater_mana_potion',
    name: 'Greater Mana Potion',
    description: 'A powerful mana potion.',
    requiredItems: [
      { itemId: 'mana_potion', quantity: 2 },
      { itemId: 'magic_crystal', quantity: 1 },
    ],
    output: {
      id: 'greater_mana_potion',
      name: 'Greater Mana Potion',
      description: 'Restores 40 mana points.',
      type: 'consumable',
      value: 60,
      rarity: 'uncommon',
      stackable: true,
      quantity: 1,
    },
    requiredLevel: 3,
    category: 'consumable',
  },
  {
    id: 'elixir_of_strength',
    name: 'Elixir of Strength',
    description: 'Temporarily boosts strength.',
    requiredItems: [
      { itemId: 'health_potion', quantity: 1 },
      { itemId: 'ancient_coin', quantity: 2 },
    ],
    output: {
      id: 'elixir_of_strength',
      name: 'Elixir of Strength',
      description: 'Increases strength by 5 for 10 turns.',
      type: 'consumable',
      value: 100,
      rarity: 'rare',
      stackable: true,
      quantity: 1,
      stats: { strength: 5 },
    },
    requiredLevel: 7,
    category: 'consumable',
  },

  // Accessory Recipes
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'A charm that brings good fortune.',
    requiredItems: [
      { itemId: 'ancient_coin', quantity: 5 },
      { itemId: 'magic_crystal', quantity: 1 },
    ],
    output: {
      id: 'lucky_charm',
      name: 'Lucky Charm',
      description: 'Increases all stats slightly.',
      type: 'misc',
      value: 250,
      rarity: 'rare',
      stats: {
        strength: 1,
        dexterity: 1,
        intelligence: 1,
        constitution: 1,
        wisdom: 1,
        charisma: 1,
      },
    },
    requiredLevel: 10,
    category: 'misc',
  },
  {
    id: 'ring_of_power',
    name: 'Ring of Power',
    description: 'A ring pulsing with magical energy.',
    requiredItems: [
      { itemId: 'magic_crystal', quantity: 5 },
      { itemId: 'dragon_scale', quantity: 1 },
    ],
    output: {
      id: 'ring_of_power',
      name: 'Ring of Power',
      description: 'Greatly enhances magical abilities.',
      type: 'misc',
      value: 600,
      rarity: 'epic',
      stats: { intelligence: 5, wisdom: 3 },
    },
    requiredLevel: 12,
    category: 'misc',
  },
];

export function getRecipeById(recipeId: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === recipeId);
}

export function getAvailableRecipes(
  characterClass: string,
  level: number
): Recipe[] {
  return RECIPES.filter((recipe) => {
    const levelOk = !recipe.requiredLevel || recipe.requiredLevel <= level;
    const classOk =
      !recipe.requiredClass || recipe.requiredClass.includes(characterClass as any);
    return levelOk && classOk;
  });
}

export function canCraftRecipe(recipe: Recipe, inventory: Item[]): boolean {
  return recipe.requiredItems.every((req) => {
    const item = inventory.find((i) => i.id === req.itemId);
    return item && (item.quantity || 1) >= req.quantity;
  });
}
