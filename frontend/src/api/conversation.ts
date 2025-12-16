const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export const conversationApi = {
  // Get all conversations (requires auth)
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch conversations');
    }

    return result.data;
  },

  // Create new conversation (requires auth)
  async createConversation(title: string): Promise<Conversation> {
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ title }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create conversation');
    }

    return result.data;
  },

  // Get messages in a conversation (requires auth)
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch messages');
    }

    return result.data;
  },

  // Send message (requires auth)
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message');
    }

    return result.data;
  },
};
