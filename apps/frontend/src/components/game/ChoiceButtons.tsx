import React from 'react';
import { Button } from '../ui/button';
import type { StoryChoice } from '../../types/game';
import { ChevronRight, Loader2 } from 'lucide-react';

/**
 * Props for the ChoiceButtons component.
 */
interface ChoiceButtonsProps {
  /**
   * An array of choices to be displayed.
   */
  choices: StoryChoice[];
  /**
   * Callback function to be called when a choice is made.
   */
  onChoice: (choiceIndex: number) => void;
  /**
   * Whether the buttons should be disabled.
   */
  disabled?: boolean;
}

/**
 * A component that displays a list of choices as buttons.
 * @param {ChoiceButtonsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered choice buttons.
 */
export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  choices,
  onChoice,
  disabled = false
}) => {
  if (choices.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">
          {disabled ? 'Processing...' : 'No choices available at this time.'}
        </p>
      </div>
    );
  }

  const getChoiceIcon = (choice: StoryChoice) => {
    const text = choice.text.toLowerCase();
    
    if (text.includes('attack') || text.includes('fight') || text.includes('combat')) {
      return '⚔️';
    } else if (text.includes('talk') || text.includes('speak') || text.includes('ask')) {
      return '💬';
    } else if (text.includes('explore') || text.includes('search') || text.includes('investigate')) {
      return '🔍';
    } else if (text.includes('help') || text.includes('heal') || text.includes('assist')) {
      return '❤️';
    } else if (text.includes('magic') || text.includes('spell') || text.includes('cast')) {
      return '✨';
    } else if (text.includes('run') || text.includes('flee') || text.includes('escape')) {
      return '🏃';
    }
    
    return null;
  };

  const getChoiceVariant = (choice: StoryChoice) => {
    const text = choice.text.toLowerCase();
    
    if (text.includes('attack') || text.includes('fight')) {
      return 'destructive';
    } else if (text.includes('help') || text.includes('heal')) {
      return 'default';
    } else if (text.includes('run') || text.includes('flee')) {
      return 'secondary';
    }
    
    return 'outline';
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-primary mb-2 sm:mb-4">Choose your action:</h3>
      
      <div className="grid gap-2">
        {choices.map((choice, index) => {
          const icon = getChoiceIcon(choice);
          const variant = getChoiceVariant(choice) as any;
          
          return (
            <Button
              key={index}
              variant={variant}
              size="lg"
              onClick={() => onChoice(index)}
              disabled={disabled}
              className="w-full justify-between text-left h-auto p-3 sm:p-4 bg-card border-border hover:bg-muted hover:border-border transition-all duration-200 min-h-[3rem] touch-manipulation"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {icon && <span className="text-base sm:text-lg">{icon}</span>}
                <span className="text-xs sm:text-sm leading-relaxed">{choice.text}</span>
              </div>
              
              {disabled ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              )}
            </Button>
          );
        })}
      </div>

      {disabled && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Please wait while your choice is processed...
          </p>
        </div>
      )}
    </div>
  );
};
