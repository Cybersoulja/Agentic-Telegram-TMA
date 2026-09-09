/**
 * Zustand store for the Story Decision Oracle.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { rollDice, generateNarrative, type OracleResult } from '../oracleEngine';

interface OracleState {
  isRolling: boolean;
  lastResult: OracleResult | null;
  history: OracleResult[];

  // Actions
  consultOracle: (situation: string) => Promise<void>;
  clearHistory: () => void;
}

export const useOracle = create<OracleState>()(
  subscribeWithSelector((set) => ({
    isRolling: false,
    lastResult: null,
    history: [],

    consultOracle: async (situation: string) => {
      set({ isRolling: true });

      // Brief suspense delay so the dice animation has time to play
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const diceResult = rollDice();
      const narrative = generateNarrative(situation, diceResult);

      const result: OracleResult = {
        situation,
        diceResult,
        narrative,
        timestamp: new Date(),
      };

      set((state) => ({
        isRolling: false,
        lastResult: result,
        // Keep the 20 most recent consultations
        history: [result, ...state.history].slice(0, 20),
      }));
    },

    clearHistory: () => {
      set({ history: [], lastResult: null });
    },
  }))
);
