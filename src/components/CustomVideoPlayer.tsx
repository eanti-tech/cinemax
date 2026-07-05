/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  ChevronLeft, Award, Sparkles, AlertCircle, Eye, Settings, EyeOff,
  Download, Check
} from 'lucide-react';
import { Video, DownloadItem, UserProfile } from '../types';

interface CustomVideoPlayerProps {
  video: Video | null;
  onClose: () => void;
  user?: UserProfile | null;
  onOpenProfileModal?: () => void;
  downloads?: DownloadItem[];
  onDownloadVideo?: (video: Video) => void;
}

export default function CustomVideoPlayer({
  video,
  onClose,
  user,
  onOpenProfileModal,
  downloads = [],
  onDownloadVideo,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ambientVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [customQuality, setCustomQuality] = useState(video?.quality || '1080p HD');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Download simulation states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Seeker dragging states
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  const isDownloaded = downloads.some((d) => d.videoId === video?.id);

  // Sync sliderValue with currentTime when NOT seeking
  useEffect(() => {
    if (!isSeeking) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  // Hide controls after 3.5 seconds of user inactivity (mouse or touch)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleInteraction = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3500);
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');

  // Resolve video URL from IndexedDB (offline file) or remote source
  useEffect(() => {
    if (!video) return;

    let active = true;
    let objectUrl = '';

    const loadVideoSrc = async () => {
      try {
        const { getFile } = await import('../lib/indexedDB');
        
        // 1. If video was uploaded locally via IndexedDB scheme
        if (video.videoUrl.startsWith('indexeddb://')) {
          const key = video.videoUrl.replace('indexeddb://', '');
          const blob = await getFile(key);
          if (active) {
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedVideoUrl(objectUrl);
            } else {
              setResolvedVideoUrl('');
            }
          }
        } else {
          // 2. Otherwise check if there is an offline download saved in IndexedDB for this video
          const key = `video_${video.id}`;
          const blob = await getFile(key);
          if (active) {
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedVideoUrl(objectUrl);
            } else {
              setResolvedVideoUrl(video.videoUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error resolving video offline url:', err);
        if (active) {
          setResolvedVideoUrl(video.videoUrl);
        }
      }
    };

    loadVideoSrc();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [video]);

  // Play video only when resolved url is available, ensuring audio volume, speed and muted properties are in sync
  useEffect(() => {
    if (videoRef.current && resolvedVideoUrl) {
      videoRef.current.load();
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (ambientVideoRef.current) {
            ambientVideoRef.current.play().catch(() => {});
          }
        })
        .catch(() => setIsPlaying(false));
    }
    if (ambientVideoRef.current && resolvedVideoUrl) {
      ambientVideoRef.current.load();
      ambientVideoRef.current.volume = 0;
      ambientVideoRef.current.muted = true;
      ambientVideoRef.current.playbackRate = playbackSpeed;
    }
  }, [resolvedVideoUrl]);

  // Sync ambient video play, pause, seek, speed changes continuously
  useEffect(() => {
    const mainVideo = videoRef.current;
    const ambientVideo = ambientVideoRef.current;
    if (!mainVideo || !ambientVideo) return;

    const handlePlay = () => {
      ambientVideo.play().catch(() => {});
    };

    const handlePause = () => {
      ambientVideo.pause();
    };

    const handleSeeking = () => {
      ambientVideo.currentTime = mainVideo.currentTime;
    };

    const handleRateChange = () => {
      ambientVideo.playbackRate = mainVideo.playbackRate;
    };

    mainVideo.addEventListener('play', handlePlay);
    mainVideo.addEventListener('pause', handlePause);
    mainVideo.addEventListener('seeking', handleSeeking);
    mainVideo.addEventListener('seeked', handleSeeking);
    mainVideo.addEventListener('ratechange', handleRateChange);

    return () => {
      mainVideo.removeEventListener('play', handlePlay);
      mainVideo.removeEventListener('pause', handlePause);
      mainVideo.removeEventListener('seeking', handleSeeking);
      mainVideo.removeEventListener('seeked', handleSeeking);
      mainVideo.removeEventListener('ratechange', handleRateChange);
    };
  }, [resolvedVideoUrl]);

  // Sync volume state to video ref on state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!video) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        if (ambientVideoRef.current) {
          ambientVideoRef.current.pause();
        }
      } else {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            if (ambientVideoRef.current) {
              ambientVideoRef.current.play().catch(() => {});
            }
          })
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setSliderValue(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    if (ambientVideoRef.current) {
      ambientVideoRef.current.currentTime = newTime;
    }
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const targetMute = !isMuted;
      videoRef.current.muted = targetMute;
      setIsMuted(targetMute);
      if (!targetMute && volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onOpenProfileModal) {
        onOpenProfileModal();
      }
      return;
    }

    if (isDownloaded || isDownloading || downloadSuccess) return;

    // Simulate download progress
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSuccess(false);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadSuccess(true);
            if (onDownloadVideo) {
              onDownloadVideo(video);
            }
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      id="custom-cinematic-player"
      className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden select-none select-none cursor-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Ambient "Ambilight" Theater Glow Video */}
      {resolvedVideoUrl && (
        <video
          ref={ambientVideoRef}
          src={resolvedVideoUrl}
          className="absolute inset-0 w-full h-full object-contain scale-[1.12] blur-[80px] md:blur-[120px] opacity-45 pointer-events-none z-0 select-none brightness-125 saturate-150 transition-opacity duration-500"
          playsInline
          muted
        />
      )}

      {/* Video Element */}
      <video
        id="html5-video-player"
        ref={videoRef}
        src={resolvedVideoUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onClick={togglePlay}
        className="w-full h-full object-contain z-10"
        playsInline
      />

      {/* BACK / TITLE CONTROLLER (TOP HEADER) */}
      <div 
        className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent p-6 flex items-center justify-between transition-opacity duration-300 z-50 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-start w-12">
          <button
            id="exit-player-btn"
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Exit Cinema"
          >
            <ChevronLeft className="h-5 w-5 -ml-0.5" />
          </button>
        </div>

        <div className="text-center flex-1 mx-4">
          <p className="text-zinc-100 font-extrabold text-sm tracking-wide sm:text-base truncate max-w-[280px] sm:max-w-md mx-auto">
            {video.title}
          </p>
          {video.type === 'episode' && (
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">
              {video.seriesTitle} • Season {video.seasonNumber || 1} • Episode {video.episodeNumber}
            </p>
          )}
        </div>

        {/* Download Button in Symmetrical Right Position */}
        <div className="flex items-center justify-end w-12">
          <button
            id="player-header-download-btn"
            onClick={handleDownloadClick}
            disabled={isDownloading || downloadSuccess}
            className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all duration-200 cursor-pointer ${
              isDownloaded || downloadSuccess
                ? 'bg-green-950/40 border-green-500/50 text-green-400'
                : isDownloading
                ? 'bg-red-950/40 border-red-500/50 text-red-400'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
            title={
              isDownloaded || downloadSuccess
                ? 'Downloaded Offline'
                : isDownloading
                ? `Downloading (${downloadProgress}%)`
                : 'Download Offline'
            }
          >
            {isDownloaded || downloadSuccess ? (
              <Check className="h-4 w-4" />
            ) : isDownloading ? (
              <span className="text-[10px] font-mono font-black">{downloadProgress}%</span>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* CENTRALIZED BIG PLAY/PAUSE TRIGGER INDICATOR (Visual flare) */}
      {showControls && (
        <div className="absolute inset-0 m-auto h-20 w-20 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-black/60 backdrop-blur-sm border border-zinc-800 rounded-full h-20 w-20 flex items-center justify-center text-white scale-90 opacity-80">
            {isPlaying ? <Pause className="h-8 w-8 ml-0.5" /> : <Play className="h-8 w-8 ml-1" />}
          </div>
        </div>
      )}

      {/* CONTROL HUD (BOTTOM RAIL) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 flex flex-col justify-end transition-opacity duration-300 z-50 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider / Seeker */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-xs font-mono text-zinc-300">{formatTime(currentTime)}</span>
          <input
            id="seeker-slider"
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={sliderValue}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchStart={handleSeekMouseDown}
            onTouchEnd={handleSeekMouseUp}
            onChange={handleSeekChange}
            className="flex-1 accent-red-600 bg-zinc-700 h-1.5 rounded-full cursor-pointer hover:h-2.5 transition-all"
          />
          <span className="text-xs font-mono text-zinc-300">{formatTime(duration)}</span>
        </div>

        {/* Lower row details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            
            {/* Play trigger */}
            <button
              id="hud-play-btn"
              onClick={togglePlay}
              className="text-zinc-200 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            {/* Volume controls */}
            <div className="flex items-center space-x-2">
              <button
                id="hud-mute-btn"
                onClick={toggleMute}
                className="text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                id="volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-red-600 bg-zinc-700 h-1 rounded-full cursor-pointer hidden sm:block"
              />
            </div>
          </div>

          {/* Right Control Actions */}
          <div className="flex items-center space-x-6 relative">
            
            {/* Speed / Settings controller */}
            <button
              id="hud-settings-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="text-zinc-200 hover:text-white transition-colors flex items-center cursor-pointer"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Quick Speed / Quality context overlay dropdown */}
            {showSettingsMenu && (
              <div 
                id="player-settings-dropdown"
                className="absolute right-12 bottom-8 w-44 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl z-50 text-xs"
              >
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider border-b border-zinc-900 pb-1.5 mb-1.5">Speed Rate</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`py-1 rounded font-mono font-bold cursor-pointer ${
                        playbackSpeed === speed 
                          ? 'bg-red-950 text-red-400 border border-red-900' 
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider border-b border-zinc-900 pb-1.5 mb-1.5">Simulation Resolution</p>
                <div className="space-y-1">
                  {['1080p Full HD', '720p HD', '480p SD'].map((qual) => (
                    <button
                      key={qual}
                      onClick={() => {
                        setCustomQuality(qual);
                        setShowSettingsMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded font-mono font-bold text-[10px] flex justify-between items-center cursor-pointer ${
                        customQuality === qual 
                          ? 'bg-green-950 text-green-400 border border-green-900' 
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{qual}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fullscreen indicator */}
            <button
              id="hud-fullscreen-btn"
              onClick={toggleFullscreen}
              className="text-zinc-200 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen Mode"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
