/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
  quality: string;
  type: 'movie' | 'episode';
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  uploadedBy: string; // username of uploader
  uploadedAt: string;
  isPublic: boolean; // Admin approved status
  isTrending: boolean; // Admin trending choice
  isFeatured: boolean; // Admin featured choice for top hero section
  likes: number;
  likedBy: string[]; // List of usernames who liked it
  views: number;
}

export interface UserProfile {
  username: string;
  createdAt: string;
  role?: 'admin' | 'user';
}

export interface Comment {
  id: string;
  videoId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface DownloadItem {
  videoId: string;
  downloadedAt: string;
  videoTitle: string;
  thumbnailUrl: string;
  quality: string;
  status?: 'completed' | 'downloading' | 'paused' | 'queued';
  progress?: number; // 0 to 100
  size?: string; // e.g. "124 MB"
}

export type Category = 'Action' | 'Anime' | 'Novela' | 'Sci-Fi' | 'Comedy' | 'Drama' | 'Thriller';

export const CATEGORIES: Category[] = [
  'Action',
  'Anime',
  'Novela',
  'Sci-Fi',
  'Comedy',
  'Drama',
  'Thriller'
];
