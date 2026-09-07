import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Quest } from '../../types/game';
import { QUESTS, getAvailableQuests, getActiveQuests, getCompletedQuests } from '../../data/quests';

interface QuestsState {
  quests: Quest[];

  // Actions
  initializeQuests: () => void;
  activateQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
  updateQuestObjective: (questId: string, objectiveId: string, progress: number) => void;
  checkQuestCompletion: (questId: string) => boolean;
  getActiveQuests: () => Quest[];
  getCompletedQuests: () => Quest[];
  getAvailableQuests: (playerLevel: number) => Quest[];
  getQuestById: (questId: string) => Quest | undefined;
}

export const useQuests = create<QuestsState>()(
  subscribeWithSelector((set, get) => ({
    quests: [],

    initializeQuests: () => {
      // Initialize with all quests in available state
      set({ quests: QUESTS.map((q) => ({ ...q })) });
      console.log('Quests initialized');
    },

    activateQuest: (questId: string) => {
      set((state) => ({
        quests: state.quests.map((q) =>
          q.id === questId && q.status === 'available' ? { ...q, status: 'active' } : q
        ),
      }));
      console.log(`Quest activated: ${questId}`);
    },

    completeQuest: (questId: string) => {
      set((state) => ({
        quests: state.quests.map((q) =>
          q.id === questId ? { ...q, status: 'completed' } : q
        ),
      }));
      console.log(`Quest completed: ${questId}`);
    },

    failQuest: (questId: string) => {
      set((state) => ({
        quests: state.quests.map((q) =>
          q.id === questId ? { ...q, status: 'failed' } : q
        ),
      }));
      console.log(`Quest failed: ${questId}`);
    },

    updateQuestObjective: (questId: string, objectiveId: string, progress: number) => {
      set((state) => ({
        quests: state.quests.map((quest) => {
          if (quest.id !== questId) return quest;

          const updatedObjectives = quest.objectives.map((obj) => {
            if (obj.id !== objectiveId) return obj;

            const newCurrent = Math.min(obj.required, obj.current + progress);
            const completed = newCurrent >= obj.required;

            return { ...obj, current: newCurrent, completed };
          });

          return { ...quest, objectives: updatedObjectives };
        }),
      }));

      // Check if quest is now complete
      const quest = get().getQuestById(questId);
      if (quest && get().checkQuestCompletion(questId)) {
        get().completeQuest(questId);
      }
    },

    checkQuestCompletion: (questId: string) => {
      const quest = get().getQuestById(questId);
      if (!quest) return false;

      return quest.objectives.every((obj) => obj.completed);
    },

    getActiveQuests: () => {
      return getActiveQuests(get().quests);
    },

    getCompletedQuests: () => {
      return getCompletedQuests(get().quests);
    },

    getAvailableQuests: (playerLevel: number) => {
      return getAvailableQuests(playerLevel);
    },

    getQuestById: (questId: string) => {
      return get().quests.find((q) => q.id === questId);
    },
  }))
);
