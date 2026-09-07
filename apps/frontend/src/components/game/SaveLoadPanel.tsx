import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../lib/stores/useCharacter';
import { useInventory } from '../../lib/stores/useInventory';
import { useStoryEngine } from '../../lib/stores/useStoryEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Save, Upload, Trash2, FileText, Clock, User } from 'lucide-react';
import type { GameState } from '../../types/game';

/**
 * A component that provides functionality for saving and loading the game.
 * @returns {JSX.Element} The rendered save/load panel.
 */
export const SaveLoadPanel: React.FC = () => {
  const { character, gameEngine, updateCharacter } = useCharacter();
  const { items, setInventory } = useInventory();
  const { getStoryState, restoreStoryState, resetStory } = useStoryEngine();
  const [saves, setSaves] = useState<Array<{ name: string; data: GameState; timestamp: Date }>>([]);
  const [saveName, setSaveName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSaves = () => {
    try {
      const savedGames = localStorage.getItem('rpg_saved_games');
      if (savedGames) {
        const parsedSaves = JSON.parse(savedGames).map((save: any) => ({
          ...save,
          timestamp: new Date(save.timestamp)
        }));
        setSaves(parsedSaves);
      }
    } catch (error) {
      console.error('Failed to load saves:', error);
      setMessage({ type: 'error', text: 'Failed to load saved games.' });
    }
  };

  const saveGame = (name?: string) => {
    const nameToSave = (name ?? saveName).trim();

    if (!character) {
      setMessage({ type: 'error', text: 'No character to save.' });
      return;
    }

    if (!nameToSave) {
      setMessage({ type: 'error', text: 'Please enter a save name.' });
      return;
    }

    try {
      const gameState: GameState = {
        character,
        inventory: items,
        storyState: getStoryState() as unknown as GameState['storyState'],
        currentLocation: 'unknown',
        gameFlags: {},
        combatState: null,
        lastSaved: new Date(),
        quests: [],
        achievements: [],
        saveSlot: 1,
        version: '1.0.0'
      };

      const saveData = {
        name: nameToSave,
        data: gameState,
        timestamp: new Date()
      };

      const existingIndex = saves.findIndex(save => save.name === nameToSave);
      let updatedSaves;

      if (existingIndex !== -1) {
        updatedSaves = [...saves];
        updatedSaves[existingIndex] = saveData;
      } else {
        updatedSaves = [...saves, saveData];
      }

      // Keep only the last 10 saves
      if (updatedSaves.length > 10) {
        updatedSaves = updatedSaves.slice(-10);
      }

      localStorage.setItem('rpg_saved_games', JSON.stringify(updatedSaves));
      setSaves(updatedSaves);
      setSaveName('');
      setMessage({ type: 'success', text: `Game saved as "${saveData.name}".` });
    } catch (error) {
      console.error('Failed to save game:', error);
      setMessage({ type: 'error', text: 'Failed to save game.' });
    }
  };

  const loadGame = (saveData: { name: string; data: GameState; timestamp: Date }) => {
    try {
      const { data } = saveData;

      if (data.character) {
        updateCharacter(data.character);
        setInventory(data.inventory ?? []);
        restoreStoryState(data.storyState as unknown as { currentNodeId: string; variables: Record<string, any> } | null);
        setMessage({ type: 'success', text: `Game "${saveData.name}" loaded successfully.` });
      } else {
        setMessage({ type: 'error', text: 'Invalid save data.' });
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      setMessage({ type: 'error', text: 'Failed to load game.' });
    }
  };

  const deleteSave = (saveName: string) => {
    try {
      const updatedSaves = saves.filter(save => save.name !== saveName);
      localStorage.setItem('rpg_saved_games', JSON.stringify(updatedSaves));
      setSaves(updatedSaves);
      setMessage({ type: 'info', text: `Save "${saveName}" deleted.` });
    } catch (error) {
      console.error('Failed to delete save:', error);
      setMessage({ type: 'error', text: 'Failed to delete save.' });
    }
  };

  const exportSave = (saveData: { name: string; data: GameState; timestamp: Date }) => {
    try {
      const dataStr = JSON.stringify(saveData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${saveData.name}_save.json`;
      link.click();
      
      setMessage({ type: 'success', text: 'Save exported successfully.' });
    } catch (error) {
      console.error('Failed to export save:', error);
      setMessage({ type: 'error', text: 'Failed to export save.' });
    }
  };

  const quickSave = () => {
    const timestamp = new Date().toLocaleString();
    const name = `Quick Save - ${timestamp}`;
    setSaveName(name);
    saveGame(name);
  };

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Alert className={`${
          message.type === 'error' ? 'border-destructive bg-destructive/10' :
          message.type === 'success' ? 'border-success bg-success/10' :
          'border-primary bg-primary/10'
        }`}>
          <AlertDescription className="text-foreground">
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Save Game */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <Save className="h-5 w-5" />
            Save Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter save name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveGame()}
              className="bg-muted border-border text-foreground"
            />
            <Button
              onClick={() => saveGame()}
              disabled={!character || !saveName.trim()}
              className="bg-success hover:bg-success/90"
            >
              Save
            </Button>
          </div>
          
          <Button 
            onClick={quickSave}
            disabled={!character}
            variant="outline"
            className="w-full border-border hover:bg-muted"
          >
            Quick Save
          </Button>
        </CardContent>
      </Card>

      {/* Load Game */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            Load Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saves.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No saved games found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saves.map((save, index) => (
                <Card key={index} className="bg-muted border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{save.name}</h4>
                          {save.data.character && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              Level {save.data.character.level} {save.data.character.class}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {save.data.character?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {save.timestamp.toLocaleDateString()} {save.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => loadGame(save)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportSave(save)}
                          className="border-border hover:bg-muted"
                        >
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSave(save.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <FileText className="h-5 w-5" />
            Game Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              gameEngine.deleteSave();
              resetStory();
              setMessage({ type: 'info', text: 'Current progress reset.' });
            }}
            className="w-full border-border hover:bg-muted"
          >
            Reset Current Progress
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('This will delete all saved games. Are you sure?')) {
                localStorage.removeItem('rpg_saved_games');
                setSaves([]);
                setMessage({ type: 'info', text: 'All saved games deleted.' });
              }
            }}
            className="w-full"
          >
            Delete All Saves
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
