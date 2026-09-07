/**
 * This file contains the type definitions for the game.
 */
export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  stats: CharacterStats;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  createdAt: Date;
  equippedItems: EquippedItems;
  statusEffects: StatusEffect[];
  knownSpells: string[];
  talents: TalentChoice[];
  unspentStatPoints: number;
  playtime: number;
}

export interface EquippedItems {
  weapon: Item | null;
  armor: Item | null;
  accessory1: Item | null;
  accessory2: Item | null;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
  wisdom: number;
  charisma: number;
}

export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'cleric';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  value: number;
  rarity: ItemRarity;
  stats?: Partial<CharacterStats>;
  damage?: number;
  armor?: number;
  healing?: number;
  stackable?: boolean;
  quantity?: number;
}

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'misc' | 'quest';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GameState {
  character: Character | null;
  inventory: Item[];
  storyState: StoryState | null;
  currentLocation: string;
  gameFlags: Record<string, boolean>;
  combatState: CombatState | null;
  lastSaved: Date;
  quests: Quest[];
  achievements: Achievement[];
  saveSlot: number;
  version: string;
}

export interface StoryState {
  currentNodeId: string;
  visitedNodes: string[];
  variables: Record<string, StoryVariable>;
  choices: number[];
}

export interface StoryVariable {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
}

export interface CombatState {
  isActive: boolean;
  enemies: Enemy[];
  turnOrder: string[];
  currentTurn: number;
  playerActions: CombatAction[];
  isDefending: boolean;
  turnNumber: number;
}

export interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  level: number;
  statusEffects: StatusEffect[];
}

export interface CombatAction {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defend' | 'spell' | 'item';
  cost?: number;
  damage?: number;
  healing?: number;
}

export interface AIAgent {
  id: string;
  name: string;
  role: 'dungeon_master' | 'npc' | 'ally';
  personality: string;
  knowledge: string[];
  responseTemplates: Record<string, string[]>;
}

export interface StoryChoice {
  text: string;
  index: number;
  tags?: string[];
}

export interface StorySegment {
  text: string;
  choices: StoryChoice[];
  tags: string[];
  variables: Record<string, any>;
}

// New interfaces for features

export interface Spell {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  damage?: number;
  healing?: number;
  effect?: StatusEffectType;
  targetType: 'single' | 'area' | 'self';
  requiredClass?: CharacterClass[];
  requiredLevel: number;
  cooldown?: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: StatusEffectType;
  duration: number;
  damagePerTurn?: number;
  healingPerTurn?: number;
  statModifier?: Partial<CharacterStats>;
  icon: string;
  stackable: boolean;
  stacks?: number;
}

export type StatusEffectType =
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'stun'
  | 'bleed'
  | 'buff_strength'
  | 'buff_defense'
  | 'buff_magic'
  | 'debuff_attack'
  | 'debuff_defense'
  | 'regeneration';

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  status: QuestStatus;
  questGiver?: string;
  level: number;
  isMainQuest: boolean;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'reach_location' | 'talk_to_npc' | 'use_item';
  target: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface QuestRewards {
  experience: number;
  gold: number;
  items?: Item[];
  unlockSpell?: string;
}

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  required: number;
  unlocked: boolean;
  unlockedAt?: Date;
  reward?: {
    gold?: number;
    item?: Item;
    title?: string;
  };
  hidden: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  requiredItems: { itemId: string; quantity: number }[];
  output: Item;
  requiredLevel?: number;
  requiredClass?: CharacterClass[];
  category: 'weapon' | 'armor' | 'consumable' | 'misc';
}

export interface ShopItem {
  item: Item;
  stock: number;
  priceModifier: number;
}

export interface Merchant {
  id: string;
  name: string;
  greeting: string;
  inventory: ShopItem[];
  buyPriceModifier: number;
  sellPriceModifier: number;
  refreshInterval?: number;
}

export interface TalentChoice {
  talentId: string;
  level: number;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  requiredClass: CharacterClass;
  requiredLevel: number;
  tree: 'left' | 'middle' | 'right';
  tier: number;
  requirements?: string[];
  effects: TalentEffect[];
  icon: string;
}

export interface TalentEffect {
  type: 'stat_boost' | 'unlock_spell' | 'passive_ability' | 'damage_modifier';
  value: any;
}

export interface SaveSlot {
  slot: number;
  character: Character | null;
  lastSaved: Date;
  playtime: number;
  location: string;
  level: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  characterName: string;
  characterClass: CharacterClass;
  level: number;
  playtime: number;
  achievementsUnlocked: number;
  createdAt: Date;
}
