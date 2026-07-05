/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video } from './types';

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'sintel-movie',
    title: 'Sintel: Guardian of the Dragon',
    description: 'A lone female warrior named Sintel wanders through a barren wasteland, searching for her infant dragon companion, Scales, who was snatched away by a giant beast. Her quest takes her through treacherous terrains, dusty ruins, and mystical caves in an emotional and visually breathtaking saga.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Anime',
    quality: '1080p Full HD',
    type: 'movie',
    uploadedBy: 'cinemax_studio',
    uploadedAt: '2026-06-15T12:00:00Z',
    isPublic: true,
    isTrending: true,
    isFeatured: true,
    likes: 1240,
    likedBy: [],
    views: 45209
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel: Cyberpunk Revolt',
    description: 'Set in a dystopian future in Amsterdam, a group of scientists and soldiers try to save the earth from a massive onslaught of destructive, sentient robotic drones. Their only key is to reconnect with a cybernetically enhanced woman from their past. A stunning cyberpunk action piece.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Sci-Fi',
    quality: '1080p Full HD',
    type: 'movie',
    uploadedBy: 'cinemax_studio',
    uploadedAt: '2026-06-10T14:30:00Z',
    isPublic: true,
    isTrending: true,
    isFeatured: false,
    likes: 832,
    likedBy: [],
    views: 18450
  },
  {
    id: 'bunny-comedy',
    title: 'Big Buck Bunny',
    description: 'When three mischievous rodents bully a giant, soft-hearted rabbit and crush his favorite butterfly, he decides to exact his revenge in a series of meticulously planned, hilarious cartoon traps. An absolute slapstick comedy classic with colorful characters.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Comedy',
    quality: '720p HD',
    type: 'movie',
    uploadedBy: 'cinemax_studio',
    uploadedAt: '2026-06-08T09:15:00Z',
    isPublic: true,
    isTrending: false,
    isFeatured: false,
    likes: 421,
    likedBy: [],
    views: 9840
  },
  {
    id: 'cosmic-dream',
    title: 'Elephants Dream: Mechanized Mind',
    description: 'Two characters, Proog, an older guide, and Emo, a younger skeptic, traverse a chaotic, infinite, and surreal mechanical environment, fighting their differing perceptions of reality. A complex psychological thriller that questions the bounds of technology and control.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Thriller',
    quality: '1080p Full HD',
    type: 'movie',
    uploadedBy: 'cinemax_studio',
    uploadedAt: '2026-06-05T18:00:00Z',
    isPublic: true,
    isTrending: false,
    isFeatured: false,
    likes: 219,
    likedBy: [],
    views: 5410
  },
  {
    id: 'destiny-novela-ep1',
    title: 'Amor y Venganza - Season 1: Episode 1',
    description: 'Sandro returns to the city after years in exile, carrying a secret that will change the fate of the powerful Ortega family forever. He meets Isabella, the daughter of his arch-nemesis, spark-starting a forbidden romance filled with tension, jealousy, and betrayal.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Novela',
    quality: '1080p Full HD',
    type: 'episode',
    seriesTitle: 'Amor y Venganza',
    seasonNumber: 1,
    episodeNumber: 1,
    uploadedBy: 'novela_lover',
    uploadedAt: '2026-06-20T10:00:00Z',
    isPublic: true,
    isTrending: true,
    isFeatured: false,
    likes: 934,
    likedBy: [],
    views: 22405
  },
  {
    id: 'destiny-novela-ep2',
    title: 'Amor y Venganza - Season 1: Episode 2',
    description: 'Following the shocking confrontation at the charity gala, Isabella confronts her father regarding his past sins. Meanwhile, Sandro receives an anonymous threat warning him to leave Isabella alone before his secret identity is exposed to the world.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
    category: 'Novela',
    quality: '1080p Full HD',
    type: 'episode',
    seriesTitle: 'Amor y Venganza',
    seasonNumber: 1,
    episodeNumber: 2,
    uploadedBy: 'novela_lover',
    uploadedAt: '2026-06-22T10:00:00Z',
    isPublic: true,
    isTrending: true,
    isFeatured: false,
    likes: 712,
    likedBy: [],
    views: 19300
  },
  {
    id: 'destiny-novela-ep3',
    title: 'Amor y Venganza - Season 1: Episode 3 (Pending Approval)',
    description: 'Isabella is forced to make a harrowing choice between her family honor and her feelings for Sandro. A surprising ally offers Sandro confidential files that could bring down the Ortega empire in one swift strike, but at a deadly cost.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
    category: 'Novela',
    quality: '1080p Full HD',
    type: 'episode',
    seriesTitle: 'Amor y Venganza',
    seasonNumber: 1,
    episodeNumber: 3,
    uploadedBy: 'novela_lover',
    uploadedAt: '2026-06-25T11:00:00Z',
    isPublic: false, // Pending!
    isTrending: false,
    isFeatured: false,
    likes: 0,
    likedBy: [],
    views: 0
  }
];

export const INITIAL_COMMENTS = [
  {
    id: 'c1',
    videoId: 'sintel-movie',
    username: 'dragon_rider',
    text: 'Sintel is such an emotional roller coaster. The ending gets me every single time! Truly amazing visuals and music.',
    createdAt: '2026-06-16T15:23:00Z'
  },
  {
    id: 'c2',
    videoId: 'sintel-movie',
    username: 'cgi_enthusiast',
    text: 'For an open movie made entirely with Blender, the quality is outstanding! The skin shaders and dragon animations are top-tier.',
    createdAt: '2026-06-17T08:12:00Z'
  },
  {
    id: 'c3',
    videoId: 'tears-of-steel',
    username: 'sci_fi_geek',
    text: 'Loving the cyberpunk aesthetics. Amsterdam looks amazing as a futuristic robot war zone.',
    createdAt: '2026-06-12T19:45:00Z'
  },
  {
    id: 'c4',
    videoId: 'destiny-novela-ep1',
    username: 'novela_stan',
    text: 'OMG Sandro is so handsome! I cannot wait to see how Isabella reacts when she learns his true identity. Solid first episode!',
    createdAt: '2026-06-21T02:30:00Z'
  }
];
