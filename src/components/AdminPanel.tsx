/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Check, Trash2, Edit3, Star, Flame, 
  Tv, Monitor, Folder, Info, CheckCircle2, Play, Plus, Save, AlertCircle, RefreshCw, Megaphone
} from 'lucide-react';
import { Video, Category, CATEGORIES } from '../types';
import CineImage from './CineImage';

interface AdminPanelProps {
  videos: Video[];
  onApproveVideo: (videoId: string) => void;
  onRejectVideo: (videoId: string) => void;
  onUpdateVideo: (updatedVideo: Video) => void;
  onToggleTrending: (videoId: string) => void;
  onToggleFeatured: (videoId: string) => void;
  onPlayVideo: (video: Video) => void;
  announcement?: string;
  onSaveAnnouncement?: (announcement: string) => void;
  onExitAdmin?: () => void;
}

export default function AdminPanel({
  videos,
  onApproveVideo,
  onRejectVideo,
  onUpdateVideo,
  onToggleTrending,
  onToggleFeatured,
  onPlayVideo,
  announcement = '',
  onSaveAnnouncement,
  onExitAdmin,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'library' | 'announcement'>('pending');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '');

  // Keep announcementInput in sync with active broadcast prop
  React.useEffect(() => {
    setAnnouncementInput(announcement);
  }, [announcement]);
  
  // Inline edit state
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Action');
  const [editType, setEditType] = useState<'movie' | 'episode'>('movie');
  const [editSeriesTitle, setEditSeriesTitle] = useState('');
  const [editSeasonNumber, setEditSeasonNumber] = useState<number>(1);
  const [editEpisodeNumber, setEditEpisodeNumber] = useState<number>(1);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');

  const pendingVideos = videos.filter((v) => !v.isPublic);
  const libraryVideos = videos.filter((v) => v.isPublic);

  const startEditing = (video: Video) => {
    setEditingVideoId(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditCategory(video.category as Category);
    setEditType(video.type);
    setEditSeriesTitle(video.seriesTitle || '');
    setEditSeasonNumber(video.seasonNumber || 1);
    setEditEpisodeNumber(video.episodeNumber || 1);
    setEditVideoUrl(video.videoUrl);
    setEditThumbnailUrl(video.thumbnailUrl);
  };

  const cancelEditing = () => {
    setEditingVideoId(null);
  };

  const saveEditing = (originalVideo: Video) => {
    onUpdateVideo({
      ...originalVideo,
      title: editTitle,
      description: editDescription,
      category: editCategory,
      type: editType,
      seriesTitle: editType === 'episode' ? editSeriesTitle : undefined,
      seasonNumber: editType === 'episode' ? editSeasonNumber : undefined,
      episodeNumber: editType === 'episode' ? editEpisodeNumber : undefined,
      videoUrl: editVideoUrl,
      thumbnailUrl: editThumbnailUrl,
    });
    setEditingVideoId(null);
  };

  // Quick stats
  const totalUploads = videos.length;
  const totalApproved = libraryVideos.length;
  const totalPending = pendingVideos.length;
  const totalTrending = videos.filter((v) => v.isTrending).length;

  return (
    <section id="admin-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 select-none">
      
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between md:justify-start gap-4 flex-wrap">
            <div className="flex items-center space-x-2 text-[#E50914]">
              <ShieldCheck className="h-6 w-6" />
              <h1 className="text-2xl font-black uppercase tracking-wider font-sans">Control Room</h1>
            </div>
          </div>
        </div>

        {/* Dashboard Stat HUD */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-white/5 border border-white/10 p-3 rounded-xl">
          <div className="text-center px-2">
            <span className="block text-[9px] uppercase font-bold text-zinc-550">Catalog</span>
            <span className="text-sm font-extrabold text-white font-mono">{totalUploads}</span>
          </div>
          <div className="text-center px-2 border-l border-white/10">
            <span className="block text-[9px] uppercase font-bold text-zinc-550">Approved</span>
            <span className="text-sm font-extrabold text-green-400 font-mono">{totalApproved}</span>
          </div>
          <div className="text-center px-2 border-l border-white/10">
            <span className="block text-[9px] uppercase font-bold text-zinc-550">Pending</span>
            <span className="text-sm font-extrabold text-amber-500 font-mono">{totalPending}</span>
          </div>
          <div className="text-center px-2 border-l border-white/10">
            <span className="block text-[9px] uppercase font-bold text-zinc-550">Trending</span>
            <span className="text-sm font-extrabold text-[#E50914] font-mono">{totalTrending}</span>
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex space-x-3 mb-6">
        <button
          id="admin-tab-pending"
          onClick={() => {
            setActiveTab('pending');
            setEditingVideoId(null);
          }}
          className={`px-4 py-2.5 rounded text-xs font-bold cursor-pointer transition-all flex items-center space-x-2 border ${
            activeTab === 'pending'
              ? 'bg-red-950/25 text-red-400 border-red-900/60 shadow'
              : 'bg-white/5 text-zinc-450 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          <Folder className="h-4 w-4" />
          <span>Pending</span>
          {totalPending > 0 && (
            <span className="bg-[#E50914] h-2 w-2 rounded-full flex-shrink-0 animate-pulse" />
          )}
        </button>

        <button
          id="admin-tab-library"
          onClick={() => {
            setActiveTab('library');
            setEditingVideoId(null);
          }}
          className={`px-4 py-2.5 rounded text-xs font-bold cursor-pointer transition-all flex items-center space-x-2 border ${
            activeTab === 'library'
              ? 'bg-red-950/25 text-red-400 border-red-900/60 shadow'
              : 'bg-white/5 text-zinc-455 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          <Tv className="h-4 w-4" />
          <span>Library</span>
        </button>

        <button
          id="admin-tab-announcement"
          onClick={() => {
            setActiveTab('announcement');
            setEditingVideoId(null);
          }}
          className={`px-4 py-2.5 rounded text-xs font-bold cursor-pointer transition-all flex items-center space-x-2 border ${
            activeTab === 'announcement'
              ? 'bg-red-950/25 text-red-400 border-red-900/60 shadow'
              : 'bg-white/5 text-zinc-455 border-white/10 hover:text-white hover:bg-white/10'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>News</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-lg p-4 sm:p-6 space-y-6">
        
        {/* PENDING LIST TAB */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingVideos.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <CheckCircle2 className="h-12 w-12 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-300">Clean Moderation Queue</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">All content submissions are verified and live on the network catalog. Visitors can view them instantly.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 space-y-6">
                {pendingVideos.map((video, index) => (
                  <div id={`pending-moderator-${video.id}`} key={video.id} className={`pt-6 first:pt-0 space-y-4 ${editingVideoId === video.id ? 'bg-white/5 p-4 rounded-xl border border-white/10' : ''}`}>
                    
                    {/* View Info Block (When NOT editing) */}
                    {editingVideoId !== video.id ? (
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="relative aspect-video w-full sm:w-44 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10">
                          <CineImage
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover animate-pulse"
                          />
                          <button
                            id={`play-pending-${video.id}`}
                            onClick={() => onPlayVideo(video)}
                            className="absolute inset-0 m-auto bg-black/60 hover:bg-[#E50914] hover:text-white rounded-full h-10 w-10 flex items-center justify-center text-white cursor-pointer transition-colors"
                            title="Preview Submission Clip"
                          >
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </button>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-bold text-sm text-white">
                                {video.title}
                              </h3>
                              <p className="text-xs text-zinc-500">
                                Submitted by: <span className="text-red-400 font-semibold">@{video.uploadedBy}</span> • Type: <span className="text-zinc-300 font-semibold">{video.type === 'episode' ? `S${video.seasonNumber || 1}: Ep #${video.episodeNumber} of ${video.seriesTitle}` : 'Single Movie'}</span>
                              </p>
                            </div>
                            <span className="bg-[#050505] text-green-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-white/10">
                              {video.quality}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>

                          {video.type === 'episode' && video.seriesTitle && (() => {
                            const sameSeriesApproved = libraryVideos.filter(
                              (v) => v.type === 'episode' && v.seriesTitle?.toLowerCase() === video.seriesTitle?.toLowerCase()
                            );
                            const seriesExists = sameSeriesApproved.length > 0;
                            
                            if (!seriesExists) {
                              return (
                                <div className="mt-2.5 p-2.5 bg-yellow-950/25 border border-yellow-900/40 rounded-lg text-xs space-y-1">
                                  <div className="flex items-center space-x-1.5 text-yellow-500 font-bold uppercase tracking-wider text-[10px]">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    <span>New Franchise Series</span>
                                  </div>
                                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    The series <span className="text-zinc-200 font-semibold">"{video.seriesTitle}"</span> is NOT currently in the library. Approving this will establish Season {video.seasonNumber || 1} Episode {video.episodeNumber} as its very first public entry.
                                  </p>
                                </div>
                              );
                            }

                            // Calculate highest season and highest episode in that season
                            const seasons = sameSeriesApproved.map((e) => e.seasonNumber || 1);
                            const maxSeason = Math.max(...seasons, 1);
                            const maxEpInMaxSeason = Math.max(
                              ...sameSeriesApproved
                                .filter((e) => (e.seasonNumber || 1) === maxSeason)
                                .map((e) => e.episodeNumber || 1),
                              0
                            );

                            const pendingSeason = video.seasonNumber || 1;
                            const pendingEpisode = video.episodeNumber || 1;

                            let statusLabel = '';
                            let statusDesc = '';
                            let badgeColorClass = '';
                            let dotBg = '';

                            if (pendingSeason === maxSeason && pendingEpisode === maxEpInMaxSeason + 1) {
                              statusLabel = 'Next Logical Episode';
                              statusDesc = `Matches sequence perfectly. Previous approved is S${maxSeason}: Ep ${maxEpInMaxSeason}. This is Ep ${pendingEpisode}.`;
                              badgeColorClass = 'bg-green-950/20 border-green-900/40 text-green-400';
                              dotBg = 'bg-green-500';
                            } else if (pendingSeason === maxSeason + 1 && pendingEpisode === 1) {
                              statusLabel = 'New Season Debut';
                              statusDesc = `Initiating Season ${pendingSeason}. The previous season ${maxSeason} maxed at Episode ${maxEpInMaxSeason}.`;
                              badgeColorClass = 'bg-blue-950/20 border-blue-900/40 text-blue-400';
                              dotBg = 'bg-blue-500';
                            } else if (pendingSeason === maxSeason && pendingEpisode <= maxEpInMaxSeason) {
                              statusLabel = 'Potential Episode Overlap';
                              statusDesc = `Warning: Episode ${pendingEpisode} has already been approved (highest is Ep ${maxEpInMaxSeason} in Season ${maxSeason}). Please verify.`;
                              badgeColorClass = 'bg-red-950/20 border-red-900/40 text-red-400';
                              dotBg = 'bg-red-500';
                            } else {
                              statusLabel = 'Sequence Gap Detected';
                              statusDesc = `Highest approved is S${maxSeason}: Ep ${maxEpInMaxSeason}. This pending episode is set to S${pendingSeason}: Ep ${pendingEpisode}.`;
                              badgeColorClass = 'bg-amber-950/20 border-amber-900/40 text-amber-400';
                              dotBg = 'bg-amber-500';
                            }

                            return (
                              <div className={`mt-2.5 p-2.5 rounded-lg text-xs space-y-1 border ${badgeColorClass}`}>
                                <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[10px]">
                                  <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotBg} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`}></span>
                                  </span>
                                  <span>{statusLabel}</span>
                                </div>
                                <p className="text-zinc-400 text-[11px] leading-relaxed">
                                  Series: <span className="text-zinc-200 font-semibold">"{video.seriesTitle}"</span> • {statusDesc}
                                </p>
                              </div>
                            );
                          })()}

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                            <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-400">
                              Genre: {video.category}
                            </span>
                            <span>Submitted at: {new Date(video.uploadedAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Mod Operations Actions */}
                        <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                          <button
                            id={`approve-btn-${video.id}`}
                            onClick={() => onApproveVideo(video.id)}
                            className="flex-1 sm:w-28 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          
                          <button
                            id={`edit-btn-${video.id}`}
                            onClick={() => startEditing(video)}
                            className="flex-1 sm:w-28 py-1.5 rounded bg-white/5 border border-white/10 text-zinc-355 hover:text-white hover:bg-white/10 text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            id={`reject-btn-${video.id}`}
                            onClick={() => onRejectVideo(video.id)}
                            className="flex-1 sm:w-28 py-1.5 rounded bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Editing Form Block (For Curating user details) */
                      <div id="inline-editor" className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center space-x-1.5 border-b border-white/10 pb-2">
                          <Edit3 className="h-4 w-4 text-[#E50914]" />
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Editing Submission Details</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-550">Video Title</label>
                            <input
                              id="edit-title"
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-550">Video Genre</label>
                            <select
                              id="edit-category"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value as Category)}
                              className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-zinc-550">Description / Synopsis</label>
                          <textarea
                            id="edit-description"
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
                          />
                        </div>

                        {/* Format fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-550">Release Type</label>
                            <select
                              id="edit-type"
                              value={editType}
                              onChange={(e) => setEditType(e.target.value as 'movie' | 'episode')}
                              className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                            >
                              <option value="movie">Single Movie</option>
                              <option value="episode">Series Episode</option>
                            </select>
                          </div>

                           {editType === 'episode' && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-550">Series Name</label>
                                <input
                                  id="edit-series-title"
                                  type="text"
                                  value={editSeriesTitle}
                                  onChange={(e) => setEditSeriesTitle(e.target.value)}
                                  className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-550">Season #</label>
                                <input
                                  id="edit-season-number"
                                  type="number"
                                  min={1}
                                  value={editSeasonNumber}
                                  onChange={(e) => setEditSeasonNumber(parseInt(e.target.value) || 1)}
                                  className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-550">Episode #</label>
                                <input
                                  id="edit-episode-number"
                                  type="number"
                                  min={1}
                                  value={editEpisodeNumber}
                                  onChange={(e) => setEditEpisodeNumber(parseInt(e.target.value) || 1)}
                                  className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Media paths urls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-550">Video Content Source Path / URL</label>
                            <input
                              id="edit-video-url"
                              type="text"
                              value={editVideoUrl}
                              onChange={(e) => setEditVideoUrl(e.target.value)}
                              className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-550">Cover Thumbnail Source Path / URL</label>
                            <input
                              id="edit-thumbnail-url"
                              type="text"
                              value={editThumbnailUrl}
                              onChange={(e) => setEditThumbnailUrl(e.target.value)}
                              className="w-full bg-[#050505] border border-white/10 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                          <button
                            id="edit-cancel"
                            type="button"
                            onClick={cancelEditing}
                            className="bg-white/5 border border-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            id="edit-save"
                            type="button"
                            onClick={() => saveEditing(video)}
                            className="bg-[#E50914] hover:bg-[#b20710] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIBRARY MANAGEMENT TAB */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {libraryVideos.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-300">Catalog Library is Empty</h3>
                <p className="text-xs text-zinc-500">No approved movies or episodes exist. Go to "Pending" and approve user uploads or upload fresh ones.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-455 border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-550">
                      <th className="py-3 px-2">Title</th>
                      <th className="py-3 px-2">Genre</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2 text-center">Trending</th>
                      <th className="py-3 px-2 text-center">Hero</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {libraryVideos.map((video) => (
                      <tr id={`lib-item-${video.id}`} key={video.id} className="hover:bg-white/5 transition-colors">
                        
                        {/* Title only (no cover image) */}
                        <td className="py-3.5 px-2 max-w-[240px]">
                          <div className="truncate min-w-0">
                            <p className="font-bold text-zinc-200 truncate">{video.title}</p>
                            <p className="text-[10px] text-zinc-550">@{video.uploadedBy}</p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-2">
                          <span className="bg-white/5 border border-white/10 text-zinc-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                            {video.category}
                          </span>
                        </td>

                        {/* Video release Type */}
                        <td className="py-3.5 px-2 text-zinc-300 capitalize">
                          {video.type === 'episode' ? (
                            <span className="text-red-400 font-semibold">
                              S{video.seasonNumber || 1}: Ep {video.episodeNumber} ({video.seriesTitle})
                            </span>
                          ) : (
                            'Movie'
                          )}
                        </td>

                        {/* Trending control indicator */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            id={`trending-toggle-${video.id}`}
                            onClick={() => onToggleTrending(video.id)}
                            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                              video.isTrending
                                ? 'bg-orange-950/25 text-orange-400 border-orange-900/30'
                                : 'bg-transparent text-zinc-600 border-transparent hover:border-white/10 hover:text-zinc-400'
                            }`}
                            title={video.isTrending ? 'Remove from Trending' : 'Mark as Trending'}
                          >
                            <Flame className="h-4 w-4 fill-current" />
                          </button>
                        </td>

                        {/* Featured (Hero Section) control indicator */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            id={`featured-toggle-${video.id}`}
                            onClick={() => onToggleFeatured(video.id)}
                            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                              video.isFeatured
                                ? 'bg-yellow-950/25 text-yellow-500 border-yellow-900/30'
                                : 'bg-transparent text-zinc-600 border-transparent hover:border-white/10 hover:text-zinc-450'
                            }`}
                            title={video.isFeatured ? 'Remove from Featured Banner' : 'Set as Featured Banner'}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        </td>

                        {/* Actions: delete */}
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              id={`lib-play-${video.id}`}
                              onClick={() => onPlayVideo(video)}
                              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                              title="Play"
                            >
                              <Play className="h-4 w-4 fill-current" />
                            </button>
                            <button
                              id={`lib-reject-${video.id}`}
                              onClick={() => onRejectVideo(video.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/15 transition-colors cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENT BROADCAST TAB */}
        {activeTab === 'announcement' && (
          <div className="space-y-6 max-w-xl mx-auto py-4 animate-in fade-in duration-250">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#E50914]" />
                <span>Broadcast Live Announcement</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Type an announcement message below. All logged-in and guest users will instantly see this update when clicking the announcement button in their navigation header.
              </p>
            </div>

            <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Announcement Text</label>
                <textarea
                  id="announcement-textarea"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  placeholder="E.g., Welcome to CINEMAX! New high-quality movies are uploaded daily. Check out our latest action releases..."
                  rows={4}
                  className="w-full bg-[#050505] border border-white/10 text-white rounded p-3 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                {announcement ? (
                  <button
                    id="delete-announcement-btn"
                    onClick={() => {
                      if (onSaveAnnouncement) {
                        onSaveAnnouncement('');
                        setAnnouncementInput('');
                      }
                    }}
                    className="px-3.5 py-2 rounded bg-zinc-900 hover:bg-red-950/40 text-red-500 hover:text-red-400 border border-white/5 hover:border-red-900/30 text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Broadcast</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  id="save-announcement-btn"
                  onClick={() => {
                    if (onSaveAnnouncement) {
                      onSaveAnnouncement(announcementInput.trim());
                    }
                  }}
                  disabled={!announcementInput.trim()}
                  className="px-4 py-2 rounded bg-[#E50914] hover:bg-[#b20710] disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Publish</span>
                </button>
              </div>
            </div>

            {announcement && (
              <div className="bg-red-950/20 border border-[#E50914]/25 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-1.5 text-[#E50914] text-xs font-bold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E50914]"></span>
                  </span>
                  <span>Currently Live:</span>
                </div>
                <p className="text-xs text-zinc-300 italic font-sans">"{announcement}"</p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
