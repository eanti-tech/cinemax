/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Heart, Star, ChevronRight, Info, Award, Download, AlertCircle } from 'lucide-react';
import { Video } from '../types';
import CineImage from './CineImage';

interface VideoGridProps {
  key?: React.Key | string;
  title: string;
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  onOpenInfo: (video: Video) => void;
  onLikeVideo: (video: Video, e: React.MouseEvent) => void;
  userLikedVideos: string[]; // List of video IDs the current user liked
  emptyMessage?: string;
  category?: string;
  onExploreCategory?: (category: string) => void;
}

export default function VideoGrid({
  title,
  videos,
  onPlayVideo,
  onOpenInfo,
  onLikeVideo,
  userLikedVideos,
  emptyMessage = "No content available in this category yet.",
  category,
  onExploreCategory,
}: VideoGridProps): React.JSX.Element {
  
  if (videos.length === 0) {
    return (
      <div className="py-2">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2 font-sans">
          <span>{title}</span>
        </h2>
        <div className="bg-[#0c0c0c] border border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 select-none group/row">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 tracking-tight">
          <span className="bg-[#E50914] w-1.5 h-6 rounded-full inline-block mr-1"></span>
          <span>{title}</span>
          {onExploreCategory && category && (
            <button
              id={`explore-all-${category.toLowerCase()}`}
              onClick={() => onExploreCategory(category)}
              className="text-xs text-zinc-500 font-normal pl-2 hover:text-[#E50914] transition-colors cursor-pointer flex items-center bg-transparent border-none outline-none"
            >
              Explore All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          )}
        </h2>
        <span className="text-xs text-zinc-500 font-mono">{videos.length} titles</span>
      </div>

      {/* Horizontally Scrollable Content Area */}
      <div className="relative">
        <div className="flex overflow-x-auto space-x-2 sm:space-x-4 pb-4 pt-1 scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-zinc-800 scroll-smooth snap-x">
          {videos.map((video) => {
            const hasLiked = userLikedVideos.includes(video.id);
            return (
              <div
                id={`video-card-${video.id}`}
                key={video.id}
                className="flex-none w-[calc((100%-0.5rem)/2)] min-[480px]:w-[calc((100%-1rem)/3)] md:w-72 bg-[#0c0c0c] border border-white/5 rounded-lg overflow-hidden snap-start hover:border-white/20 transition-all duration-300 group/card relative"
              >
                {/* Poster / Thumbnail wrapper */}
                <div className="relative aspect-video w-full overflow-hidden cursor-pointer" onClick={() => onOpenInfo(video)}>
                  <CineImage
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Quality overlay */}
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex gap-1 z-20">
                    <span className="bg-[#050505]/90 backdrop-blur-md text-[7px] sm:text-[9px] font-bold text-green-400 font-mono px-1 sm:px-2 py-0.5 rounded border border-white/10 shadow">
                      {video.quality}
                    </span>
                    {video.type === 'episode' && (
                      <span className="bg-[#E50914] backdrop-blur-md text-[7px] sm:text-[9px] font-extrabold text-white px-1 sm:px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                        EP {video.episodeNumber}
                      </span>
                    )}
                  </div>

                  {/* Dark transparent gradient cover on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-1.5 sm:space-x-3 z-10">
                    <button
                      id={`play-hover-${video.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVideo(video);
                      }}
                      className="bg-white hover:bg-[#E50914] hover:text-white text-black rounded-full h-6 w-6 sm:h-11 sm:w-11 flex items-center justify-center shadow-lg transform active:scale-90 transition-all duration-200 cursor-pointer"
                      title="Play Content"
                    >
                      <Play className="h-3 w-3 sm:h-5 sm:w-5 fill-current ml-0.5" />
                    </button>
                    <button
                      id={`info-hover-${video.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInfo(video);
                      }}
                      className="bg-zinc-900/90 hover:bg-zinc-850 hover:text-white text-zinc-350 rounded-full h-6 w-6 sm:h-11 sm:w-11 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                      title="More Info"
                    >
                      <Info className="h-3 w-3 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                {/* Video Info Section */}
                <div className="p-1.5 sm:p-3.5 space-y-0.5 sm:space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <h3 
                      id={`title-${video.id}`}
                      className="font-bold text-[10px] sm:text-sm text-zinc-100 hover:text-[#E50914] transition-colors line-clamp-1 cursor-pointer"
                      onClick={() => onOpenInfo(video)}
                    >
                      {video.title}
                    </h3>
                    
                    {/* Inline Like Interaction */}
                    <button
                      id={`like-btn-${video.id}`}
                      onClick={(e) => onLikeVideo(video, e)}
                      className={`flex items-center space-x-0.5 sm:space-x-1 p-0.5 rounded hover:bg-white/5 transition-all cursor-pointer ${
                        hasLiked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title={hasLiked ? 'Unlike' : 'Like Video'}
                    >
                      <Heart className={`h-2.5 w-2.5 sm:h-4 sm:w-4 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-[7px] sm:text-[10px] font-mono font-bold">{video.likes}</span>
                    </button>
                  </div>

                  {/* Mini Tags */}
                  <div className="flex items-center flex-wrap gap-1 text-[8px] sm:text-[10px] text-zinc-400">
                    <span className="text-zinc-300 font-semibold truncate max-w-[35px] sm:max-w-none">{video.category}</span>
                    <span className="text-[7px] text-zinc-600 sm:text-zinc-400">•</span>
                    <span className="truncate max-w-[35px] sm:max-w-none">@{video.uploadedBy}</span>
                  </div>

                  {/* Description mini snippet */}
                  <p className="text-zinc-500 text-[8px] sm:text-[11px] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
