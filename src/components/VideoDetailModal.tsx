/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Heart, Download, MessageSquare, 
  Send, User, Calendar, Flame, AlertCircle, RefreshCw, CheckCircle, Monitor,
  Bookmark, Check, Star, Trash2
} from 'lucide-react';
import { Video, Comment, UserProfile, DownloadItem, getStarEmoji, getUserStarStatus } from '../types';
import CineImage from './CineImage';
import UserStars from './UserStars';

interface VideoDetailModalProps {
  video: Video | null;
  onClose: () => void;
  user: UserProfile | null;
  onOpenProfileModal: () => void;
  allVideos: Video[]; // To find other episodes of the series
  comments: Comment[];
  onAddComment: (videoId: string, text: string) => void;
  onLikeVideo: (video: Video) => void;
  userLikedVideos: string[];
  downloads: DownloadItem[];
  onDownloadVideo: (video: Video) => void;
  onDownloadVideos?: (videos: Video[]) => void;
  onPlayVideo: (video: Video) => void;
  watchlist: string[];
  onToggleWatchlist: (videoId: string) => void;
  onQueueMultipleEpisodes?: (episodes: Video[]) => void;
  onPauseDownload?: (id: string, e?: React.MouseEvent) => void;
  onResumeDownload?: (id: string, e?: React.MouseEvent) => void;
  profiles?: UserProfile[];
  isAdmin?: boolean;
  onDeleteComment?: (commentId: string) => void;
}

