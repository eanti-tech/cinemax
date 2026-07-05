/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, Film, Image, Sparkles, Check, 
  Settings, Loader, AlertTriangle, Monitor, HelpCircle, RefreshCw
} from 'lucide-react';
import { Video, Category, CATEGORIES, UserProfile } from '../types';
import { CONFIG } from '../config';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (newVideo: Omit<Video, 'id' | 'likes' | 'likedBy' | 'views'>) => void;
  user: UserProfile | null;
  onOpenProfileModal: () => void;
  allVideos: Video[];
}

export default function UploadModal({
  onClose,
  onUpload,
  user,
  onOpenProfileModal,
  allVideos,
}: UploadModalProps) {
  // Extract unique existing series titles from system
  const existingSeries = Array.from(
    new Set(
      (allVideos || [])
        .filter((v) => v.type === 'episode' && v.seriesTitle)
        .map((v) => v.seriesTitle as string)
    )
  );

  // Fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Action');
  const [type, setType] = useState<'movie' | 'episode'>('movie');
  
  // Series selector states
  const [seriesSelectionMode, setSeriesSelectionMode] = useState<'existing' | 'new'>(
    existingSeries.length > 0 ? 'existing' : 'new'
  );
  const [seriesTitle, setSeriesTitle] = useState(existingSeries[0] || '');
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);

  // Auto-fill and suggest season & episode numbers based on existing series records
  React.useEffect(() => {
    if (type === 'episode' && seriesSelectionMode === 'existing' && seriesTitle) {
      const episodes = (allVideos || []).filter(
        (v) => v.type === 'episode' && v.seriesTitle?.toLowerCase() === seriesTitle.toLowerCase()
      );
      if (episodes.length > 0) {
        // Find highest season number
        const seasons = episodes.map((e) => e.seasonNumber || 1);
        const maxSeason = Math.max(...seasons, 1);
        setSeasonNumber(maxSeason);

        // Find highest episode number in that max season
        const currentSeasonEpisodes = episodes.filter((e) => (e.seasonNumber || 1) === maxSeason);
        if (currentSeasonEpisodes.length > 0) {
          const maxEpisode = Math.max(...currentSeasonEpisodes.map((e) => e.episodeNumber || 0));
          setEpisodeNumber(maxEpisode + 1);
        } else {
          setEpisodeNumber(1);
        }
      }
    }
  }, [seriesTitle, seriesSelectionMode, type, allVideos]);

  // Adjust suggested episode number when user manually changes season number
  React.useEffect(() => {
    if (type === 'episode' && seriesSelectionMode === 'existing' && seriesTitle) {
      const episodes = (allVideos || []).filter(
        (v) => v.type === 'episode' && v.seriesTitle?.toLowerCase() === seriesTitle.toLowerCase()
      );
      const currentSeasonEpisodes = episodes.filter((e) => (e.seasonNumber || 1) === seasonNumber);
      if (currentSeasonEpisodes.length > 0) {
        const maxEpisode = Math.max(...currentSeasonEpisodes.map((e) => e.episodeNumber || 0));
        setEpisodeNumber(maxEpisode + 1);
      } else {
        setEpisodeNumber(1);
      }
    }
  }, [seasonNumber]);

  // File Upload states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Auto-determined specs
  const [autoQuality, setAutoQuality] = useState('Determining...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzerLogs, setAnalyzerLogs] = useState<{ resolution?: string; sizeMb?: string; duration?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setIsAnalyzing(true);
    setAutoQuality('Analyzing video file properties...');

    // Generate local Object URL for playback
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);

    // Dynamic quality analyzer
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = localUrl;

    tempVideo.onloadedmetadata = () => {
      const w = tempVideo.videoWidth;
      const h = tempVideo.videoHeight;
      const dur = tempVideo.duration;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      let detectedQuality = '1080p Full HD';
      if (w >= 3840 || h >= 2160) {
        detectedQuality = '4K Ultra HD';
      } else if (w >= 1920 || h >= 1080) {
        detectedQuality = '1080p Full HD';
      } else if (w >= 1280 || h >= 720) {
        detectedQuality = '720p HD';
      } else {
        detectedQuality = '480p SD';
      }

      // Convert duration seconds to HH:MM:SS
      const minutes = Math.floor(dur / 60);
      const seconds = Math.floor(dur % 60);
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      setAutoQuality(detectedQuality);
      setAnalyzerLogs({
        resolution: `${w} × ${h} px`,
        sizeMb: `${sizeMb} MB`,
        duration: formattedDuration,
      });
      setIsAnalyzing(false);
    };

    tempVideo.onerror = () => {
      // Fallback
      setAutoQuality('1080p Full HD');
      setAnalyzerLogs({
        resolution: '1920 × 1080 (Estimated)',
        sizeMb: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        duration: 'Unknown duration',
      });
      setIsAnalyzing(false);
    };
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper to load cinematic stock clip immediately for testing
  const handleLoadSample = () => {
    setIsAnalyzing(true);
    setAutoQuality('1080p Full HD');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4');
    setAnalyzerLogs({
      resolution: '1920 × 1080 px',
      sizeMb: '42.5 MB',
      duration: '4:48',
    });
    // Add nice stock thumbnail
    setThumbnailUrl('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop');
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl || !thumbnailUrl || !user) return;

    setIsSaving(true);
    setSavingProgress(5);

    // Dynamic delay helper to let the user visually inspect each transcode stage
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      await delay(700);
      setSavingProgress(25);
      await delay(600);

      let finalVideoUrl = videoUrl;
      let finalThumbnailUrl = thumbnailUrl;

      const fileId = Math.random().toString(36).substring(2, 11);

      if (CONFIG.CLOUDFLARE.USE_CLOUDFLARE_BACKEND) {
        // --- 1. Cloudflare R2 Direct Stream Ingestion ---
        if (videoFile) {
          setSavingProgress(35);
          const cleanFileName = `video_${fileId}_${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const response = await fetch(`${CONFIG.CLOUDFLARE.API_BASE_URL}/upload?file=${encodeURIComponent(cleanFileName)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': videoFile.type || 'video/mp4'
            },
            body: videoFile
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(
              'Cloudflare API returned a non-JSON response (local Vite dev server served HTML). ' +
              'To upload locally, please set CONFIG.CLOUDFLARE.USE_CLOUDFLARE_BACKEND to false in src/config.ts.'
            );
          }
          if (!response.ok) {
            throw new Error(`Video upload to Cloudflare R2 failed: ${response.statusText}`);
          }
          const resData = await response.json();
          // The public URL is served from your public R2 subdomain
          finalVideoUrl = `${CONFIG.CLOUDFLARE.R2_PUBLIC_URL}/${resData.mediaKey}`;
          setSavingProgress(70);
          await delay(400);
        }

        if (thumbnailFile) {
          setSavingProgress(80);
          const cleanThumbName = `thumb_${fileId}_${thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const response = await fetch(`${CONFIG.CLOUDFLARE.API_BASE_URL}/upload?file=${encodeURIComponent(cleanThumbName)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': thumbnailFile.type || 'image/jpeg'
            },
            body: thumbnailFile
          });
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(
              'Cloudflare API returned a non-JSON response (local Vite dev server served HTML). ' +
              'To upload locally, please set CONFIG.CLOUDFLARE.USE_CLOUDFLARE_BACKEND to false in src/config.ts.'
            );
          }
          if (!response.ok) {
            throw new Error(`Thumbnail upload to Cloudflare R2 failed: ${response.statusText}`);
          }
          const resData = await response.json();
          finalThumbnailUrl = `${CONFIG.CLOUDFLARE.R2_PUBLIC_URL}/${resData.mediaKey}`;
          setSavingProgress(95);
          await delay(400);
        }
      } else {
        // --- 2. Offline Sandbox Local IndexedDB Storage ---
        const { saveFile } = await import('../lib/indexedDB');

        if (videoFile) {
          setSavingProgress(45);
          await delay(800);
          const videoKey = `video_upload_${fileId}`;
          await saveFile(videoKey, videoFile);
          finalVideoUrl = `indexeddb://${videoKey}`;
          setSavingProgress(65);
          await delay(500);
        } else {
          setSavingProgress(65);
          await delay(700);
        }

        setSavingProgress(80);
        await delay(600);

        if (thumbnailFile) {
          setSavingProgress(88);
          await delay(500);
          const thumbKey = `thumb_upload_${fileId}`;
          await saveFile(thumbKey, thumbnailFile);
          finalThumbnailUrl = `indexeddb://${thumbKey}`;
          setSavingProgress(95);
          await delay(400);
        } else {
          setSavingProgress(95);
          await delay(500);
        }
      }

      setSavingProgress(100);
      await delay(400);

      const resolvedSeriesTitle = type === 'episode'
        ? (seriesSelectionMode === 'existing' ? seriesTitle : newSeriesTitle).trim() || 'Untitled Series'
        : undefined;

      onUpload({
        title: title.trim(),
        description: description.trim() || 'A user-uploaded presentation on CINEMAX stream.',
        category,
        type,
        seriesTitle: resolvedSeriesTitle,
        seasonNumber: type === 'episode' ? seasonNumber : undefined,
        episodeNumber: type === 'episode' ? episodeNumber : undefined,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        quality: autoQuality,
        uploadedBy: user.username,
        uploadedAt: new Date().toISOString(),
        isPublic: false, // Uploads must go through verification by admin!
        isTrending: false,
        isFeatured: false,
      });

      onClose();
    } catch (err) {
      console.error('Error saving files to local IndexedDB storage:', err);
      alert('Failed to save media files locally. Please check your storage size and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
        <div className="bg-[#0c0c0c] border border-white/10 rounded-xl max-w-md w-full p-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-[#E50914] mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-white">Profile Required to Upload</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Anyone can stream approved content online, but you must establish a fast profile username to upload video creators or access offline downloads.
          </p>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              id="upload-unauthorized-close"
              onClick={onClose}
              className="px-4 py-2 rounded bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="upload-unauthorized-signup"
              onClick={() => {
                onClose();
                onOpenProfileModal();
              }}
              className="px-4 py-2 rounded bg-[#E50914] hover:bg-[#b20710] text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Create Profile Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="upload-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-md"
    >
      <div
        id="upload-modal-container"
        className="relative bg-[#0c0c0c] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-8"
      >
        {isSaving && (
          <div className="absolute inset-0 bg-[#050505]/98 backdrop-blur-md z-[100] flex flex-col justify-center p-6 sm:p-10 space-y-6">
            <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
              <RefreshCw className="h-6 w-6 text-[#E50914] animate-spin" />
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-sans">
                  Server-Side Ingestion & Transcoding Pipeline
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Processing raw payload into Adaptive Bitrate Streaming (HLS) formats
                </p>
              </div>
            </div>

            {/* Transcoding pipeline simulation details */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-4 text-left space-y-3.5 font-mono">
              <div className="flex items-center justify-between text-[11px] border-b border-white/5 pb-2">
                <span className="text-zinc-550 font-semibold">Transcode Engine</span>
                <span className="text-green-500 font-bold uppercase">v2.4-HLS Active</span>
              </div>

              {/* Steps status list */}
              <div className="space-y-3">
                {[
                  {
                    title: 'Adaptive Video Transcoding (H.264)',
                    desc: 'Creating 1080p (6000k), 720p (3000k), 480p (1500k), 360p (800k) renditions...',
                    start: 0,
                    end: 65,
                  },
                  {
                    title: 'Segmenting & Audio Track Alignment (AAC)',
                    desc: 'Splitting streams into 6-second MPEG-TS segments with matching GOP boundaries...',
                    start: 65,
                    end: 80,
                  },
                  {
                    title: 'Master HLS .m3u8 Playlists compilation',
                    desc: 'Linking adaptive playlist index mapping and network bandwidth profiles...',
                    start: 80,
                    end: 95,
                  },
                  {
                    title: 'Writing Cloud Storage & Front-end Indexes',
                    desc: 'Storing segments safely to high-availability database and browser LocalCache...',
                    start: 95,
                    end: 101,
                  }
                ].map((step, idx) => {
                  const isDone = savingProgress >= step.end;
                  const isActive = savingProgress >= step.start && savingProgress < step.end;
                  
                  let stateColor = 'text-zinc-600';
                  let icon = <span className="h-1.5 w-1.5 bg-zinc-700 rounded-full inline-block" />;
                  
                  if (isDone) {
                    stateColor = 'text-green-400';
                    icon = <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />;
                  } else if (isActive) {
                    stateColor = 'text-white font-bold';
                    icon = (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50914]"></span>
                      </span>
                    );
                  }

                  return (
                    <div key={idx} className="flex items-start space-x-3 text-xs leading-tight transition-all duration-300">
                      <div className="pt-1 flex-shrink-0">{icon}</div>
                      <div className="space-y-0.5">
                        <p className={stateColor}>{step.title}</p>
                        {isActive && (
                          <p className="text-[10px] text-[#E50914] animate-pulse font-sans">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ingestion progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400 font-mono">
                <span>PROGRESS</span>
                <span>{savingProgress}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
                <div 
                  className="bg-[#E50914] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${savingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="h-5 w-5 text-[#E50914] animate-bounce" />
            <h2 className="text-lg font-bold text-white font-sans">Submit Video Release</h2>
          </div>
          <button
            id="close-upload-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/5 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-track-[#050505] scrollbar-thumb-zinc-850">
          
          {/* Quick Creator Tag */}
          <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs text-zinc-400 flex items-center justify-between">
            <span>Uploader account profile: <strong className="text-[#E50914]">@{user.username}</strong></span>
            <span className="bg-yellow-950/40 text-yellow-500 border border-yellow-900/30 text-[9px] px-2 py-0.5 rounded uppercase font-bold">
              Pending Admin Audit
            </span>
          </div>

          {/* Video file selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Video File Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Video Clip</label>
              <div 
                id="video-dropzone"
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center aspect-video ${
                  videoFile || videoUrl
                    ? 'border-green-800 bg-green-950/10'
                    : 'border-white/10 hover:border-white/20 bg-[#050505]'
                }`}
              >
                <input
                  id="video-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                
                {videoFile || videoUrl ? (
                  <div className="space-y-1">
                    <Check className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-xs font-bold text-zinc-200 truncate max-w-[200px]">
                      {videoFile ? videoFile.name : 'Sample Video Loaded'}
                    </p>
                    <p className="text-[10px] text-zinc-500">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Film className="h-8 w-8 text-zinc-600 mx-auto" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Choose MP4, MKV or MOV</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Drag & drop or browse</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[10px] text-zinc-500">No content file?</span>
                <button
                  id="load-sample-video-btn"
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[10px] text-[#E50914] hover:text-red-400 font-semibold underline cursor-pointer"
                >
                  Use Cinematic Sample Video
                </button>
              </div>
            </div>

            {/* Thumbnail Poster picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Poster / Thumbnail</label>
              <div 
                id="thumb-dropzone"
                onClick={() => thumbInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center aspect-video ${
                  thumbnailUrl
                    ? 'border-green-800'
                    : 'border-white/10 hover:border-white/20 bg-[#050505]'
                }`}
                style={{
                  backgroundImage: thumbnailUrl ? `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(${thumbnailUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <input
                  id="thumb-file-input"
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                />
                
                {!thumbnailUrl ? (
                  <div className="space-y-2">
                    <Image className="h-8 w-8 text-zinc-600 mx-auto" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Upload Poster Art</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">JPEG or PNG landscape</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-left w-full h-full flex flex-col justify-end p-2 bg-black/40 rounded-lg">
                    <p className="text-[10px] font-bold text-green-400 flex items-center">
                      <Check className="h-3 w-3 mr-0.5" /> Covered Thumbnail
                    </p>
                    <p className="text-[9px] text-zinc-300 truncate">Click to swap image poster</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auto Determined Specs Indicator */}
          {(isAnalyzing || analyzerLogs) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                <span>Auto-Determining Video Quality & Specs</span>
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#050505] p-2 rounded border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-zinc-500">Quality Spec</span>
                  <span className="text-xs font-bold text-green-400 font-mono">
                    {isAnalyzing ? 'Scanning...' : autoQuality}
                  </span>
                </div>
                <div className="bg-[#050505] p-2 rounded border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-zinc-500">Resolution</span>
                  <span className="text-xs font-bold text-zinc-300 font-mono">
                    {isAnalyzing ? '...' : analyzerLogs?.resolution || 'N/A'}
                  </span>
                </div>
                <div className="bg-[#050505] p-2 rounded border border-white/5">
                  <span className="block text-[9px] uppercase font-bold text-zinc-500">Clip Duration</span>
                  <span className="text-xs font-bold text-zinc-300 font-mono">
                    {isAnalyzing ? '...' : analyzerLogs?.duration || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Video Title</label>
            <input
              id="upload-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sintel: Guardians of Scales"
              className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
            />
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Synopsis / Description</label>
            <textarea
              id="upload-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a compelling overview of your movie story or series episode..."
              className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
            />
          </div>

          {/* Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Genre Category</label>
              <select
                id="upload-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Release Type</label>
              <div className="flex space-x-3 pt-0.5">
                <button
                  id="type-movie-btn"
                  type="button"
                  onClick={() => setType('movie')}
                  className={`flex-1 py-2 text-xs font-bold rounded border transition-all cursor-pointer ${
                    type === 'movie'
                      ? 'bg-red-950/25 text-[#E50914] border-red-900/40'
                      : 'bg-[#050505] text-zinc-450 border-white/10 hover:text-white'
                  }`}
                >
                  Single Movie
                </button>
                <button
                  id="type-episode-btn"
                  type="button"
                  onClick={() => setType('episode')}
                  className={`flex-1 py-2 text-xs font-bold rounded border transition-all cursor-pointer ${
                    type === 'episode'
                      ? 'bg-red-950/25 text-[#E50914] border-red-900/40'
                      : 'bg-[#050505] text-zinc-455 border-white/10 hover:text-white'
                  }`}
                >
                  Series Episode
                </button>
              </div>
            </div>
          </div>

          {/* Series Episode Fields */}
          {type === 'episode' && (
            <div id="series-inputs" className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
              
              {/* Select existing or create new Series toggle button group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Series Destination</label>
                <div className="flex space-x-3">
                  <button
                    id="series-mode-existing-btn"
                    type="button"
                    disabled={existingSeries.length === 0}
                    onClick={() => setSeriesSelectionMode('existing')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                      seriesSelectionMode === 'existing'
                        ? 'bg-red-950/20 text-[#E50914] border-red-900/40'
                        : 'bg-[#050505] text-zinc-500 border-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    Add to Existing Series
                  </button>
                  <button
                    id="series-mode-new-btn"
                    type="button"
                    onClick={() => setSeriesSelectionMode('new')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                      seriesSelectionMode === 'new'
                        ? 'bg-red-950/20 text-[#E50914] border-red-900/40'
                        : 'bg-[#050505] text-zinc-500 border-white/10 hover:text-white'
                    }`}
                  >
                    Start a New Series
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {seriesSelectionMode === 'existing' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Choose Series</label>
                    <select
                      id="existing-series-select"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914]"
                    >
                      {existingSeries.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Series Title / Franchise</label>
                    <input
                      id="series-title-input"
                      type="text"
                      required={type === 'episode' && seriesSelectionMode === 'new'}
                      value={newSeriesTitle}
                      onChange={(e) => setNewSeriesTitle(e.target.value)}
                      placeholder="e.g. Amor y Venganza"
                      className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                )}

                {/* Info block displaying auto-filled smart details */}
                {seriesSelectionMode === 'existing' && seriesTitle && (
                  <div className="bg-[#050505] border border-white/5 rounded px-3.5 py-2.5 flex flex-col justify-center text-xs text-zinc-400">
                    <span className="text-[10px] uppercase font-bold text-red-500">Auto-Fill Smart Match</span>
                    <p className="mt-0.5 leading-relaxed">
                      We scanned existing media: suggesting next logical episode slot in Season {seasonNumber}.
                    </p>
                  </div>
                )}
                {seriesSelectionMode === 'new' && (
                  <div className="bg-[#050505] border border-white/5 rounded px-3.5 py-2.5 flex flex-col justify-center text-xs text-zinc-400">
                    <span className="text-[10px] uppercase font-bold text-yellow-500">Creating Franchise</span>
                    <p className="mt-0.5 leading-relaxed">
                      This will register a new franchise. You'll be the original season creator!
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Season #</label>
                  <input
                    id="season-number-input"
                    type="number"
                    min={1}
                    required={type === 'episode'}
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Episode #</label>
                  <input
                    id="episode-number-input"
                    type="number"
                    min={1}
                    required={type === 'episode'}
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#050505] border border-white/10 text-white rounded px-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              id="upload-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="upload-submit-btn"
              type="submit"
              disabled={!title.trim() || !videoUrl || !thumbnailUrl}
              className="px-5 py-2 rounded bg-[#E50914] hover:bg-[#b20710] disabled:opacity-50 disabled:hover:bg-[#E50914] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
