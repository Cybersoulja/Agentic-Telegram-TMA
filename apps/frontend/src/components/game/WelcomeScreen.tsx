import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Plus, 
  BookOpen, 
  Sparkles, 
  Crown, 
  Users,
  Volume2,
  VolumeX,
  Info
} from 'lucide-react';
import { useAudio } from '../../lib/stores/useAudio';

/**
 * Props for the WelcomeScreen component.
 */
interface WelcomeScreenProps {
  /**
   * Callback function to be called when the user starts a new game.
   */
  onStartNewGame: () => void;
  /**
   * Callback function to be called when the user continues a saved game.
   */
  onContinueGame: () => void;
  /**
   * Whether there is a saved game to continue.
   */
  hasSavedGame: boolean;
}

/**
 * The welcome screen of the game.
 * It provides options to start a new game or continue a saved game.
 * @param {WelcomeScreenProps} props - The props for the component.
 * @returns {JSX.Element} The rendered welcome screen.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartNewGame,
  onContinueGame,
  hasSavedGame
}) => {
  const { toggleMute, isMuted } = useAudio();
  const [showFeatures, setShowFeatures] = useState(false);
  const [animatedTitle, setAnimatedTitle] = useState('');
  const fullTitle = 'Aethermoor Chronicles';

  // Typewriter effect for title
  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= fullTitle.length) {
        setAnimatedTitle(fullTitle.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Interactive Fiction",
      description: "Experience a rich, branching narrative that reacts to your choices"
    },
    {
      icon: <Crown className="h-6 w-6" />,
      title: "AI Dungeon Master",
      description: "Dynamic, Gemini-powered responses from your personal AI Dungeon Master"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Living NPCs",
      description: "Meet intelligent NPCs and allies powered by advanced AI personalities"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Character Progression",
      description: "Level up your character with meaningful choices and stat improvements"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-primary">
            {animatedTitle}
            <span className="animate-pulse">|</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            An Interactive Text-Based RPG Adventure
          </p>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Powered by Gemini AI
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Menu */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Play className="h-5 w-5" />
                  Start Your Adventure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSavedGame && (
                  <Button
                    onClick={onContinueGame}
                    size="lg"
                    className="w-full bg-success hover:bg-success/90 text-foreground text-lg py-6"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Continue Adventure
                  </Button>
                )}
                
                <Button
                  onClick={onStartNewGame}
                  size="lg"
                  variant={hasSavedGame ? "outline" : "default"}
                  className={`w-full text-lg py-6 ${
                    hasSavedGame 
                      ? "border-border hover:bg-muted" 
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Adventure
                </Button>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sound</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {isMuted ? 'Muted' : 'Enabled'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Features */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Info className="h-5 w-5" />
                  Game Features
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeatures(!showFeatures)}
                    className="ml-auto text-accent hover:text-accent/80"
                  >
                    {showFeatures ? 'Hide' : 'Show'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showFeatures && (
                <CardContent>
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="text-accent mt-1">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Story Preview */}
          <Card className="mt-8 bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="p-6">
              <div className="text-center">
                <blockquote className="text-lg italic text-muted-foreground mb-4">
                  "Welcome, brave adventurer, to the realm of Aethermoor! You stand at the entrance 
                  of the ancient town of Millbrook, where rumors speak of a dark evil stirring in 
                  the nearby Shadowlands..."
                </blockquote>
                <p className="text-sm text-muted-foreground">
                  — From the Chronicles of Aethermoor
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credits */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Built with React and Gemini AI</p>
            <p className="mt-1">© 2024 Aethermoor Chronicles - An Interactive Fiction Experience</p>
          </div>
        </div>
      </div>
    </div>
  );
};
