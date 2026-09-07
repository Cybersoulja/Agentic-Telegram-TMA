/**
 * Zustand store for managing the story engine.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CustomStoryEngine } from '../customStoryEngine';
import type { StoryChoice, StorySegment } from '../../types/game';

interface StoryState {
  storyEngine: CustomStoryEngine;
  currentText: string;
  currentChoices: StoryChoice[];
  storyHistory: string[];
  isLoading: boolean;
  
  // Actions
  initializeStory: () => void;
  continueStory: () => void;
  makeChoice: (choiceIndex: number) => void;
  getCurrentSegment: () => StorySegment;
  resetStory: () => void;
  setVariable: (name: string, value: any) => void;
  getVariable: (name: string) => any;
  saveProgress: () => void;
  loadProgress: () => void;
}

export const useStoryEngine = create<StoryState>()(
  subscribeWithSelector((set, get) => ({
    storyEngine: new CustomStoryEngine(),
    currentText: '',
    currentChoices: [],
    storyHistory: [],
    isLoading: false,

    initializeStory: () => {
      const { storyEngine } = get();
      set({ isLoading: true });
      
      try {
        const text = storyEngine.getCurrentText();
        const choices = storyEngine.getCurrentChoices();
        
        set({
          currentText: text,
          currentChoices: choices,
          storyHistory: [text],
          isLoading: false
        });
        
        console.log('Story initialized');
      } catch (error) {
        console.error('Failed to initialize story:', error);
        set({ isLoading: false });
      }
    },

    continueStory: () => {
      const { storyEngine, storyHistory } = get();
      
      if (storyEngine.canContinue()) {
        const text = storyEngine.getCurrentText();
        const choices = storyEngine.getCurrentChoices();
        
        set({
          currentText: text,
          currentChoices: choices,
          storyHistory: [...storyHistory, text]
        });
      }
    },

    makeChoice: (choiceIndex: number) => {
      const { storyEngine, currentChoices, storyHistory } = get();
      
      if (choiceIndex >= 0 && choiceIndex < currentChoices.length) {
        const choice = currentChoices[choiceIndex];
        
        // Add choice to history
        const choiceText = `> ${choice.text}`;
        const updatedHistory = [...storyHistory, choiceText];
        
        // Make the choice in the story engine
        storyEngine.makeChoice(choiceIndex);
        
        // Get the next text
        const newText = storyEngine.getCurrentText();
        const newChoices = storyEngine.getCurrentChoices();
        
        set({
          currentText: newText,
          currentChoices: newChoices,
          storyHistory: [...updatedHistory, newText]
        });
        
        console.log('Choice made:', choice.text);
      }
    },

    getCurrentSegment: () => {
      const { currentText, currentChoices, storyEngine } = get();
      
      return {
        text: currentText,
        choices: currentChoices,
        tags: storyEngine.getTags(),
        variables: {} // Could be expanded to include relevant variables
      };
    },

    resetStory: () => {
      const { storyEngine } = get();
      storyEngine.resetStory();
      
      const text = storyEngine.getCurrentText();
      const choices = storyEngine.getCurrentChoices();
      
      set({
        currentText: text,
        currentChoices: choices,
        storyHistory: [text]
      });
      
      console.log('Story reset');
    },

    setVariable: (name: string, value: any) => {
      const { storyEngine } = get();
      storyEngine.setVariable(name, value);
      console.log(`Story variable set: ${name} = ${value}`);
    },

    getVariable: (name: string) => {
      const { storyEngine } = get();
      return storyEngine.getVariable(name);
    },

    saveProgress: () => {
      const { storyEngine } = get();
      storyEngine.saveProgress();
      console.log('Story progress saved');
    },

    loadProgress: () => {
      const { storyEngine } = get();
      storyEngine.loadProgress();
      
      const text = storyEngine.getCurrentText();
      const choices = storyEngine.getCurrentChoices();
      
      set({
        currentText: text,
        currentChoices: choices,
        storyHistory: [text] // Could be expanded to save/load full history
      });
      
      console.log('Story progress loaded');
    }
  }))
);
