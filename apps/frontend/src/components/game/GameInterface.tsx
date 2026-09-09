import React, { useEffect, useState } from 'react';
import { useCharacter } from '../../lib/stores/useCharacter';
import { useStoryEngine } from '../../lib/stores/useStoryEngine';
import { useAIAgents } from '../../lib/stores/useAIAgents';
import { CharacterSheet } from './CharacterSheet';
import { StoryDisplay } from './StoryDisplay';
import { ChoiceButtons } from './ChoiceButtons';
import { InventoryPanel } from './InventoryPanel';
import { SaveLoadPanel } from './SaveLoadPanel';
import { OraclePanel } from './OraclePanel';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Gamepad2, User, Package, Save, Volume2, VolumeX, Dices } from 'lucide-react';
import { useAudio } from '../../lib/stores/useAudio';

interface GameInterfaceProps {
  backendUrl: string;
  initDataRaw: string;
}

/**
 * The main game interface component.
 * It displays the story, choices, character sheet, inventory, and save/load panels.
 * @returns {JSX.Element} The rendered game interface.
 */
export const GameInterface: React.FC<GameInterfaceProps> = ({ backendUrl, initDataRaw }) => {
  const { character } = useCharacter();
  const { currentText, currentChoices, initializeStory, makeChoice, isLoading } = useStoryEngine();
  const { getResponse, isThinking, configure } = useAIAgents();
  const { toggleMute, isMuted } = useAudio();
  const [activeTab, setActiveTab] = useState('story');
  const [dmResponse, setDmResponse] = useState<string>('');

  useEffect(() => {
    configure(backendUrl, initDataRaw);
  }, [backendUrl, initDataRaw, configure]);

  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  const handleChoice = async (choiceIndex: number) => {
    if (currentChoices[choiceIndex]) {
      makeChoice(choiceIndex);
      
      // Get AI DM response based on choice
      const context = currentChoices[choiceIndex].text.toLowerCase().includes('combat') ? 'combat_start' : 'continue';
      const response = await getResponse('dungeon_master', context, character?.name);
      setDmResponse(response);
    }
  };

  if (!character) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">No Character Found</h2>
            <p className="text-muted-foreground">Please create a character first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold truncate">Aethermoor</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground p-1 sm:p-2"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-24 sm:max-w-none">
              {character.name} - L{character.level}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-2 sm:p-4 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card border-border h-auto">
            <TabsTrigger value="story" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Adventure</span>
              <span className="xs:hidden">Game</span>
            </TabsTrigger>
            <TabsTrigger value="character" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Character</span>
              <span className="xs:hidden">Char</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Inventory</span>
              <span className="xs:hidden">Inv</span>
            </TabsTrigger>
            <TabsTrigger value="oracle" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Dices className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Oracle</span>
              <span className="xs:hidden">Dice</span>
            </TabsTrigger>
            <TabsTrigger value="save" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Save/Load</span>
              <span className="xs:hidden">Save</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-2 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Main Story Panel */}
              <div className="lg:col-span-2">
                <StoryDisplay
                  currentText={currentText}
                  isLoading={isLoading}
                  dmResponse={dmResponse}
                  isThinking={isThinking}
                />
                <div className="mt-4">
                  <ChoiceButtons
                    choices={currentChoices}
                    onChoice={handleChoice}
                    disabled={isLoading || isThinking}
                  />
                </div>
              </div>

              {/* Character Summary Panel */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-3 text-primary">{character.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span>{character.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Class:</span>
                        <span className="capitalize">{character.class}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Health:</span>
                        <span className="text-destructive">{character.health}/{character.maxHealth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mana:</span>
                        <span className="text-primary">{character.mana}/{character.maxMana}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gold:</span>
                        <span className="text-warning">{character.gold}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-3 text-success">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-muted border-border hover:bg-muted"
                        onClick={() => setActiveTab('inventory')}
                      >
                        View Inventory
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-muted border-border hover:bg-muted"
                        onClick={() => setActiveTab('character')}
                      >
                        Character Sheet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="character" className="mt-4">
            <CharacterSheet />
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            <InventoryPanel />
          </TabsContent>

          <TabsContent value="oracle" className="mt-4">
            <OraclePanel />
          </TabsContent>

          <TabsContent value="save" className="mt-4">
            <SaveLoadPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
