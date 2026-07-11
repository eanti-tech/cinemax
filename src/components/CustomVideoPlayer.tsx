/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  ChevronLeft, Award, Sparkles, AlertCircle, Eye, Settings, EyeOff,
  Download, Check, Minimize2, Maximize2, X, Tv, SkipForward, SkipBack
} from 'lucide-react';
import { Video, DownloadItem, UserProfile } from '../types';

interface CustomVideoPlayerProps {
  video: Video | null;
  onClose: () => void;
  user?: UserProfile | null;
  onOpenProfileModal?: () => void;
  downloads?: DownloadItem[];
  onDownloadVideo?: (video: Video) => void;
  allVideos?: Video[];
  onPlayVideo?: (video: Video) => void;
  dragConstraintsRef?: React.RefObject<HTMLDivElement | null>;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
}

export default function CustomVideoPlayer({
  video,
  onClose,
  user,
  onOpenProfileModal,
  downloads = [],
  onDownloadVideo,
  allVideos = [],
  onPlayVideo,
  dragConstraintsRef,
  isMinimized = false,
  onMinimizeChange,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ambientVideoRef = useRef<HTMLVideoElement | null>(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [subtitleTrackUrl, setSubtitleTrackUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const getNormalizedQuality = (qual?: string) => {
    if (!qual) return '1080p Full HD';
    if (qual.includes('1080')) return '1080p Full HD';
    if (qual.includes('720')) return '720p HD';
    if (qual.includes('480')) return '480p SD';
    return '1080p Full HD';
  };

  const [customQuality, setCustomQuality] = useState(getNormalizedQuality(video?.quality));
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [localIsMini, setLocalIsMini] = useState(false);
  const isMini = onMinimizeChange ? isMinimized : localIsMini;
  const setIsMini = (val: boolean) => {
    if (onMinimizeChange) {
      onMinimizeChange(val);
    } else {
      setLocalIsMini(val);
    }
  };
  const [isNativePiP, setIsNativePiP] = useState(false);

  // Drag coordinates for resetting miniplayer position
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  useEffect(() => {
    if (!isMini) {
      dragX.set(0);
      dragY.set(0);
    }
  }, [isMini, dragX, dragY]);

  // Listen for native Picture-in-Picture entry/exit to sync custom state
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnterPiP = () => {
      setIsNativePiP(true);
      setIsMini(true);
    };

    const handleLeavePiP = () => {
      setIsNativePiP(false);
      setIsMini(false);
    };

    videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  const handleMinimizeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (isMini) {
      setIsMini(false);
      setIsNativePiP(false);
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
        } catch (err) {
          console.error("Failed to exit native PiP:", err);
        }
      }
    } else {
      // Try native Picture-in-Picture first
      if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
        try {
          await videoRef.current.requestPictureInPicture();
          return; // The enterpictureinpicture listener will set isMini(true) and isNativePiP(true)
        } catch (err) {
          console.warn("Failed to request native PiP, falling back to in-app miniplayer:", err);
        }
      }
      setIsMini(true);
    }
  };

  useEffect(() => {
    if (video) {
      setCustomQuality(getNormalizedQuality(video.quality));
    }
  }, [video]);

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


  // Setup subtitle track object url if raw subtitle exists
  useEffect(() => {
    if (!video || !video.subtitles) {
      setSubtitleTrackUrl('');
      return;
    }

    const blob = new Blob([video.subtitles], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    setSubtitleTrackUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [video]);

  // Resolve video URL from IndexedDB (offline file) or remote source
  useEffect(() => {
    if (!video) return;

    let active = true;
    let objectUrl = '';

    const loadVideoSrc = async () => {
      try {
        // Only signed in users can play offline (IndexedDB downloads)
        if (!user) {
          setResolvedVideoUrl(video.videoUrl);
          return;
        }

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
  }, []);

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

  // Find next episode if any
  const getNextEpisode = (): Video | null => {
    if (!video || video.type !== 'episode' || !video.seriesTitle || !allVideos) return null;
    
    // Sort all public episodes of this series
    const publicEpisodes = allVideos.filter(
      (v) => v.type === 'episode' && v.seriesTitle === video.seriesTitle && v.isPublic
    ).sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) {
        return (a.seasonNumber || 1) - (b.seasonNumber || 1);
      }
      return (a.episodeNumber || 1) - (b.episodeNumber || 1);
    });

    // Find the current index
    const currentIndex = publicEpisodes.findIndex((v) => v.id === video.id);
    if (currentIndex !== -1 && currentIndex < publicEpisodes.length - 1) {
      return publicEpisodes[currentIndex + 1];
    }
    return null;
  };

  // Find previous episode if any
  const getPreviousEpisode = (): Video | null => {
    if (!video || video.type !== 'episode' || !video.seriesTitle || !allVideos) return null;
    
    // Sort all public episodes of this series
    const publicEpisodes = allVideos.filter(
      (v) => v.type === 'episode' && v.seriesTitle === video.seriesTitle && v.isPublic
    ).sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) {
        return (a.seasonNumber || 1) - (b.seasonNumber || 1);
      }
      return (a.episodeNumber || 1) - (b.episodeNumber || 1);
    });

    // Find the current index
    const currentIndex = publicEpisodes.findIndex((v) => v.id === video.id);
    if (currentIndex !== -1 && currentIndex > 0) {
      return publicEpisodes[currentIndex - 1];
    }
    return null;
  };

  const nextEpisode = getNextEpisode();
  const prevEpisode = getPreviousEpisode();

  const [resolvedNextVideoUrl, setResolvedNextVideoUrl] = useState<string>('');
  const [nextSubtitleTrackUrl, setNextSubtitleTrackUrl] = useState<string>('');
  const nextVideoRef = useRef<HTMLVideoElement | null>(null);
  const initialSeekTimeRef = useRef<number>(0);
  const nextVideoPlayPromiseRef = useRef<Promise<void> | null>(null);

  const remainingTime = duration > 0 ? Math.max(0, duration - currentTime) : 10;
  const isCrossfading = video?.type === 'episode' && nextEpisode !== null && duration > 10 && remainingTime <= 10;

  // Resolve next video URL from IndexedDB or remote source
  useEffect(() => {
    if (!nextEpisode) {
      setResolvedNextVideoUrl('');
      setNextSubtitleTrackUrl('');
      return;
    }

    let active = true;
    let objectUrl = '';

    const loadNextVideoSrc = async () => {
      try {
        // Only signed in users can play offline (IndexedDB downloads)
        if (!user) {
          setResolvedNextVideoUrl(nextEpisode.videoUrl);
          return;
        }

        const { getFile } = await import('../lib/indexedDB');
        
        if (nextEpisode.videoUrl.startsWith('indexeddb://')) {
          const key = nextEpisode.videoUrl.replace('indexeddb://', '');
          const blob = await getFile(key);
          if (active) {
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedNextVideoUrl(objectUrl);
            } else {
              setResolvedNextVideoUrl('');
            }
          }
        } else {
          const key = `video_${nextEpisode.id}`;
          const blob = await getFile(key);
          if (active) {
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedNextVideoUrl(objectUrl);
            } else {
              setResolvedNextVideoUrl(nextEpisode.videoUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error resolving next video offline url:', err);
        if (active) {
          setResolvedNextVideoUrl(nextEpisode.videoUrl);
        }
      }
    };

    loadNextVideoSrc();

    if (nextEpisode.subtitles) {
      const blob = new Blob([nextEpisode.subtitles], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setNextSubtitleTrackUrl(url);
    } else {
      setNextSubtitleTrackUrl('');
    }

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [nextEpisode]);

  // Sync next video play/pause and playback speed during crossfade
  useEffect(() => {
    const nextVideo = nextVideoRef.current;
    if (!nextVideo) return;

    if (isCrossfading && isPlaying) {
      if (nextVideo.paused) {
        nextVideo.playbackRate = playbackSpeed;
        const playPromise = nextVideo.play();
        nextVideoPlayPromiseRef.current = playPromise;
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.error("Error playing crossfaded next video:", err);
          }
        });
      }
    } else {
      const playPromise = nextVideoPlayPromiseRef.current;
      if (playPromise) {
        playPromise
          .then(() => {
            if (!isCrossfading || !isPlaying) {
              nextVideo.pause();
              if (!isCrossfading) {
                nextVideo.currentTime = 0;
              }
            }
          })
          .catch(() => {
            // Ignored, safe to pause anyway if needed
            if (!isCrossfading || !isPlaying) {
              nextVideo.pause();
              if (!isCrossfading) {
                nextVideo.currentTime = 0;
              }
            }
          })
          .finally(() => {
            nextVideoPlayPromiseRef.current = null;
          });
      } else {
        if (!nextVideo.paused) {
          nextVideo.pause();
        }
        if (!isCrossfading) {
          nextVideo.currentTime = 0;
        }
      }
    }
  }, [isCrossfading, isPlaying, playbackSpeed, resolvedNextVideoUrl]);

  // Continuously adjust main and next video volume during crossfade
  useEffect(() => {
    const mainVideo = videoRef.current;
    const nextVideo = nextVideoRef.current;
    if (!mainVideo) return;

    const baseVolume = isMuted ? 0 : volume;

    if (isCrossfading) {
      const progress = Math.max(0, Math.min(1, remainingTime / 10)); // 1.0 at 10s remaining, 0.0 at end
      mainVideo.volume = baseVolume * progress;
      if (nextVideo) {
        nextVideo.volume = baseVolume * (1 - progress);
      }
    } else {
      mainVideo.volume = baseVolume;
      if (nextVideo) {
        nextVideo.volume = 0;
      }
    }
  }, [currentTime, duration, isCrossfading, remainingTime, volume, isMuted]);

  // Handle automatic transition to the next episode when current ends
  const handleEnded = () => {
    if (nextEpisode && onPlayVideo) {
      if (isCrossfading && nextVideoRef.current) {
        initialSeekTimeRef.current = nextVideoRef.current.currentTime;
      } else {
        initialSeekTimeRef.current = 0;
      }
      onPlayVideo(nextEpisode);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && initialSeekTimeRef.current > 0) {
      videoRef.current.currentTime = initialSeekTimeRef.current;
      initialSeekTimeRef.current = 0;
    }
  };

  return (
    <motion.div
      drag={isMini && !isNativePiP}
      dragConstraints={dragConstraintsRef}
      dragElastic={0.05}
      dragMomentum={false}
      id={isMini ? "custom-cinematic-player-mini" : "custom-cinematic-player"}
      className={
        isNativePiP
          ? "fixed opacity-0 pointer-events-none w-0 h-0 overflow-hidden z-[200]"
          : isMini 
          ? "fixed bottom-24 right-4 sm:right-6 md:right-8 z-[200] w-72 sm:w-[360px] aspect-video bg-[#0b0b0b] border-2 border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col group/mini cursor-grab active:cursor-grabbing select-none"
          : "fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden select-none"
      }
      style={{ 
        x: dragX,
        y: dragY,
        cursor: isNativePiP ? 'default' : isMini ? 'grab' : (showControls ? 'default' : 'none') 
      }}
    >
      {/* Ambient "Ambilight" Theater Glow Video */}
      {resolvedVideoUrl && (
        <video
          key="ambient-glow-video"
          ref={ambientVideoRef}
          src={resolvedVideoUrl}
          className={`absolute inset-0 w-full h-full object-contain scale-[1.12] blur-[80px] md:blur-[120px] opacity-45 pointer-events-none z-0 select-none brightness-125 saturate-150 transition-opacity duration-500 ${
            isMini ? 'hidden' : 'block'
          }`}
          playsInline
          muted
        />
      )}

      {/* Main Video Element */}
      <video
        key="main-player-video"
        id="html5-video-player"
        ref={videoRef}
        src={resolvedVideoUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onClick={isMini ? undefined : togglePlay}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ opacity: isCrossfading ? Math.max(0, Math.min(1, remainingTime / 10)) : 1 }}
        className={
          isMini 
            ? "w-full h-full object-cover z-10 pointer-events-none" 
            : "w-full h-full object-contain z-10"
        }
        playsInline
      >
        {subtitleTrackUrl && (
          <track
            kind="subtitles"
            src={subtitleTrackUrl}
            srcLang="en"
            label="English"
            default
          />
        )}
      </video>

      {/* Crossfading Next Episode Video Element */}
      {resolvedNextVideoUrl && (
        <video
          key="next-player-video"
          id="html5-video-player-next"
          ref={nextVideoRef}
          src={resolvedNextVideoUrl}
          className={
            isMini 
              ? "absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
              : "absolute inset-0 w-full h-full object-contain z-0"
          }
          style={{
            opacity: isCrossfading ? Math.max(0, Math.min(1, 1 - (remainingTime / 10))) : 0,
            pointerEvents: 'none'
          }}
          playsInline
          muted={isMuted}
        >
          {nextSubtitleTrackUrl && (
            <track
              kind="subtitles"
              src={nextSubtitleTrackUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      )}

      {/* MINI MODE CONTROLS */}
      {isMini && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/80 opacity-0 group-hover/mini:opacity-100 transition-opacity duration-200 z-20 flex flex-col justify-between p-2.5 pointer-events-auto">
          {/* Top Bar inside mini mode */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-100 truncate max-w-[65%]">
              {video.title}
            </span>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMini(false);
                }}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Restore Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 rounded-full bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Close Player"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Central Play/Pause and Next Trigger */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-black/65 backdrop-blur-sm border border-zinc-850 rounded-full h-9 w-9 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 ml-0.5" />}
            </button>

            {nextEpisode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPlayVideo) onPlayVideo(nextEpisode);
                }}
                className="bg-black/65 backdrop-blur-sm border border-zinc-850 rounded-full h-9 w-9 flex items-center justify-center text-white hover:text-red-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={`Next: Ep #${nextEpisode.episodeNumber}`}
              >
                <SkipForward className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Bottom Row / Seek Timeline inside mini mode */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="relative w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-150"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN HUD CONTROLS (Only visible if not mini mode) */}
      {!isMini && (
        <>
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

          {/* CENTRALIZED PLAY/PAUSE & EPISODE TRANSITION TRIGGER CONTROLS */}
          {showControls && (
            <div className="absolute inset-0 m-auto h-24 flex items-center justify-center gap-6 z-40 pointer-events-auto">
              {/* Previous Episode Button */}
              {video.type === 'episode' && (
                <button
                  id="hud-central-prev-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (prevEpisode && onPlayVideo) {
                      onPlayVideo(prevEpisode);
                    }
                  }}
                  disabled={!prevEpisode}
                  className={`bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-full h-14 w-14 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                    !prevEpisode ? 'opacity-30 cursor-not-allowed hover:scale-100' : 'hover:text-red-500'
                  }`}
                  title={prevEpisode ? `Previous: Episode ${prevEpisode.episodeNumber}` : 'No previous episode'}
                >
                  <SkipBack className="h-6 w-6" />
                </button>
              )}

              {/* Central Play/Pause Button */}
              <button
                id="hud-central-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/10 rounded-full h-20 w-20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xl shadow-black/80"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </button>

              {/* Next Episode Button */}
              {video.type === 'episode' && (
                <button
                  id="hud-central-next-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (nextEpisode && onPlayVideo) {
                      onPlayVideo(nextEpisode);
                    }
                  }}
                  disabled={!nextEpisode}
                  className={`bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/10 rounded-full h-14 w-14 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                    !nextEpisode ? 'opacity-30 cursor-not-allowed hover:scale-100' : 'hover:text-red-500'
                  }`}
                  title={nextEpisode ? `Next: Episode ${nextEpisode.episodeNumber}` : 'No next episode'}
                >
                  <SkipForward className="h-6 w-6" />
                </button>
              )}
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

                {/* In-app Mini/Floating Player Toggle */}
                <button
                  id="hud-minimize-player-btn"
                  onClick={handleMinimizeToggle}
                  className="text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  title="Minimize to Floating Player"
                >
                  <Minimize2 className="h-5 w-5" />
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

                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider border-b border-zinc-900 pb-1.5 mb-1.5">Video Quality</p>
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
        </>
      )}
    </motion.div>
  );
}
