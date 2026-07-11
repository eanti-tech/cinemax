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
  subtitles?: string; // Raw subtitle file contents
  subtitleName?: string; // Subtitle filename
}

export type StarType = 'none' | 'gold' | 'purple' | 'blue' | 'green' | 'orange';

export interface UserProfile {
  username: string;
  createdAt: string;
  role?: 'admin' | 'user';
  star?: StarType; // Custom award star
  viewsCount?: number; // Views count for Silver star
  isDiamond?: boolean; // Diamond star issued only by admin
  pinCode?: string; // Optional 4-digit PIN for account protection
}

export interface UserStarStatus {
  isDiamond: boolean;
  isGold: boolean;
  isSilver: boolean;
  isBronze: boolean;
  isWood: boolean;
}

export function getTopUploaders(profiles: UserProfile[], videos: Video[]): string[] {
  const counts: Record<string, number> = {};
  // Count approved uploads per user
  videos.forEach(v => {
    if (v.isPublic && v.uploadedBy) {
      counts[v.uploadedBy] = (counts[v.uploadedBy] || 0) + 1;
    }
  });
  
  return Object.keys(counts)
    .filter(u => counts[u] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 10);
}

export function getTopViewers(profiles: UserProfile[]): string[] {
  return [...profiles]
    .filter(p => (p.viewsCount || 0) > 0)
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 50)
    .map(p => p.username);
}

export function getTopCommenters(profiles: UserProfile[], comments: Comment[]): string[] {
  const counts: Record<string, number> = {};
  comments.forEach(c => {
    if (c.username) {
      counts[c.username] = (counts[c.username] || 0) + 1;
    }
  });

  return Object.keys(counts)
    .filter(u => counts[u] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 20);
}

export function getUserStarStatus(
  username: string,
  profiles: UserProfile[],
  videos: Video[],
  comments: Comment[]
): UserStarStatus {
  const cleanUsername = username.trim().toLowerCase();
  const profile = profiles.find(p => p.username.trim().toLowerCase() === cleanUsername);
  
  const isDiamond = !!(profile?.isDiamond);
  
  const topUploaders = getTopUploaders(profiles, videos).map(u => u.trim().toLowerCase());
  const isGold = topUploaders.includes(cleanUsername);

  const topViewers = getTopViewers(profiles).map(u => u.trim().toLowerCase());
  const isSilver = topViewers.includes(cleanUsername);

  const topCommenters = getTopCommenters(profiles, comments).map(u => u.trim().toLowerCase());
  const isBronze = topCommenters.includes(cleanUsername);

  return {
    isDiamond,
    isGold,
    isSilver,
    isBronze,
    isWood: true, // Everyone gets the Wood star by default!
  };
}

export function getStarDetails(starType: StarType | undefined) {
  switch (starType) {
    case 'gold':
      return { color: 'text-amber-400', label: 'Top Contributor', icon: '🌟', bg: 'bg-amber-950/30 border-amber-500/30' };
    case 'purple':
      return { color: 'text-purple-400', label: 'Cinemania Legend', icon: '💜', bg: 'bg-purple-950/30 border-purple-500/30' };
    case 'blue':
      return { color: 'text-blue-400', label: 'VIP Critic', icon: '💙', bg: 'bg-blue-950/30 border-blue-500/30' };
    case 'green':
      return { color: 'text-emerald-400', label: 'Beta Pioneer', icon: '💚', bg: 'bg-emerald-950/30 border-emerald-500/30' };
    case 'orange':
      return { color: 'text-orange-400', label: 'Rising Talent', icon: '🧡', bg: 'bg-orange-950/30 border-orange-500/30' };
    default:
      return null;
  }
}

export function getStarEmoji(starType: StarType | undefined): string {
  switch (starType) {
    case 'gold': return '🌟';
    case 'purple': return '💜';
    case 'blue': return '💙';
    case 'green': return '💚';
    case 'orange': return '🧡';
    default: return '';
  }
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

export function convertSrtToVtt(srtText: string): string {
  if (srtText.trim().startsWith('WEBVTT')) {
    return srtText;
  }
  
  let vtt = 'WEBVTT\n\n' + srtText;
  
  // Replace SRT index numbers that are standing on their own line
  vtt = vtt.replace(/^\d+$/gm, '');
  
  // Replace time separator commas with periods
  // SRT: 00:01:20,000 --> 00:01:23,000
  // VTT: 00:01:20.000 --> 00:01:23.000
  vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  
  return vtt;
}
