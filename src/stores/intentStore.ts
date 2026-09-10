import { create } from 'zustand';
import type { UIComponent, IntentType, LayoutType } from '@/lib/types/intent';

export interface IntentState {
  currentIntent: IntentType | null;
  confidence: number;
  layout: LayoutType;
  components: UIComponent[];
  isLoading: boolean;
  error: string | null;
  reasoning: string | null;
  predictedNext: string | null;
  setIntent: (intent: IntentType) => void;
  setConfidence: (score: number) => void;
  setLayout: (layout: LayoutType) => void;
  setComponents: (components: UIComponent[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setReasoning: (reasoning: string | null) => void;
  setPredictedNext: (prediction: string | null) => void;
  reset: () => void;
}

export const useIntentStore = create<IntentState>((set) => ({
  currentIntent: null,
  confidence: 0,
  layout: 'control_plane',
  components: [],
  isLoading: false,
  error: null,
  reasoning: null,
  predictedNext: null,
  setIntent: (intent) => set({ currentIntent: intent }),
  setConfidence: (score) => set({ confidence: score }),
  setLayout: (layout) => set({ layout }),
  setComponents: (components) => set({ components }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setReasoning: (reasoning) => set({ reasoning }),
  setPredictedNext: (prediction) => set({ predictedNext: prediction }),
  reset: () => set({
    currentIntent: null,
    confidence: 0,
    layout: 'control_plane',
    components: [],
    error: null,
    reasoning: null,
    predictedNext: null,
  }),
}));
