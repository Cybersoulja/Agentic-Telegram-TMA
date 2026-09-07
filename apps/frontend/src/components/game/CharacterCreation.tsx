import React, { useState } from 'react';
import { useCharacter } from '../../lib/stores/useCharacter';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  User, 
  ArrowLeft, 
  Sword, 
  Wand2, 
  Eye, 
  Cross,
  Star,
  Coins
} from 'lucide-react';
import type { CharacterClass } from '../../types/game';
import { CHARACTER_CLASSES, STARTING_NAMES } from '../../data/characters';

/**
 * Props for the CharacterCreation component.
 */
interface CharacterCreationProps {
  /**
   * Callback function to be called when the character is created.
   */
  onCharacterCreated: () => void;
  /**
   * Callback function to be called when the user wants to go back to the main menu.
   */
  onBackToMenu: () => void;
}

/**
 * A component for creating a new character.
 * It guides the user through selecting a class, naming the character, and confirming their choices.
 * @param {CharacterCreationProps} props - The props for the component.
 * @returns {JSX.Element} The rendered character creation screen.
 */
export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  onCharacterCreated,
  onBackToMenu
}) => {
  const { createCharacter } = useCharacter();
  const [characterName, setCharacterName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [step, setStep] = useState<'class' | 'name' | 'confirm'>('class');
  const [nameError, setNameError] = useState('');

  const handleClassSelect = (characterClass: CharacterClass) => {
    setSelectedClass(characterClass);
    setStep('name');
    
    // Suggest a random name for this class
    if (!characterName) {
      const names = STARTING_NAMES[characterClass];
      const randomName = names[Math.floor(Math.random() * names.length)];
      setCharacterName(randomName);
    }
  };

  const handleNameSubmit = () => {
    const trimmedName = characterName.trim();
    
    if (!trimmedName) {
      setNameError('Please enter a character name.');
      return;
    }
    
    if (trimmedName.length < 2) {
      setNameError('Character name must be at least 2 characters long.');
      return;
    }
    
    if (trimmedName.length > 20) {
      setNameError('Character name must be 20 characters or less.');
      return;
    }
    
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      setNameError('Character name can only contain letters, spaces, hyphens, and apostrophes.');
      return;
    }

    setNameError('');
    setCharacterName(trimmedName);
    setStep('confirm');
  };

  const handleCreateCharacter = () => {
    if (!selectedClass || !characterName.trim()) return;
    
    createCharacter(characterName.trim(), selectedClass);
    onCharacterCreated();
  };

  const generateRandomName = () => {
    if (!selectedClass) return;
    
    const names = STARTING_NAMES[selectedClass];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setCharacterName(randomName);
  };

  const getClassIcon = (characterClass: CharacterClass) => {
    switch (characterClass) {
      case 'warrior':
        return <Sword className="h-8 w-8" />;
      case 'mage':
        return <Wand2 className="h-8 w-8" />;
      case 'rogue':
        return <Eye className="h-8 w-8" />;
      case 'cleric':
        return <Cross className="h-8 w-8" />;
    }
  };

  const getClassColor = (characterClass: CharacterClass) => {
    switch (characterClass) {
      case 'warrior':
        return 'border-destructive bg-destructive/20';
      case 'mage':
        return 'border-primary bg-primary/20';
      case 'rogue':
        return 'border-success bg-success/20';
      case 'cleric':
        return 'border-warning bg-warning/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToMenu}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-xl font-bold">Create Your Character</h1>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'class' ? 'bg-primary text-foreground' : 
              ['name', 'confirm'].includes(step) ? 'bg-success text-foreground' : 
              'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${
              ['name', 'confirm'].includes(step) ? 'bg-success' : 'bg-muted'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'name' ? 'bg-primary text-foreground' : 
              step === 'confirm' ? 'bg-success text-foreground' : 
              'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${
              step === 'confirm' ? 'bg-success' : 'bg-muted'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'confirm' ? 'bg-primary text-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Class Selection */}
        {step === 'class' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Choose Your Class</h2>
              <p className="text-muted-foreground">Each class has unique abilities and playstyle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(CHARACTER_CLASSES).map(([classKey, classData]) => (
                <Card 
                  key={classKey}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                    getClassColor(classKey as CharacterClass)
                  } border-2`}
                  onClick={() => handleClassSelect(classKey as CharacterClass)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4 text-foreground">
                      {getClassIcon(classKey as CharacterClass)}
                    </div>
                    <CardTitle className="text-2xl text-foreground">{classData.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground text-center">{classData.description}</p>
                    
                    {/* Starting Stats */}
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Starting Stats
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(classData.baseStats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{stat.substring(0, 3)}:</span>
                            <span className="text-foreground font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Starting Gold */}
                    <div className="flex items-center justify-center gap-2 text-warning">
                      <Coins className="h-4 w-4" />
                      <span className="font-semibold">{classData.startingGold} Gold</span>
                    </div>

                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                      Select {classData.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Name Input */}
        {step === 'name' && selectedClass && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Name Your Character</h2>
              <p className="text-muted-foreground">Choose a name for your {CHARACTER_CLASSES[selectedClass].name}</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Character Name
                  </label>
                  <Input
                    value={characterName}
                    onChange={(e) => {
                      setCharacterName(e.target.value);
                      setNameError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                    placeholder="Enter character name..."
                    className="bg-muted border-border text-foreground text-lg"
                    maxLength={20}
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateRandomName}
                      className="text-primary hover:text-blue-300"
                    >
                      🎲 Random Name
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {characterName.length}/20
                    </span>
                  </div>
                </div>

                {nameError && (
                  <Alert className="bg-destructive/20 border-destructive/40">
                    <AlertDescription className="text-red-200">
                      {nameError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('class')}
                    className="flex-1 border-border hover:bg-muted"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNameSubmit}
                    disabled={!characterName.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedClass && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Confirm Your Character</h2>
              <p className="text-muted-foreground">Review your character before starting your adventure</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4 text-primary">
                    {getClassIcon(selectedClass)}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{characterName}</h3>
                  <Badge 
                    variant="secondary" 
                    className="mt-2 bg-primary text-blue-100"
                  >
                    {CHARACTER_CLASSES[selectedClass].name}
                  </Badge>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Character Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class:</span>
                      <span className="text-foreground">{CHARACTER_CLASSES[selectedClass].name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starting Gold:</span>
                      <span className="text-warning">{CHARACTER_CLASSES[selectedClass].startingGold}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Starting Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(CHARACTER_CLASSES[selectedClass].baseStats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{stat}:</span>
                        <span className="text-foreground font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert className="bg-primary/20 border-primary/40">
                  <User className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    Your character will be saved automatically. You can continue your adventure anytime!
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('name')}
                    className="flex-1 border-border hover:bg-muted"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateCharacter}
                    className="flex-1 bg-success hover:bg-success/90"
                  >
                    Start Adventure!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
