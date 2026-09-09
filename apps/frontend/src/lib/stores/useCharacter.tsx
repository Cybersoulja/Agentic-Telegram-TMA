/**
 * Zustand store for managing the player character.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Character, CharacterClass, Item, StatusEffect, Spell } from '../../types/game';
import { GameEngine } from '../gameEngine';

interface CharacterState {
  character: Character | null;
  gameEngine: GameEngine;

  // Actions
  createCharacter: (name: string, characterClass: CharacterClass) => void;
  updateCharacter: (character: Character) => void;
  gainExperience: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  spendMana: (amount: number) => boolean;
  restoreMana: (amount: number) => void;
  modifyGold: (amount: number) => void;
  resetCharacter: () => void;

  // Equipment methods
  equipItem: (item: Item, slot: keyof Character['equippedItems']) => boolean;
  unequipItem: (slot: keyof Character['equippedItems']) => Item | null;
  getEquippedItem: (slot: keyof Character['equippedItems']) => Item | null;
  getTotalStats: () => Character['stats'] | null;
  getTotalArmor: () => number;

  // Status effect methods
  addStatusEffect: (effect: StatusEffect) => void;
  removeStatusEffect: (effectId: string) => void;
  applyStatusEffects: () => void;

  // Spell methods
  learnSpell: (spellId: string) => void;
  hasSpell: (spellId: string) => boolean;
  castSpell: (spell: Spell) => { success: boolean; message: string };

  // Talent methods
  chooseTalent: (talentId: string) => void;
  spendStatPoint: (stat: keyof Character['stats']) => boolean;

  // Playtime tracking
  updatePlaytime: (seconds: number) => void;
}

export const useCharacter = create<CharacterState>()(
  subscribeWithSelector((set, get) => ({
    character: null,
    gameEngine: new GameEngine(),

    createCharacter: (name: string, characterClass: CharacterClass) => {
      const { gameEngine } = get();
      const newCharacter = gameEngine.createCharacter(name, characterClass);
      set({ character: newCharacter });
      console.log('Character created:', newCharacter);
    },

    updateCharacter: (character: Character) => {
      set({ character });
    },

    gainExperience: (amount: number) => {
      const { character, gameEngine } = get();
      if (!character) return;

      const updatedCharacter = gameEngine.gainExperience(character, amount);
      set({ character: updatedCharacter });

      if (updatedCharacter.level > character.level) {
        console.log(`Level up! Now level ${updatedCharacter.level}`);
      }
    },

    takeDamage: (amount: number) => {
      const { character } = get();
      if (!character) return;

      const newHealth = Math.max(0, character.health - amount);
      const updatedCharacter = { ...character, health: newHealth };
      set({ character: updatedCharacter });

      if (newHealth === 0) {
        console.log('Character has fallen!');
      }
    },

    heal: (amount: number) => {
      const { character } = get();
      if (!character) return;

      const newHealth = Math.min(character.maxHealth, character.health + amount);
      const updatedCharacter = { ...character, health: newHealth };
      set({ character: updatedCharacter });
    },

    spendMana: (amount: number) => {
      const { character } = get();
      if (!character || character.mana < amount) return false;

      const newMana = character.mana - amount;
      const updatedCharacter = { ...character, mana: newMana };
      set({ character: updatedCharacter });
      return true;
    },

    restoreMana: (amount: number) => {
      const { character } = get();
      if (!character) return;

      const newMana = Math.min(character.maxMana, character.mana + amount);
      const updatedCharacter = { ...character, mana: newMana };
      set({ character: updatedCharacter });
    },

    modifyGold: (amount: number) => {
      const { character } = get();
      if (!character) return;

      const newGold = Math.max(0, character.gold + amount);
      const updatedCharacter = { ...character, gold: newGold };
      set({ character: updatedCharacter });
    },

    resetCharacter: () => {
      set({ character: null });
    },

    // Equipment methods
    equipItem: (item: Item, slot: keyof Character['equippedItems']) => {
      const { character } = get();
      if (!character) return false;

      // Validate item type matches slot
      if (slot === 'weapon' && item.type !== 'weapon') return false;
      if (slot === 'armor' && item.type !== 'armor') return false;
      if ((slot === 'accessory1' || slot === 'accessory2') && item.type !== 'misc') return false;

      const updatedEquipment = {
        ...character.equippedItems,
        [slot]: item,
      };

      set({
        character: {
          ...character,
          equippedItems: updatedEquipment,
        },
      });

      console.log(`Equipped ${item.name} to ${slot}`);
      return true;
    },

    unequipItem: (slot: keyof Character['equippedItems']) => {
      const { character } = get();
      if (!character) return null;

      const item = character.equippedItems[slot];
      if (!item) return null;

      const updatedEquipment = {
        ...character.equippedItems,
        [slot]: null,
      };

      set({
        character: {
          ...character,
          equippedItems: updatedEquipment,
        },
      });

      console.log(`Unequipped ${item.name} from ${slot}`);
      return item;
    },

    getEquippedItem: (slot: keyof Character['equippedItems']) => {
      const { character } = get();
      if (!character) return null;
      return character.equippedItems[slot];
    },

    getTotalStats: () => {
      const { character, gameEngine } = get();
      if (!character) return null;
      return gameEngine.getTotalStats(character);
    },

    getTotalArmor: () => {
      const { character, gameEngine } = get();
      if (!character) return 0;
      return gameEngine.getTotalArmor(character);
    },

    // Status effect methods
    addStatusEffect: (effect: StatusEffect) => {
      const { character, gameEngine } = get();
      if (!character) return;

      const updatedCharacter = gameEngine.addStatusEffect(character, effect) as Character;
      set({ character: updatedCharacter });
      console.log(`Added status effect: ${effect.name}`);
    },

    removeStatusEffect: (effectId: string) => {
      const { character } = get();
      if (!character) return;

      const updatedCharacter = {
        ...character,
        statusEffects: character.statusEffects.filter((e) => e.id !== effectId),
      };
      set({ character: updatedCharacter });
    },

    applyStatusEffects: () => {
      const { character, gameEngine } = get();
      if (!character) return;

      const updatedCharacter = gameEngine.applyStatusEffects(character) as Character;
      set({ character: updatedCharacter });
    },

    // Spell methods
    learnSpell: (spellId: string) => {
      const { character } = get();
      if (!character || character.knownSpells.includes(spellId)) return;

      const updatedCharacter = {
        ...character,
        knownSpells: [...character.knownSpells, spellId],
      };
      set({ character: updatedCharacter });
      console.log(`Learned new spell: ${spellId}`);
    },

    hasSpell: (spellId: string) => {
      const { character } = get();
      return character?.knownSpells.includes(spellId) || false;
    },

    castSpell: (spell: Spell) => {
      const { character } = get();
      if (!character) return { success: false, message: 'No character!' };

      if (character.mana < spell.manaCost) {
        return { success: false, message: 'Not enough mana!' };
      }

      // Spend mana
      const newMana = character.mana - spell.manaCost;
      const updatedCharacter = { ...character, mana: newMana };
      set({ character: updatedCharacter });

      return { success: true, message: `Cast ${spell.name}!` };
    },

    // Talent methods
    chooseTalent: (talentId: string) => {
      const { character } = get();
      if (!character) return;

      // Check if already chosen
      if (character.talents.some((t) => t.talentId === talentId)) return;

      const updatedCharacter = {
        ...character,
        talents: [...character.talents, { talentId, level: character.level }],
      };
      set({ character: updatedCharacter });
      console.log(`Chose talent: ${talentId}`);
    },

    spendStatPoint: (stat: keyof Character['stats']) => {
      const { character } = get();
      if (!character || character.unspentStatPoints <= 0) return false;

      const updatedCharacter = {
        ...character,
        stats: {
          ...character.stats,
          [stat]: character.stats[stat] + 1,
        },
        unspentStatPoints: character.unspentStatPoints - 1,
      };
      set({ character: updatedCharacter });
      console.log(`Increased ${stat} by 1`);
      return true;
    },

    // Playtime tracking
    updatePlaytime: (seconds: number) => {
      const { character } = get();
      if (!character) return;

      const updatedCharacter = {
        ...character,
        playtime: (character.playtime || 0) + seconds,
      };
      set({ character: updatedCharacter });
    },
  }))
);
