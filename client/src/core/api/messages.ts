import { apiClient } from './client';
import type { ConversationDto, MessageDto, SendMessageRequest } from '../types/dtos';

export const messagesApi = {
  getConversations: async () => {
    const res = await apiClient.get<ConversationDto[]>('/messages/conversations');
    return res.data;
  },
  getConversationMessages: async (conversationId: string, skip = 0, take = 50) => {
    const res = await apiClient.get<MessageDto[]>(`/messages/conversations/${conversationId}/messages`, { params: { skip, take } });
    return res.data;
  },
  sendToUser: async (recipientId: string, text: string) => {
    const payload: SendMessageRequest = { text };
    const res = await apiClient.post<MessageDto>(`/messages/to/${recipientId}`, payload);
    return res.data;
  },
  sendInConversation: async (conversationId: string, text: string) => {
    const payload: SendMessageRequest = { text };
    const res = await apiClient.post<MessageDto>(`/messages/conversations/${conversationId}/messages`, payload);
    return res.data;
  },
  markRead: async (conversationId: string) => {
    await apiClient.post<void>(`/messages/conversations/${conversationId}/read`);
  },
  deleteConversation: async (conversationId: string) => {
    await apiClient.delete<void>(`/messages/conversations/${conversationId}`);
  },
  deleteMessage: async (messageId: string) => {
    await apiClient.delete<void>(`/messages/messages/${messageId}`);
  },
  editMessage: async (messageId: string, text: string) => {
    const res = await apiClient.put<MessageDto>(`/messages/messages/${messageId}`, { text });
    return res.data;
  },
};
