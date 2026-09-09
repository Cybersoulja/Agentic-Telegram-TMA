/**
 * This file contains the character data for the game, including character classes and starting names.
 */
import type { CharacterClass, CharacterStats } from '../types/game';

export const CHARACTER_CLASSES: Record<CharacterClass, {
  name: string;
  description: string;
  baseStats: CharacterStats;
  startingGold: number;
}> = {
  warrior: {
    name: 'Warrior',
    description: 'A brave fighter skilled in combat and weapons. High strength and constitution.',
    baseStats: {
      strength: 16,
      dexterity: 12,
      intelligence: 8,
      constitution: 15,
      wisdom: 10,
      charisma: 9
    },
    startingGold: 100
  },
  mage: {
    name: 'Mage',
    description: 'A scholar of the arcane arts. High intelligence and wisdom for powerful spells.',
    baseStats: {
      strength: 8,
      dexterity: 10,
      intelligence: 16,
      constitution: 10,
      wisdom: 14,
      charisma: 12
    },
    startingGold: 75
  },
  rogue: {
    name: 'Rogue',
    description: 'A nimble thief and scout. High dexterity for stealth and precision attacks.',
    baseStats: {
      strength: 10,
      dexterity: 16,
      intelligence: 12,
      constitution: 11,
      wisdom: 13,
      charisma: 8
    },
    startingGold: 125
  },
  cleric: {
    name: 'Cleric',
    description: 'A divine healer and protector. High wisdom and charisma for healing magic.',
    baseStats: {
      strength: 12,
      dexterity: 9,
      intelligence: 11,
      constitution: 13,
      wisdom: 16,
      charisma: 14
    },
    startingGold: 90
  }
};

export const STARTING_NAMES = {
  warrior: ['Thorgar', 'Brynn', 'Gareth', 'Lyanna', 'Roderick'],
  mage: ['Eldric', 'Celeste', 'Theron', 'Morgana', 'Zephyr'],
  rogue: ['Vex', 'Sable', 'Finn', 'Raven', 'Dex'],
  cleric: ['Aiden', 'Seraphina', 'Benedict', 'Luna', 'Gabriel']
};
