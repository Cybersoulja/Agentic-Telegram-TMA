import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Achievement } from '../../types/game';
import { ACHIEVEMENTS } from '../../data/achievements';

interface AchievementsState {
  achievements: Achievement[];

  // Actions
  initializeAchievements: () => void;
  updateProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  getAchievementById: (achievementId: string) => Achievement | undefined;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getTotalUnlocked: () => number;
}

export const useAchievements = create<AchievementsState>()(
  subscribeWithSelector((set, get) => ({
    achievements: [],

    initializeAchievements: () => {
      set({ achievements: ACHIEVEMENTS.map((a) => ({ ...a })) });
      console.log('Achievements initialized');
    },

    updateProgress: (achievementId: string, progress: number) => {
      set((state) => ({
        achievements: state.achievements.map((ach) => {
          if (ach.id !== achievementId || ach.unlocked) return ach;

          const newProgress = Math.min(ach.required, ach.progress + progress);
          const unlocked = newProgress >= ach.required;

          if (unlocked) {
            console.log(`Achievement unlocked: ${ach.name}!`);
            return {
              ...ach,
              progress: newProgress,
              unlocked: true,
              unlockedAt: new Date(),
            };
          }

          return { ...ach, progress: newProgress };
        }),
      }));
    },

    unlockAchievement: (achievementId: string) => {
      set((state) => ({
        achievements: state.achievements.map((ach) =>
          ach.id === achievementId && !ach.unlocked
            ? { ...ach, unlocked: true, unlockedAt: new Date(), progress: ach.required }
            : ach
        ),
      }));
      const achievement = get().getAchievementById(achievementId);
      if (achievement) {
        console.log(`Achievement unlocked: ${achievement.name}!`);
      }
    },

    getAchievementById: (achievementId: string) => {
      return get().achievements.find((a) => a.id === achievementId);
    },

    getUnlockedAchievements: () => {
      return get().achievements.filter((a) => a.unlocked);
    },

    getLockedAchievements: () => {
      return get().achievements.filter((a) => !a.unlocked && !a.hidden);
    },

    getTotalUnlocked: () => {
      return get().achievements.filter((a) => a.unlocked).length;
    },
  }))
);
