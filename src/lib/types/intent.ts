export type IntentType = 'booking' | 'research' | 'analysis' | 'creation' | 'comparison' | 'planning' | 'direct_execution';

export type LayoutType = 'control_plane' | 'form' | 'timeline' | 'comparison' | 'terminal' | 'gallery' | 'map';

export interface UserContext {
  userId?: string;
  preferences: Record<string, unknown>;
  history: string[];
  location?: string;
  dates?: { start?: string; end?: string };
  budget?: { min?: number; max?: number };
  [key: string]: unknown;
}

export type UIComponentType = 'card' | 'table' | 'chart' | 'form' | 'timeline' | 'map' | 'gallery' | 'input' | 'list';

export interface ComponentConfig {
  id: string;
  type: 'card' | 'table' | 'chart' | 'form' | 'timeline' | 'map' | 'gallery' | 'input' | 'list';
  title: string;
  data?: Record<string, unknown>;
  position?: { x: number; y: number; w: number; h: number };
  props?: Record<string, unknown>;
}

export type UIComponent = ComponentConfig;

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  layout: LayoutType;
  components: ComponentConfig[];
  context: UserContext;
  reasoning?: string;
  sources?: string[];
  predictedNext?: string;
}

export interface UIGenerationResponse {
  layout: LayoutType;
  components: ComponentConfig[];
  adaptiveTheme?: Record<string, string>;
}

export interface PredictiveSuggestion {
  id: string;
  label: string;
  confidence: number;
  action: string;
  icon?: string;
}

export interface SystemMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    confidence?: number;
    reasoning?: string;
    intent?: IntentType;
    sources?: string[];
  };
}
