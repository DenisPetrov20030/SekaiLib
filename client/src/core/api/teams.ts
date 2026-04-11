import { apiClient } from './client';
import type {
  TranslationTeamDto,
  TeamMemberDto,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddMemberRequest,
  TeamChaptersResponse,
  SubscribedTeamChapterDto,
} from '../types/dtos';
import { TeamMemberRole } from '../types/dtos';

export const teamsApi = {
  getMyTeams: async (canAddChapters = false): Promise<TranslationTeamDto[]> => {
    const response = await apiClient.get<TranslationTeamDto[]>('/teams/my', {
      params: canAddChapters ? { canAddChapters: true } : undefined,
    });
    return response.data;
  },

  getAll: async (): Promise<TranslationTeamDto[]> => {
    const response = await apiClient.get<TranslationTeamDto[]>('/teams');
    return response.data;
  },

  getById: async (teamId: string): Promise<TranslationTeamDto> => {
    const response = await apiClient.get<TranslationTeamDto>(`/teams/${teamId}`);
    return response.data;
  },

  create: async (data: CreateTeamRequest): Promise<TranslationTeamDto> => {
    const response = await apiClient.post<TranslationTeamDto>('/teams', data);
    return response.data;
  },

  update: async (teamId: string, data: UpdateTeamRequest): Promise<TranslationTeamDto> => {
    const response = await apiClient.put<TranslationTeamDto>(`/teams/${teamId}`, data);
    return response.data;
  },

  uploadAvatar: async (teamId: string, file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<{ avatarUrl: string }>(`/teams/${teamId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadCover: async (teamId: string, file: File): Promise<{ coverImageUrl: string }> => {
    const formData = new FormData();
    formData.append('cover', file);

    const response = await apiClient.post<{ coverImageUrl: string }>(`/teams/${teamId}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  delete: async (teamId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
  },

  getMembers: async (teamId: string): Promise<TeamMemberDto[]> => {
    const response = await apiClient.get<TeamMemberDto[]>(`/teams/${teamId}/members`);
    return response.data;
  },

  addMember: async (teamId: string, data: AddMemberRequest): Promise<TeamMemberDto> => {
    const response = await apiClient.post<TeamMemberDto>(`/teams/${teamId}/members`, data);
    return response.data;
  },

  removeMember: async (teamId: string, targetUserId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${targetUserId}`);
  },

  updateMemberRole: async (teamId: string, targetUserId: string, role: TeamMemberRole): Promise<TeamMemberDto> => {
    const response = await apiClient.put<TeamMemberDto>(`/teams/${teamId}/members/${targetUserId}/role`, { role });
    return response.data;
  },

  subscribe: async (teamId: string): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/subscribe`);
  },

  unsubscribe: async (teamId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/subscribe`);
  },

  isSubscribed: async (teamId: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/teams/${teamId}/subscribed`);
    return response.data;
  },

  getSubscribedChapters: async (count = 20): Promise<SubscribedTeamChapterDto[]> => {
    const response = await apiClient.get<SubscribedTeamChapterDto[]>('/teams/subscribed/chapters', {
      params: { count },
    });
    return response.data;
  },

  getChapters: async (teamId: string, page = 1, pageSize = 15): Promise<TeamChaptersResponse> => {
    const response = await apiClient.get<TeamChaptersResponse>(`/teams/${teamId}/chapters`, {
      params: { page, pageSize },
    });
    return response.data;
  },
};
