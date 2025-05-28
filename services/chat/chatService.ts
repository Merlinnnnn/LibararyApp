import api from '../config/axios';
import { getApiUrl } from '../config/api.config';
import { handleAPIResponse } from '../api';

// Types
export interface QuickReply {
  text: string;
  payload: string;
}

export interface CardButton {
  type: 'POST' | 'GET';
  text: string;
  payload: string;
  url: string;
}

export interface Card {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttons: CardButton[];
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  quickReplies?: QuickReply[];
  options?: string[];
  cards?: Card[];
}

export interface ChatResponse {
  code: number;
  success: boolean;
  message: string;
  data: {
    reply: string;
    quickReplies: QuickReply[] | null;
    cards: Card[] | null;
    suggestions: string[] | null;
    customData: any;
    error: any;
  };
}

export interface BookDetails {
  documentId: number;
  documentName: string;
  author: string;
  publisher: string;
  description: string;
  coverImage: string | null;
  quantity: number;
}

// Chat API
export const chatAPI = {
  // Send message to chatbot
  sendMessage: async (message: string, sessionId: string, payload?: any) => {
    let body;
    if (payload) {
      body = payload;
    } else {
      body = {
        message,
        sessionId
      };
    }
    return handleAPIResponse(
      api.post<ChatResponse>(getApiUrl('/api/chat'), body)
    );
  },

  // Get book details
  getBookDetails: async (id: string) => {
    return handleAPIResponse(
      api.get<{ data: BookDetails }>(getApiUrl(`/api/v1/documents/${id}`))
    );
  },
}; 