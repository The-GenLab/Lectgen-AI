import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies for authentication
});

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE';
  contentText: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  transcript: string | null;
  styleAnalysis: object | null;
  pdfUrl: string | null;
  slideCount: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE';
  contentText?: string;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  styleAnalysis?: object;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    userMessage: Message;
    assistantMessage: Message;
  };
  message: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
  };
}

/**
 * Send a message and get AI response
 */
export const sendMessage = async (request: SendMessageRequest): Promise<SendMessageResponse> => {
  const response = await api.post<SendMessageResponse>('/chat/send', request);
  return response.data;
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await api.get<GetMessagesResponse>(`/chat/conversations/${conversationId}/messages`);
  return response.data.data.messages;
};

/**
 * Get all conversations
 */
export const getConversations = async (limit = 50, offset = 0) => {
  const response = await api.get(`/conversations`, {
    params: { limit, offset },
  });
  return response.data;
};

