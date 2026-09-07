/**
 * Zustand store for managing the player's inventory.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Item, CharacterClass, Recipe } from '../../types/game';
import { GameEngine } from '../gameEngine';
import { canCraftRecipe } from '../../data/recipes';

interface InventoryState {
  items: Item[];
  gameEngine: GameEngine;

  // Actions
  initializeInventory: (characterClass: CharacterClass) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  getItemById: (itemId: string) => Item | undefined;
  getItemsByType: (type: Item['type']) => Item[];
  getTotalValue: () => number;
  hasItem: (itemId: string, quantity?: number) => boolean;
  clearInventory: () => void;

  // Equipment integration
  canEquipItem: (item: Item) => boolean;

  // Crafting
  craftItem: (recipe: Recipe) => { success: boolean; message: string };
  canCraft: (recipe: Recipe) => boolean;

  // Selling
  sellItem: (itemId: string, quantity: number, pricePerUnit: number) => {
    success: boolean;
    goldEarned: number;
  };

  // Consuming
  consumeItem: (itemId: string) => { success: boolean; message: string };
}

export const useInventory = create<InventoryState>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    gameEngine: new GameEngine(),

    initializeInventory: (characterClass: CharacterClass) => {
      const { gameEngine } = get();
      const startingItems = gameEngine.getStartingItems(characterClass);
      set({ items: startingItems });
      console.log('Inventory initialized with starting items:', startingItems);
    },

    addItem: (item: Item) => {
      const { items } = get();

      // Check if item is stackable and already exists
      if (item.stackable) {
        const existingItemIndex = items.findIndex((i) => i.id === item.id);
        if (existingItemIndex !== -1) {
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: (existingItem.quantity || 1) + (item.quantity || 1),
          };
          set({ items: updatedItems });
          return;
        }
      }

      // Add new item or non-stackable item
      const newItem = { ...item, quantity: item.quantity || 1 };
      set({ items: [...items, newItem] });
      console.log('Item added to inventory:', newItem);
    },

    removeItem: (itemId: string, quantity: number = 1) => {
      const { items } = get();
      const itemIndex = items.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) return;

      const updatedItems = [...items];
      const item = updatedItems[itemIndex];

      if (item.stackable && (item.quantity || 1) > quantity) {
        // Reduce quantity
        updatedItems[itemIndex] = {
          ...item,
          quantity: (item.quantity || 1) - quantity,
        };
      } else {
        // Remove item entirely
        updatedItems.splice(itemIndex, 1);
      }

      set({ items: updatedItems });
      console.log(`Removed ${quantity} of ${item.name} from inventory`);
    },

    getItemById: (itemId: string) => {
      const { items } = get();
      return items.find((item) => item.id === itemId);
    },

    getItemsByType: (type: Item['type']) => {
      const { items } = get();
      return items.filter((item) => item.type === type);
    },

    getTotalValue: () => {
      const { items } = get();
      return items.reduce((total, item) => {
        return total + item.value * (item.quantity || 1);
      }, 0);
    },

    hasItem: (itemId: string, quantity: number = 1) => {
      const { items } = get();
      const item = items.find((i) => i.id === itemId);
      return item ? (item.quantity || 1) >= quantity : false;
    },

    clearInventory: () => {
      set({ items: [] });
      console.log('Inventory cleared');
    },

    // Equipment integration
    canEquipItem: (item: Item) => {
      return item.type === 'weapon' || item.type === 'armor' || item.type === 'misc';
    },

    // Crafting
    craftItem: (recipe: Recipe) => {
      const { items, removeItem, addItem } = get();

      // Check if we have the required items
      if (!canCraftRecipe(recipe, items)) {
        return { success: false, message: 'Missing required materials!' };
      }

      // Remove required items
      recipe.requiredItems.forEach((req) => {
        removeItem(req.itemId, req.quantity);
      });

      // Add crafted item
      addItem(recipe.output);

      console.log(`Crafted: ${recipe.output.name}`);
      return { success: true, message: `Successfully crafted ${recipe.output.name}!` };
    },

    canCraft: (recipe: Recipe) => {
      const { items } = get();
      return canCraftRecipe(recipe, items);
    },

    // Consuming
    consumeItem: (itemId: string) => {
      const { items, removeItem } = get();
      const item = items.find((i) => i.id === itemId);

      if (!item) {
        return { success: false, message: 'Item not found' };
      }

      if (item.type !== 'consumable') {
        return { success: false, message: 'Item is not consumable' };
      }

      removeItem(itemId, 1);
      return { success: true, message: `Used ${item.name}` };
    },

    // Selling
    sellItem: (itemId: string, quantity: number, pricePerUnit: number) => {
      const { items, removeItem } = get();
      const item = items.find((i) => i.id === itemId);

      if (!item) {
        return { success: false, goldEarned: 0 };
      }

      const availableQuantity = item.quantity || 1;
      const sellQuantity = Math.min(quantity, availableQuantity);
      const goldEarned = sellQuantity * pricePerUnit;

      removeItem(itemId, sellQuantity);

      console.log(`Sold ${sellQuantity}x ${item.name} for ${goldEarned} gold`);
      return { success: true, goldEarned };
    },
  }))
);
