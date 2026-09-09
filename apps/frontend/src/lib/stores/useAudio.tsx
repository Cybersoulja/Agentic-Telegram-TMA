/**
 * Minimal audio-toggle stub. AetherRPG's original used `howler` for actual sound playback,
 * which isn't part of this repo's dependency set (see CLAUDE.md's port notes) — this keeps the
 * `isMuted`/`toggleMute` interface the ported UI components expect without playing anything.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AudioState {
  isMuted: boolean;
  toggleMute: () => void;
}

export const useAudio = create<AudioState>()(
  subscribeWithSelector((set) => ({
    isMuted: true,
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  }))
);
