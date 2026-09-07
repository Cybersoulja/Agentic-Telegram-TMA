import React, { useEffect, useState } from 'react';
import { useCharacter } from '../lib/stores/useCharacter';
import { useInventory } from '../lib/stores/useInventory';
import { useStoryEngine } from '../lib/stores/useStoryEngine';
import { useAIAgents } from '../lib/stores/useAIAgents';
import { WelcomeScreen } from './game/WelcomeScreen';
import { CharacterCreation } from './game/CharacterCreation';
import { GameInterface } from './game/GameInterface';

interface RpgTabProps {
  backendUrl: string;
  initDataRaw: string;
}

/**
 * Orchestrates the RPG's welcome -> character creation -> playing phases, ported from
 * AetherRPG's top-level App.tsx (adapted to be one tab of this Mini App rather than the
 * whole application).
 */
export const RpgTab: React.FC<RpgTabProps> = ({ backendUrl, initDataRaw }) => {
  const { character } = useCharacter();
  const { initializeInventory } = useInventory();
  const { initializeStory } = useStoryEngine();
  const { configure } = useAIAgents();
  const [gamePhase, setGamePhase] = useState<'welcome' | 'character_creation' | 'playing'>('welcome');

  useEffect(() => {
    configure(backendUrl, initDataRaw);
  }, [backendUrl, initDataRaw, configure]);

  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  useEffect(() => {
    if (character && gamePhase === 'character_creation') {
      initializeInventory(character.class);
      setGamePhase('playing');
    }
  }, [character, gamePhase, initializeInventory]);

  switch (gamePhase) {
    case 'welcome':
      return (
        <WelcomeScreen
          onStartNewGame={() => setGamePhase('character_creation')}
          onContinueGame={() => setGamePhase(character ? 'playing' : 'character_creation')}
          hasSavedGame={!!character}
        />
      );
    case 'character_creation':
      return (
        <CharacterCreation
          onCharacterCreated={() => setGamePhase('playing')}
          onBackToMenu={() => setGamePhase('welcome')}
        />
      );
    case 'playing':
      return <GameInterface backendUrl={backendUrl} initDataRaw={initDataRaw} />;
  }
};
