import React, { useEffect, useState } from 'react';
import { useCharacter } from '../lib/stores/useCharacter';
import { useInventory } from '../lib/stores/useInventory';
import { useStoryEngine } from '../lib/stores/useStoryEngine';
import { useAIAgents } from '../lib/stores/useAIAgents';
import { WelcomeScreen } from './game/WelcomeScreen';
import { CharacterCreation } from './game/CharacterCreation';
import { GameInterface } from './game/GameInterface';
import type { GameState } from '../types/game';

interface RpgTabProps {
  backendUrl: string;
  initDataRaw: string;
}

interface StoredSave {
  name: string;
  data: GameState;
  timestamp: string;
}

/** Reads SaveLoadPanel.tsx's localStorage save list and returns the most recently saved entry. */
function getMostRecentLocalSave(): StoredSave | null {
  try {
    const raw = localStorage.getItem('rpg_saved_games');
    if (!raw) return null;
    const saves: StoredSave[] = JSON.parse(raw);
    if (!saves.length) return null;
    return saves.reduce((latest, save) =>
      new Date(save.timestamp) > new Date(latest.timestamp) ? save : latest
    );
  } catch {
    return null;
  }
}

/**
 * Orchestrates the RPG's welcome -> character creation -> playing phases, ported from
 * AetherRPG's top-level App.tsx (adapted to be one tab of this Mini App rather than the
 * whole application).
 */
export const RpgTab: React.FC<RpgTabProps> = ({ backendUrl, initDataRaw }) => {
  const { character, resetCharacter, updateCharacter } = useCharacter();
  const { initializeInventory, setInventory } = useInventory();
  const { initializeStory, restoreStoryState } = useStoryEngine();
  const { configure } = useAIAgents();
  const [gamePhase, setGamePhase] = useState<'welcome' | 'character_creation' | 'playing'>('welcome');
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    configure(backendUrl, initDataRaw);
  }, [backendUrl, initDataRaw, configure]);

  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  // The character store isn't persisted, so on a fresh page load `character` is always null.
  // Fall back to checking for a local save so "Continue" is offered when one actually exists.
  useEffect(() => {
    setHasSavedGame(!!character || !!getMostRecentLocalSave());
  }, [character]);

  const handleContinueGame = () => {
    if (character) {
      setGamePhase('playing');
      return;
    }
    const save = getMostRecentLocalSave();
    if (save?.data.character) {
      updateCharacter(save.data.character);
      setInventory(save.data.inventory ?? []);
      restoreStoryState(save.data.storyState as unknown as { currentNodeId: string; variables: Record<string, any> } | null);
      setGamePhase('playing');
    }
  };

  const handleStartNewGame = () => {
    // Clear any existing character explicitly, rather than just switching phase, so
    // CharacterCreation isn't immediately bounced back to 'playing' by a stale character.
    resetCharacter();
    setGamePhase('character_creation');
  };

  const handleCharacterCreated = () => {
    // createCharacter() (called by CharacterCreation just before this) sets the store
    // synchronously, so read it directly here instead of depending on an effect that
    // would race with this same render's phase transition.
    const created = useCharacter.getState().character;
    if (created) {
      initializeInventory(created.class);
    }
    setGamePhase('playing');
  };

  switch (gamePhase) {
    case 'welcome':
      return (
        <WelcomeScreen
          onStartNewGame={handleStartNewGame}
          onContinueGame={handleContinueGame}
          hasSavedGame={hasSavedGame}
        />
      );
    case 'character_creation':
      return (
        <CharacterCreation
          onCharacterCreated={handleCharacterCreated}
          onBackToMenu={() => setGamePhase('welcome')}
        />
      );
    case 'playing':
      return <GameInterface backendUrl={backendUrl} initDataRaw={initDataRaw} />;
  }
};
