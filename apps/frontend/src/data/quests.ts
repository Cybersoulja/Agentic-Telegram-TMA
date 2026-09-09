import type { Quest } from '../types/game';

export const QUESTS: Quest[] = [
  {
    id: 'welcome_to_millbrook',
    title: 'Welcome to Millbrook',
    description: 'Explore the town and talk to the locals.',
    objectives: [
      {
        id: 'visit_tavern',
        description: 'Visit The Prancing Pony tavern',
        type: 'reach_location',
        target: 'tavern',
        current: 0,
        required: 1,
        completed: false,
      },
      {
        id: 'visit_marketplace',
        description: 'Visit the marketplace',
        type: 'reach_location',
        target: 'marketplace',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 50,
      gold: 25,
    },
    status: 'available',
    level: 1,
    isMainQuest: true,
  },
  {
    id: 'gather_supplies',
    title: 'Gather Supplies',
    description: 'Collect healing potions and bread for your journey.',
    objectives: [
      {
        id: 'collect_potions',
        description: 'Collect 3 health potions',
        type: 'collect',
        target: 'health_potion',
        current: 0,
        required: 3,
        completed: false,
      },
      {
        id: 'collect_bread',
        description: 'Collect 5 bread',
        type: 'collect',
        target: 'bread',
        current: 0,
        required: 5,
        completed: false,
      },
    ],
    rewards: {
      experience: 75,
      gold: 50,
    },
    status: 'available',
    level: 1,
    isMainQuest: false,
  },
  {
    id: 'forest_exploration',
    title: 'Into the Forest',
    description: 'Venture into the mysterious Shadowlands Forest.',
    objectives: [
      {
        id: 'reach_forest',
        description: 'Reach the Shadowlands Forest',
        type: 'reach_location',
        target: 'forest',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 100,
      gold: 75,
    },
    status: 'available',
    level: 2,
    isMainQuest: true,
  },
  {
    id: 'defeat_bandits',
    title: 'Bandit Trouble',
    description: 'The town guard needs help dealing with bandits.',
    objectives: [
      {
        id: 'kill_bandits',
        description: 'Defeat 5 bandits',
        type: 'kill',
        target: 'bandit',
        current: 0,
        required: 5,
        completed: false,
      },
    ],
    rewards: {
      experience: 150,
      gold: 100,
      items: [
        {
          id: 'bandit_mask',
          name: 'Bandit Mask',
          description: 'A mask worn by defeated bandits.',
          type: 'misc',
          value: 50,
          rarity: 'uncommon',
        },
      ],
    },
    status: 'available',
    questGiver: 'Town Guard',
    level: 3,
    isMainQuest: false,
  },
  {
    id: 'merchant_delivery',
    title: "Gareth's Delivery",
    description: 'Deliver a package to a customer for Gareth the Trader.',
    objectives: [
      {
        id: 'talk_to_customer',
        description: 'Deliver package to customer',
        type: 'talk_to_npc',
        target: 'mysterious_customer',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 80,
      gold: 60,
    },
    status: 'available',
    questGiver: 'Gareth the Trader',
    level: 2,
    isMainQuest: false,
  },
  {
    id: 'hidden_grove',
    title: 'The Hidden Grove',
    description: 'Discover the secret grove deep in the forest.',
    objectives: [
      {
        id: 'find_grove',
        description: 'Find the hidden grove',
        type: 'reach_location',
        target: 'hidden_grove',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 200,
      gold: 150,
      unlockSpell: 'regeneration',
    },
    status: 'available',
    level: 5,
    isMainQuest: false,
  },
  {
    id: 'stone_circle',
    title: 'The Ancient Stones',
    description: 'Investigate the mysterious stone circle.',
    objectives: [
      {
        id: 'reach_circle',
        description: 'Reach the stone circle',
        type: 'reach_location',
        target: 'stone_circle',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 250,
      gold: 200,
    },
    status: 'available',
    level: 6,
    isMainQuest: true,
  },
  {
    id: 'confront_malachar',
    title: 'The Final Confrontation',
    description: 'Face Malachar and decide the fate of the realm.',
    objectives: [
      {
        id: 'defeat_malachar',
        description: 'Confront Malachar',
        type: 'kill',
        target: 'malachar',
        current: 0,
        required: 1,
        completed: false,
      },
    ],
    rewards: {
      experience: 500,
      gold: 500,
    },
    status: 'available',
    level: 8,
    isMainQuest: true,
  },
  {
    id: 'collect_artifacts',
    title: 'Ancient Artifacts',
    description: 'Collect rare artifacts from across the land.',
    objectives: [
      {
        id: 'collect_coins',
        description: 'Collect 5 ancient coins',
        type: 'collect',
        target: 'ancient_coin',
        current: 0,
        required: 5,
        completed: false,
      },
      {
        id: 'collect_crystals',
        description: 'Collect 3 magic crystals',
        type: 'collect',
        target: 'magic_crystal',
        current: 0,
        required: 3,
        completed: false,
      },
    ],
    rewards: {
      experience: 300,
      gold: 250,
      items: [
        {
          id: 'artifact_compass',
          name: 'Artifact Compass',
          description: 'A compass that points to hidden treasures.',
          type: 'quest',
          value: 500,
          rarity: 'epic',
        },
      ],
    },
    status: 'available',
    level: 7,
    isMainQuest: false,
  },
  {
    id: 'learn_magic',
    title: 'Arcane Studies',
    description: 'Master the art of spellcasting.',
    objectives: [
      {
        id: 'cast_spells',
        description: 'Cast 10 spells in combat',
        type: 'use_item',
        target: 'spell',
        current: 0,
        required: 10,
        completed: false,
      },
    ],
    rewards: {
      experience: 200,
      gold: 100,
      unlockSpell: 'arcane_blast',
    },
    status: 'available',
    level: 5,
    isMainQuest: false,
  },
];

export function getQuestById(questId: string): Quest | undefined {
  return QUESTS.find((q) => q.id === questId);
}

export function getAvailableQuests(playerLevel: number): Quest[] {
  return QUESTS.filter(
    (quest) =>
      quest.status === 'available' && quest.level <= playerLevel + 2
  );
}

export function getActiveQuests(quests: Quest[]): Quest[] {
  return quests.filter((q) => q.status === 'active');
}

export function getCompletedQuests(quests: Quest[]): Quest[] {
  return quests.filter((q) => q.status === 'completed');
}