export default function VideoDetailModal({
  video,
  onClose,
  user,
  onOpenProfileModal,
  allVideos,
  comments,
  onAddComment,
  onLikeVideo,
  userLikedVideos,
  downloads,
  onDownloadVideo,
  onDownloadVideos,
  onPlayVideo,
  watchlist,
  onToggleWatchlist,
  onQueueMultipleEpisodes,
  onPauseDownload,
  onResumeDownload,
  profiles = [],
  isAdmin = false,
  onDeleteComment,
}: VideoDetailModalProps) {
  const [commentText, setCommentText] = useState('');
  const [showBatchDownloader, setShowBatchDownloader] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  // Filter series episodes
  const isSeries = video.type === 'episode' && video.seriesTitle;
  const seriesEpisodes = isSeries
    ? allVideos
        .filter((v) => v.type === 'episode' && v.seriesTitle === video.seriesTitle && v.isPublic)
        .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
    : [];

  const videoComments = comments.filter((c) => c.videoId === video.id);
  const hasLiked = userLikedVideos.includes(video.id);
  
  const activeDownload = downloads.find((d) => d.videoId === video.id);
  const isDownloaded = activeDownload?.status === 'completed';
  const isDownloading = activeDownload?.status === 'downloading' || activeDownload?.status === 'queued';
  const downloadProgress = activeDownload?.progress ?? 0;
  const isPaused = activeDownload?.status === 'paused';
  
  const isInWatchlist = watchlist.includes(video.id);

  // Auto pre-select all non-completed episodes
  useEffect(() => {
    if (isSeries && seriesEpisodes.length > 0) {
      const nonCompleted = seriesEpisodes
        .filter((ep) => {
          const dl = downloads.find((d) => d.videoId === ep.id);
          return dl?.status !== 'completed';
        })
        .map((ep) => ep.id);
      setSelectedEpisodeIds(nonCompleted);
    }
  }, [video, isSeries]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    onAddComment(video.id, commentText.trim());
    setCommentText('');
  };

  const handleDownloadClick = () => {
    if (!user) {
      onOpenProfileModal();
      return;
    }

    if (isSeries) {
      // Toggle the advanced batch sequence downloader checklist!
      setShowBatchDownloader((prev) => !prev);
    } else {
      // It's a single movie
      if (isDownloaded) return;
      
      if (isDownloading) {
        if (onPauseDownload) onPauseDownload(video.id);
      } else if (isPaused) {
        if (onResumeDownload) onResumeDownload(video.id);
      } else {
        onDownloadVideo(video);
      }
    }
  };

  return (
    <div 
      id="video-detail-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start p-3 sm:p-4 overflow-y-auto backdrop-blur-md"
    >
      <div
        id="video-detail-container"
        ref={modalRef}
        className="relative bg-[#0c0c0c] border border-white/10 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 sm:my-8 md:my-12 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-zinc-800 text-gray-300 hover:text-white rounded-full p-2.5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media / Video Header Cover */}
        <div className="relative aspect-video w-full bg-black group">
          <CineImage
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover brightness-[0.6] group-hover:scale-101 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/20 to-transparent" />
          
          {/* Centered Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              id="detail-play-btn"
              onClick={() => {
                onPlayVideo(video);
                onClose();
              }}
              className="bg-[#E50914] hover:bg-[#b20710] text-white rounded-full h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Launch Player"
            >
              <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current ml-1" />
            </button>
          </div>

          {/* Quick Stats Cover Overlay */}
          <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap items-center gap-2">
            <span className="bg-[#E50914] text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
              {video.type === 'episode' ? 'Series Episode' : 'Single Video'}
            </span>
            <span className="bg-[#0c0c0c]/90 backdrop-blur-md text-[10px] font-bold text-green-400 px-2 py-1 rounded font-mono border border-white/10">
              {video.quality}
            </span>
          </div>
        </div>

        {/* Grid Layout of Details */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left / Middle: Descriptions & Series information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight font-sans">
                {video.title}
              </h2>
              {isSeries && (
                <p className="text-[#E50914] text-sm font-semibold tracking-wider uppercase">
                  Series: {video.seriesTitle} • Season {video.seasonNumber || 1} • Episode {video.episodeNumber}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <span>By @{video.uploadedBy}</span>
                  <UserStars username={video.uploadedBy} profiles={profiles} videos={allVideos} comments={comments} size="xs" />
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                </span>
                <span>•</span>
                <span className="text-green-500 font-bold">{video.views.toLocaleString()} Views</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-b border-white/10 py-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">About this story</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {video.description}
              </p>
            </div>

            {/* Interactions: Likes & Downloads */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Like Toggle */}
              <button
                id="modal-like-btn"
                onClick={() => onLikeVideo(video)}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  hasLiked
                    ? 'bg-red-950/20 text-red-400 border-red-900/50'
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{hasLiked ? 'Liked' : 'Like'} ({video.likes})</span>
              </button>

              {/* Watchlist / My List Toggle */}
              <button
                id="modal-watchlist-btn"
                onClick={() => onToggleWatchlist(video.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  isInWatchlist
                    ? 'bg-red-950/25 text-[#E50914] border-[#E50914]/40 hover:bg-red-950/45'
                    : 'bg-white/5 text-zinc-350 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {isInWatchlist ? (
                  <Check className="h-4 w-4 text-[#E50914]" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                <span>{isInWatchlist ? 'Added' : 'Add'}</span>
              </button>

              {/* Download simulated system */}
              <div className="relative group/download flex-1 sm:flex-none">
                <button
                  id="modal-download-btn"
                  onClick={handleDownloadClick}
                  disabled={!isSeries && (isDownloaded || (isDownloading && !isPaused && !onPauseDownload))}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    isSeries
                      ? showBatchDownloader
                        ? 'bg-red-950/30 text-[#E50914] border-[#E50914]/40 hover:bg-red-950/50'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-350 border-white/10 hover:text-white'
                      : isDownloaded
                      ? 'bg-[#0c0c0c] text-green-400 border-white/10'
                      : isDownloading
                      ? 'bg-[#0c0c0c] text-yellow-500 border-white/10 animate-pulse'
                      : isPaused
                      ? 'bg-[#0c0c0c] text-orange-400 border-white/10'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-350 border-white/10 hover:text-white'
                  }`}
                >
                  {isSeries ? (
                    <>
                      <Download className="h-4 w-4" />
                      <span>{showBatchDownloader ? 'Hide Episode Selector' : 'Select & Sync Series'}</span>
                    </>
                  ) : isDownloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Downloading {downloadProgress}%</span>
                    </>
                  ) : isPaused ? (
                    <>
                      <Play className="h-4 w-4 text-orange-400 fill-current" />
                      <span>Paused ({downloadProgress}%)</span>
                    </>
                  ) : isDownloaded ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>
                
                {/* Visual tooltip if they don't have account/profile */}
                {!user && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-[#0c0c0c] border border-white/10 text-[10px] text-zinc-400 px-2.5 py-1.5 rounded-md shadow-lg w-48 text-center pointer-events-none opacity-0 group-hover/download:opacity-100 transition-opacity duration-200 z-50">
                    <span className="text-red-400 font-bold block mb-0.5">Account Required</span>
                    Play online immediately. Create a profile username to unlock downloads.
                  </div>
                )}
              </div>
            </div>

            {/* ADVANCED SERIES BATCH SEQUENCE DOWNLOADER PANEL */}
            {isSeries && showBatchDownloader && (
              <div id="batch-download-panel" className="bg-[#0e0e0e] border border-[#E50914]/30 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Advanced Episode Syncer</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Select season episodes to queue and download in sequence.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEpisodeIds(seriesEpisodes.map((ep) => ep.id));
                      }}
                      className="text-[9px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-700 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEpisodeIds([]);
                      }}
                      className="text-[9px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Checklist Grid */}
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {seriesEpisodes.map((ep) => {
                    const epDl = downloads.find((d) => d.videoId === ep.id);
                    const isEpDownloaded = epDl?.status === 'completed';
                    const isEpDownloading = epDl?.status === 'downloading';
                    const isEpQueued = epDl?.status === 'queued';
                    const isEpPaused = epDl?.status === 'paused';
                    const epProgress = epDl?.progress ?? 0;

                    return (
                      <div
                        key={ep.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                          selectedEpisodeIds.includes(ep.id)
                            ? 'bg-white/5 border-white/10'
                            : 'bg-transparent border-white/5 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <label className="flex items-center space-x-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={selectedEpisodeIds.includes(ep.id) || isEpDownloaded}
                            disabled={isEpDownloaded}
                            onChange={() => {
                              if (isEpDownloaded) return;
                              setSelectedEpisodeIds((prev) =>
                                prev.includes(ep.id)
                                  ? prev.filter((id) => id !== ep.id)
                                  : [...prev, ep.id]
                              );
                            }}
                            className="rounded border-zinc-750 bg-zinc-900 text-[#E50914] focus:ring-[#E50914] h-3.5 w-3.5 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-200 block truncate text-[11px]">
                              S{ep.seasonNumber || 1}:Ep {ep.episodeNumber} - {ep.title.split(' - Season')[0]}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {ep.quality} • {ep.likes} likes
                            </span>
                          </div>
                        </label>

                        {/* Status Badge / Action inside checklist */}
                        <div className="text-[10px] font-mono flex items-center space-x-1.5 pl-2">
                          {isEpDownloaded ? (
                            <span className="text-green-400 bg-green-950/35 border border-green-900/40 px-1.5 py-0.5 rounded text-[9px] font-bold">✓ Saved</span>
                          ) : isEpDownloading ? (
                            <span className="text-yellow-500 bg-yellow-950/35 border border-yellow-900/40 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center space-x-1 animate-pulse">
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                              <span>{epProgress}%</span>
                            </span>
                          ) : isEpQueued ? (
                            <span className="text-blue-400 bg-blue-950/35 border border-blue-900/40 px-1.5 py-0.5 rounded text-[9px] font-bold">⏰ Queued</span>
                          ) : isEpPaused ? (
                            <span className="text-orange-400 bg-orange-950/35 border border-orange-900/40 px-1.5 py-0.5 rounded text-[9px] font-bold">⏸ Paused</span>
                          ) : (
                            <span className="text-zinc-500 text-[9px]">Ready</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={selectedEpisodeIds.length === 0}
                  onClick={() => {
                    const selectedEpisodesArray = seriesEpisodes.filter((ep) =>
                      selectedEpisodeIds.includes(ep.id)
                    );
                    if (onDownloadVideos) {
                      onDownloadVideos(selectedEpisodesArray);
                    } else if (onQueueMultipleEpisodes) {
                      onQueueMultipleEpisodes(selectedEpisodesArray);
                    }
                    setShowBatchDownloader(false);
                  }}
                  className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:opacity-40 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Queue {selectedEpisodeIds.length} Episodes in Correct Sequence</span>
                </button>
              </div>
            )}

            {/* Series Organization Accordion/List */}
            {isSeries && seriesEpisodes.length > 1 && (
              <div id="series-section" className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Monitor className="h-4 w-4 text-[#E50914]" />
                  <span>More Episodes from "{video.seriesTitle}"</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {seriesEpisodes.map((ep) => (
                    <div
                      id={`ep-item-${ep.id}`}
                      key={ep.id}
                      onClick={() => {
                        // Directly load and switch video preview within detail modal
                        onPlayVideo(ep);
                        onClose();
                      }}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all ${
                        ep.id === video.id
                          ? 'border-red-900/60 bg-red-950/15'
                          : 'border-white/5 bg-[#0c0c0c]/80'
                      }`}
                    >
                      <CineImage
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        className="h-10 w-16 object-cover rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-200 truncate">
                          S{ep.seasonNumber || 1}: Ep {ep.episodeNumber} - {ep.title.split(' - Season')[0]}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {ep.quality} • {ep.likes} likes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Comment Widget */}
          <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-6 flex flex-col h-[400px] lg:h-auto">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
              <MessageSquare className="h-4 w-4 text-[#E50914]" />
              <span>Comments ({videoComments.length})</span>
            </h3>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {videoComments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MessageSquare className="h-8 w-8 text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-500">No discussions yet. Be the first to express your thoughts!</p>
                </div>
              ) : (
                videoComments.map((comment) => {
                  const isUserAdmin = isAdmin || (user && user.role === 'admin') || (user && user.username.trim().toLowerCase() === 'oanti');
                  const isCommentOwner = user && comment.username.trim().toLowerCase() === user.username.trim().toLowerCase();
                  const canDelete = isUserAdmin || isCommentOwner;

                  return (
                    <div id={`comment-${comment.id}`} key={comment.id} className="text-xs space-y-1 bg-white/5 p-2.5 rounded-lg border border-white/5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className="font-bold text-zinc-300 truncate" title={`@${comment.username}`}>
                            @{comment.username}
                          </span>
                          
                          <UserStars username={comment.username} profiles={profiles} videos={allVideos} comments={comments} size="xs" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {canDelete && onDeleteComment && (
                            <button
                              id={`delete-comment-btn-${comment.id}`}
                              onClick={() => onDeleteComment(comment.id)}
                              className="text-zinc-500 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                              title="Delete Comment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-zinc-400 leading-relaxed break-words">{comment.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create Comment Form */}
            {user ? (
              <form id="comment-form" onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-2 border-t border-white/10 w-full">
                <input
                  id="comment-input"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Express your thoughts..."
                  className="flex-1 min-w-0 bg-[#0c0c0c] border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
                />
                <button
                  id="comment-submit-btn"
                  type="submit"
                  disabled={!commentText.trim()}
                  className="flex-shrink-0 bg-[#E50914] hover:bg-[#b20710] disabled:opacity-50 text-white rounded-lg p-2 transition-all cursor-pointer"
                  title="Send Comment"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center space-y-2 pt-2">
                <p className="text-[11px] text-zinc-500">You must create a profile to write a comment.</p>
                <button
                  id="comment-register-btn"
                  onClick={onOpenProfileModal}
                  className="bg-[#E50914] hover:bg-[#b20710] text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer w-full"
                >
                  Create Profile Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
