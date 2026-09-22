import api from './api';
import type { AIChatResponse } from '../types/ai';

const aiService = {
  async chat(message: string): Promise<string> {
    const response = await api.post<AIChatResponse>('/ai/chat', {
      message,
    });

    const data = response.data;

    if (typeof data.reply === 'string') {
      return data.reply;
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (typeof data.response === 'string') {
      return data.response;
    }

    if (typeof data.answer === 'string') {
      return data.answer;
    }

    return 'The AI returned a response, but the message format was not recognized.';
  },
};

export default aiService;
