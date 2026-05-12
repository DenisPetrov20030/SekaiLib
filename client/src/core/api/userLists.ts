import { apiClient } from './client';

export interface UserListDto {
  id: string;
  name: string;
  userId: string;
  description?: string | null;
  titlesCount: number;
  createdAt: string;
  titles: Array<{
    id: string;
    name: string;
    author: string;
    coverImageUrl?: string;
    status: number;
  }>;
}

export const userListsApi = {
  getMyLists: async (): Promise<UserListDto[]> => {
    const response = await apiClient.get<UserListDto[]>('/userlists');
    return response.data;
  },

  getListsByUser: async (userId: string): Promise<UserListDto[]> => {
    const response = await apiClient.get<UserListDto[]>(`/userlists/by-user/${userId}`);
    return response.data;
  },

  getListById: async (id: string): Promise<UserListDto> => {
    const response = await apiClient.get<UserListDto>(`/userlists/${id}`);
    return response.data;
  },

  createList: async (name: string): Promise<void> => {
    await apiClient.post('/userlists', name);
  },

  updateList: async (id: string, name: string): Promise<void> => {
    await apiClient.put(`/userlists/${id}`, { name });
  },

  deleteList: async (id: string): Promise<void> => {
    await apiClient.delete(`/userlists/${id}`);
  },
};
