/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Flame, Award } from 'lucide-react';
import { Video, UserProfile, Comment } from '../types';
import UserStars from './UserStars';

interface HeroSectionProps {
  featuredVideo: Video | null;
  onPlayVideo: (video: Video) => void;
  onOpenInfo: (video: Video) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
  profiles?: UserProfile[];
  comments?: Comment[];
  videos?: Video[];
}

export default function HeroSection({
  featuredVideo,
  onPlayVideo,
  onOpenInfo,
  isInWatchlist,
  onToggleWatchlist,
  profiles = [],
  comments = [],
  videos = [],
}: HeroSectionProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState('');
  const [resolvedThumbnailUrl, setResolvedThumbnailUrl] = useState('');

  useEffect(() => {
    if (!featuredVideo) return;

    let active = true;
    let videoUrlCleanup = '';
    let thumbUrlCleanup = '';

    const resolveHeroMedia = async () => {
      try {
        const { getFile } = await import('../lib/indexedDB');

        // Resolve video url
        if (featuredVideo.videoUrl.startsWith('indexeddb://')) {
          const key = featuredVideo.videoUrl.replace('indexeddb://', '');
          const blob = await getFile(key);
          if (active && blob) {
            videoUrlCleanup = URL.createObjectURL(blob);
            setResolvedVideoUrl(videoUrlCleanup);
          }
        } else {
          setResolvedVideoUrl(featuredVideo.videoUrl);
        }

        // Resolve thumbnail url
        if (featuredVideo.thumbnailUrl.startsWith('indexeddb://')) {
          const key = featuredVideo.thumbnailUrl.replace('indexeddb://', '');
          const blob = await getFile(key);
          if (active && blob) {
            thumbUrlCleanup = URL.createObjectURL(blob);
            setResolvedThumbnailUrl(thumbUrlCleanup);
          }
        } else {
          setResolvedThumbnailUrl(featuredVideo.thumbnailUrl);
        }
      } catch (err) {
        console.error('Error resolving hero media:', err);
        if (active) {
          setResolvedVideoUrl(featuredVideo.videoUrl);
          setResolvedThumbnailUrl(featuredVideo.thumbnailUrl);
        }
      }
    };

    resolveHeroMedia();

    return () => {
      active = false;
      if (videoUrlCleanup) URL.revokeObjectURL(videoUrlCleanup);
      if (thumbUrlCleanup) URL.revokeObjectURL(thumbUrlCleanup);
    };
  }, [featuredVideo]);

  // Restart video playback when sources change or resolvedVideoUrl loads
  useEffect(() => {
    if (videoRef.current) {
      if (isPlayingVideo && resolvedVideoUrl) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {
          // Fallback if browser blocks auto-play
          setIsPlayingVideo(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlayingVideo, resolvedVideoUrl]);

  // Auto-play trailer after a 2-second delay
  useEffect(() => {
    setIsPlayingVideo(false);
    const timer = setTimeout(() => {
      setIsPlayingVideo(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [featuredVideo]);

  if (!featuredVideo) {
    return (
      <div className="h-[70vh] w-full bg-zinc-950 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-bold text-zinc-400">Welcome to CINEMAX</h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-md">No videos are currently marked as featured. Go to the Admin Panel or upload videos to populate the platform!</p>
      </div>
    );
  }

  return (
    <div id="hero-banner" className="relative h-[55vh] sm:h-[48vh] md:h-[48vh] lg:h-[75vh] min-h-[380px] sm:min-h-[350px] md:min-h-[360px] lg:min-h-[520px] landscape:h-[78vh] landscape:min-h-[370px] sm:landscape:h-[65vh] sm:landscape:min-h-[380px] md:landscape:h-[65vh] md:landscape:min-h-[400px] w-full bg-black overflow-hidden select-none pt-0">
      
      {/* Background Media */}
      <div className="absolute inset-0 w-full h-full">
        {isPlayingVideo && resolvedVideoUrl ? (
          <video
            id="hero-bg-video"
            ref={videoRef}
            src={resolvedVideoUrl}
            poster={resolvedThumbnailUrl}
            className="w-full h-full object-cover scale-105 transition-all duration-1000"
            muted={isMuted}
            loop
            playsInline
          />
        ) : (
          <img
            id="hero-bg-image"
            src={resolvedThumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop'}
            alt={featuredVideo.title}
            className="w-full h-full object-cover brightness-[0.7] transition-all duration-700"
          />
        )}
        
        {/* Dark Vignette Overlay (Sleek Cinema Gradient) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/60 z-10" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050505] via-transparent to-transparent hidden md:block z-10" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-start pt-6 sm:pt-10 md:pt-12 lg:pt-16 landscape:pt-4 sm:landscape:pt-6 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto z-15">
        <div className="max-w-xl space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* Badge indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center space-x-1 bg-[#E50914] text-white text-[10px] font-extrabold px-2.5 py-1 rounded tracking-wider uppercase">
              <Flame className="h-3.5 w-3.5" />
              <span>Trending Featured</span>
            </span>
            <span className="bg-white/10 backdrop-blur-sm text-zinc-300 text-[10px] font-bold px-2 py-1 rounded uppercase border border-white/10">
              {featuredVideo.category}
            </span>
            <span className="bg-white/10 backdrop-blur-sm text-green-400 text-[10px] font-bold px-2 py-1 rounded font-mono border border-white/10">
              {featuredVideo.quality}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl landscape:text-2xl sm:landscape:text-3xl md:landscape:text-5xl lg:landscape:text-6xl font-black text-white tracking-tight drop-shadow-md leading-none">
            {featuredVideo.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-zinc-300">
            <span className="font-semibold text-green-500">{(featuredVideo.likes + 250).toLocaleString()} Views</span>
            <span>•</span>
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span>By @{featuredVideo.uploadedBy}</span>
              <UserStars username={featuredVideo.uploadedBy} profiles={profiles} videos={videos} comments={comments} size="xs" />
            </span>
            <span>•</span>
            <span className="flex items-center text-amber-500 font-medium">
              <Award className="h-3.5 w-3.5 mr-0.5" />
              Approved Release
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-zinc-300 drop-shadow line-clamp-2 landscape:line-clamp-1 sm:landscape:line-clamp-2 md:landscape:line-clamp-3 leading-relaxed">
            {featuredVideo.description}
          </p>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-play-btn"
              onClick={() => onPlayVideo(featuredVideo)}
              className="flex items-center space-x-2 bg-white hover:bg-zinc-200 text-black font-extrabold px-8 py-3 rounded transition-all duration-200 shadow-lg cursor-pointer transform active:scale-95"
            >
              <Play className="h-5 w-5 fill-black" />
              <span>Play Now</span>
            </button>

            <button
              id="hero-info-btn"
              onClick={() => onOpenInfo(featuredVideo)}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold px-8 py-3 rounded transition-all duration-200 cursor-pointer"
            >
              <Info className="h-5 w-5" />
              <span>More Info</span>
            </button>

            <button
              id="hero-watchlist-btn"
              onClick={onToggleWatchlist}
              className={`flex items-center justify-center h-12 w-12 rounded-full border border-white/20 hover:bg-white/10 transition-colors cursor-pointer ${
                isInWatchlist ? 'bg-[#E50914] text-white border-transparent' : 'text-white'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Volume Controller (Bottom Right) */}
      <div className="absolute bottom-12 sm:bottom-20 right-4 sm:right-6 lg:right-12 z-20 flex items-center space-x-3">
        {isPlayingVideo && (
          <button
            id="hero-mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
