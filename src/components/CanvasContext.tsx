import { createContext, useContext } from 'react';

interface CanvasContextType {
  onSuggestedQuestionSelect?: (question: string, position: { x: number; y: number }, sourceChartId: string) => void;
  onPromptSubmit?: (prompt: string, position: { x: number; y: number }, promptId?: string) => void;
  selectedChartIds: string[];
  onChartSelect?: (chartId: string, isSelected: boolean) => void;
  onGenerateSlackCanvas?: (chartIds: string[]) => void;
  highlightedChartIds: string[];
}

const CanvasContext = createContext<CanvasContextType>({
  selectedChartIds: [],
  highlightedChartIds: [],
});

export const useCanvasContext = () => useContext(CanvasContext);
export const CanvasProvider = CanvasContext.Provider;