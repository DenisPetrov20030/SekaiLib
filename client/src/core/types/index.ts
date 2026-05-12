export * from './entities';
export * from './enums';
export * from './dtos';
export * from './api';
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  gender: import('./enums').Gender;
  aboutMe?: string | null;
  notifyListStatuses?: number[];
  notifyUserListIds?: string[];
  notifyTitleCompleted?: boolean;
  notifyFriendRequests?: boolean;
  profileVisibility?: number;
  blockedGenres?: string[];
}