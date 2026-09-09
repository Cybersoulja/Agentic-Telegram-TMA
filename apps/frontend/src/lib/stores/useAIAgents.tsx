/**
 * Zustand store for AI agent (DM/NPC) responses.
 *
 * Unlike AetherRPG's original — a local AIAgentEngine that picked a random line from a
 * hand-written template table — this calls the Worker's /api/rpg/dm route, which is backed by
 * real Gemini (falling back to a static line server-side when GEMINI_API_KEY isn't configured).
 * `configure()` must be called once with the app's backendUrl/initDataRaw before getResponse
 * works, since a Zustand store has no access to React props.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { consultDm } from '../api';

interface AIAgentState {
  backendUrl: string;
  initDataRaw: string;
  lastResponse: string;
  isThinking: boolean;
  conversationHistory: Array<{ agentId: string; message: string; timestamp: Date; context?: string }>;

  configure: (backendUrl: string, initDataRaw: string) => void;
  getResponse: (agentId: string, context: string, playerName?: string) => Promise<string>;
  addToHistory: (agentId: string, message: string, context?: string) => void;
  clearHistory: () => void;
}

export const useAIAgents = create<AIAgentState>()(
  subscribeWithSelector((set, get) => ({
    backendUrl: '',
    initDataRaw: '',
    lastResponse: '',
    isThinking: false,
    conversationHistory: [],

    configure: (backendUrl, initDataRaw) => set({ backendUrl, initDataRaw }),

    getResponse: async (agentId, context, playerName) => {
      const { backendUrl, initDataRaw, addToHistory } = get();
      set({ isThinking: true });
      try {
        const result = await consultDm(backendUrl, initDataRaw, { agentId, context, playerName });
        set({ lastResponse: result.text, isThinking: false });
        addToHistory(agentId, result.text, context);
        return result.text;
      } catch (error) {
        console.error('Error generating AI response:', error);
        const fallback = "I apologize, but I'm having trouble responding right now.";
        set({ lastResponse: fallback, isThinking: false });
        return fallback;
      }
    },

    addToHistory: (agentId, message, context) => {
      const { conversationHistory } = get();
      const entry = { agentId, message, context, timestamp: new Date() };
      // Keep only the last 50 entries to prevent memory issues
      set({ conversationHistory: [...conversationHistory, entry].slice(-50) });
    },

    clearHistory: () => set({ conversationHistory: [] }),
  }))
);
