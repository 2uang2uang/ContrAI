export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  data?: any;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

export interface ReputationData {
  score?: number;
  identity?: any;
  governance?: any;
  staking?: any;
  [key: string]: any;
}
