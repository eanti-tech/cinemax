/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Play, Heart, Info, ArrowLeft, Filter, ArrowUpDown, Film, Tv, LayoutGrid, Calendar, Eye } from 'lucide-react';
import { Video, UserProfile, Comment } from '../types';
import CineImage from './CineImage';

interface CategoryExploreProps {
  category: string;
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  onOpenInfo: (video: Video) => void;
  onLikeVideo: (video: Video, e: React.MouseEvent) => void;
  userLikedVideos: string[];
  onBack: () => void;
  profiles?: UserProfile[];
  comments?: Comment[];
  allVideos?: Video[];
}

type SortType = 'recent' | 'views' | 'likes' | 'title';
type FormatFilter = 'all' | 'movie' | 'episode';

export default function CategoryExplore({
  category,
  videos,
  onPlayVideo,
  onOpenInfo,
  onLikeVideo,
  userLikedVideos,
  onBack,
  profiles = [],
  comments = [],
  allVideos = [],
}: CategoryExploreProps): React.JSX.Element {
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [format, setFormat] = useState<FormatFilter>('all');

  // Process sorting & filtering
  const processedVideos = useMemo(() => {
    // 1. Filter by format (all / movie / episode)
    let list = videos;
    if (format !== 'all') {
      list = list.filter((v) => v.type === format);
    }

    // 2. Sort results
    const sorted = [...list];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } else if (sortBy === 'views') {
      sorted.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'likes') {
      sorted.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [videos, sortBy, format]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 space-y-8 select-none animate-in fade-in duration-300">
      
      {/* Navigation and Title Banner */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
        <div>
          <button
            id="back-to-catalog-btn"
            onClick={onBack}
            className="group flex items-center text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="bg-[#E50914] w-2 h-7 rounded-full inline-block"></span>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                {category} Collection
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Browse, filter, and sequence all available {category.toLowerCase()} cinematic content on the stream.
            </p>
          </div>
          
          <div className="text-xs text-zinc-500 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span>{processedVideos.length} / {videos.length} matching titles</span>
          </div>
        </div>
      </div>

      {/* Sorting & Format Filtering HUD */}
      <div className="bg-[#0c0c0c] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Format selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center mr-2">
            <Filter className="h-3.5 w-3.5 mr-1 text-[#E50914]" />
            <span>Format:</span>
          </span>

          <button
            id="filter-format-all"
            onClick={() => setFormat('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              format === 'all'
                ? 'bg-red-950/20 text-red-400 border-[#E50914]/40 shadow'
                : 'bg-white/5 text-zinc-400 border-transparent hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All Formats</span>
          </button>

          <button
            id="filter-format-movie"
            onClick={() => setFormat('movie')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              format === 'movie'
                ? 'bg-red-950/20 text-red-400 border-[#E50914]/40 shadow'
                : 'bg-white/5 text-zinc-400 border-transparent hover:text-white hover:bg-white/10'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Feature Films</span>
          </button>

          <button
            id="filter-format-episode"
            onClick={() => setFormat('episode')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border ${
              format === 'episode'
                ? 'bg-red-950/20 text-red-400 border-[#E50914]/40 shadow'
                : 'bg-white/5 text-zinc-400 border-transparent hover:text-white hover:bg-white/10'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Series / Episodes</span>
          </button>
        </div>

        {/* Sorters selection */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center mr-2">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-[#E50914]" />
            <span>Sort By:</span>
          </span>

          <select
            id="explore-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
          >
            <option value="recent" className="bg-zinc-950 text-white">Recently Uploaded</option>
            <option value="views" className="bg-zinc-950 text-white">Most Viewed</option>
            <option value="likes" className="bg-zinc-950 text-white">Most Appreciated / Liked</option>
            <option value="title" className="bg-zinc-950 text-white">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid List area */}
      {processedVideos.length === 0 ? (
        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-24 text-center max-w-xl mx-auto space-y-3.5 shadow-xl">
          <Film className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-300">No matching titles</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            We currently don't have any entries listed under this specific format or sorting scope yet. Modify the format selector above or upload your own.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
          {processedVideos.map((video) => {
            const hasLiked = userLikedVideos.includes(video.id);
            return (
              <div
                id={`explore-card-${video.id}`}
                key={video.id}
                className="bg-[#0c0c0c] border border-white/5 rounded-lg overflow-hidden hover:border-white/20 transition-all duration-300 group/card relative flex flex-col justify-between shadow-lg"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden cursor-pointer" onClick={() => onOpenInfo(video)}>
                  <CineImage
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Quality & Ep badges */}
                  <div className="absolute top-1 left-1 sm:top-2.5 sm:left-2.5 flex gap-1 z-20">
                    <span className="bg-[#050505]/95 backdrop-blur-md text-[7px] sm:text-[9px] font-bold text-green-400 font-mono px-1 sm:px-2 py-0.5 rounded border border-white/10 shadow">
                      {video.quality}
                    </span>
                    {video.type === 'episode' && (
                      <span className="bg-[#E50914] backdrop-blur-md text-[7px] sm:text-[9px] font-extrabold text-white px-1 sm:px-2 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                        EP {video.episodeNumber}
                      </span>
                    )}
                  </div>
 
                  {/* Views overlay badge */}
                  <div className="absolute bottom-1 left-1 sm:bottom-2.5 sm:left-2.5 bg-black/75 backdrop-blur-md text-[7px] sm:text-[9px] font-medium text-zinc-300 px-1 sm:px-1.5 py-0.5 rounded flex items-center space-x-1 border border-white/5">
                    <Eye className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    <span>{video.views} views</span>
                  </div>
 
                  {/* Hover visual buttons */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-1.5 sm:space-x-3 z-10">
                    <button
                      id={`explore-play-hover-${video.id}`}
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
                      id={`explore-info-hover-${video.id}`}
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
 
                {/* Details info block */}
                <div className="p-1.5 sm:p-4 flex-grow flex flex-col justify-between space-y-1 sm:space-y-3 bg-[#0c0c0c]">
                  <div className="space-y-0.5 sm:space-y-1.5">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <h3
                        id={`explore-title-${video.id}`}
                        className="font-bold text-[10px] sm:text-sm text-zinc-100 hover:text-[#E50914] transition-colors line-clamp-1 cursor-pointer"
                        onClick={() => onOpenInfo(video)}
                      >
                        {video.title}
                      </h3>
                      
                      {/* Inline Like Interaction */}
                      <button
                        id={`explore-like-btn-${video.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeVideo(video, e);
                        }}
                        className={`flex items-center space-x-0.5 sm:space-x-1 p-0.5 sm:p-1 rounded hover:bg-white/5 transition-all cursor-pointer ${
                          hasLiked ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={hasLiked ? 'Unlike' : 'Like Video'}
                      >
                        <Heart className={`h-2.5 w-2.5 sm:h-4 sm:w-4 ${hasLiked ? 'fill-current' : ''}`} />
                        <span className="text-[7px] sm:text-[10px] font-mono font-bold">{video.likes}</span>
                      </button>
                    </div>
 
                    <p className="text-zinc-500 text-[8px] sm:text-[11px] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed h-4 sm:h-8">
                      {video.description}
                    </p>
                  </div>
 
                  {/* Footer metadata block */}
                  <div className="pt-1.5 sm:pt-2.5 border-t border-white/5 flex items-center justify-between text-[8px] sm:text-[10px] text-zinc-400">
                    <span className="truncate max-w-[45px] sm:max-w-[120px]">By @{video.uploadedBy}</span>
                    <span className="text-zinc-500 font-mono flex-shrink-0">
                      {new Date(video.uploadedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
