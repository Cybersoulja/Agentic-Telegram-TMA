import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Loader2, Crown } from 'lucide-react';

/**
 * Props for the StoryDisplay component.
 */
interface StoryDisplayProps {
  /**
   * The current story text to display.
   */
  currentText: string;
  /**
   * Whether the story is currently loading.
   */
  isLoading: boolean;
  /**
   * The Dungeon Master's response to the player's actions.
   */
  dmResponse?: string;
  /**
   * Whether the Dungeon Master is currently thinking.
   */
  isThinking?: boolean;
}

/**
 * A component that displays the story text and Dungeon Master responses.
 * @param {StoryDisplayProps} props - The props for the component.
 * @returns {JSX.Element} The rendered story display.
 */
export const StoryDisplay: React.FC<StoryDisplayProps> = ({
  currentText,
  isLoading,
  dmResponse,
  isThinking
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentText, dmResponse]);

  const formatText = (text: string) => {
    // Simple text formatting for better readability
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n/g, '<br />'); // Line breaks
  };

  return (
    <Card className="bg-card border-border h-96">
      <CardContent className="p-0">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-6 space-y-4"
        >
          {/* Main Story Text */}
          {currentText && (
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(currentText) }}
              />
            </div>
          )}

          {/* DM Response */}
          {dmResponse && (
            <div className="bg-muted rounded-lg p-4 border-l-4 border-accent">
              <div className="flex items-start gap-2">
                <Crown className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-accent font-semibold text-sm mb-1">
                    AI Dungeon Master
                  </div>
                  <div 
                    className="text-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatText(dmResponse) }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="bg-muted rounded-lg p-4 border-l-4 border-accent">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                <div className="text-accent font-semibold text-sm">
                  AI Dungeon Master
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </div>
              <div className="text-muted-foreground text-sm mt-1">
                The Dungeon Master is considering your actions...
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading story...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentText && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your adventure awaits...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
