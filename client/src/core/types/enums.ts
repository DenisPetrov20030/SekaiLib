export const UserRole = {
  User: 0,
  Moderator: 1,
  Administrator: 2,
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const ReadingStatus = {
  Reading: 0,
  Planned: 1,
  Completed: 2,
  Dropped: 3,
  Favorite: 4,
} as const;

export type ReadingStatus = typeof ReadingStatus[keyof typeof ReadingStatus];

export const TitleStatus = {
  Ongoing: 0,
  Completed: 1,
  Hiatus: 2,
  Cancelled: 3,
} as const;

export type TitleStatus = typeof TitleStatus[keyof typeof TitleStatus];

export const ReactionType = {
  Like: 0,
  Dislike: 1,
} as const;

export type ReactionType = typeof ReactionType[keyof typeof ReactionType];

export const ReaderTheme = {
  Light: 'light',
  Dark: 'dark',
  Sepia: 'sepia',
} as const;

export type ReaderTheme = typeof ReaderTheme[keyof typeof ReaderTheme];

export const ReaderFontSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const;

export type ReaderFontSize = typeof ReaderFontSize[keyof typeof ReaderFontSize];

export const ReaderWidth = {
  Narrow: 'narrow',
  Medium: 'medium',
  Wide: 'wide',
} as const;

export type ReaderWidth = typeof ReaderWidth[keyof typeof ReaderWidth];
