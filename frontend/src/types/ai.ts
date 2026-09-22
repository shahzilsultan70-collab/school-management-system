export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply?: string;
  message?: string;
  [key: string]: unknown;
}
