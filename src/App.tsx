/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Play, Heart, Download, Tv, Monitor, Film, Search, 
  Sparkles, Check, Flame, ShieldAlert, ArrowRight, Home, HelpCircle, DownloadCloud, Bookmark,
  Pause, Clock, Trash2, RefreshCw
} from 'lucide-react';

import { Video, Comment, UserProfile, DownloadItem, CATEGORIES, Category } from './types';
import { INITIAL_VIDEOS, INITIAL_COMMENTS } from './data';
import { CONFIG } from './config';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import VideoGrid from './components/VideoGrid';
import VideoDetailModal from './components/VideoDetailModal';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import CreateProfileModal from './components/CreateProfileModal';
import UploadModal from './components/UploadModal';
import AdminPanel from './components/AdminPanel';
import CineImage from './components/CineImage';
import CategoryExplore from './components/CategoryExplore';

export default function App() {
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Core Database States (persisted via LocalStorage)
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');

  // Navigation and Interactive UI states
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedExploreCategory, setSelectedExploreCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  // Modal display toggles
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isUploadHovered, setIsUploadHovered] = useState<boolean>(false);

  // Feedback Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unviewed items notification dots
  const [hasNewWatchlist, setHasNewWatchlist] = useState<boolean>(false);
  const [hasNewDownloads, setHasNewDownloads] = useState<boolean>(false);

  // Initialize Database from LocalStorage or mock data
  useEffect(() => {
    const storedVideos = localStorage.getItem('cinemax_videos_v1');
    const storedComments = localStorage.getItem('cinemax_comments_v1');
    const storedUser = localStorage.getItem('cinemax_user_v1');
    const storedDownloads = localStorage.getItem('cinemax_downloads_v1');
    const storedWatchlist = localStorage.getItem('cinemax_watchlist_v1');
    const storedHasNewWatchlist = localStorage.getItem('cinemax_has_new_watchlist_v1');
    const storedHasNewDownloads = localStorage.getItem('cinemax_has_new_downloads_v1');
    const storedAnnouncement = localStorage.getItem('cinemax_announcement_v1');

    const loadVideos = async () => {
      if (CONFIG.CLOUDFLARE.USE_CLOUDFLARE_BACKEND) {
        try {
          const response = await fetch(`${CONFIG.CLOUDFLARE.API_BASE_URL}/upload`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              setVideos(data);
              localStorage.setItem('cinemax_videos_v1', JSON.stringify(data));
              return;
            }
          }
        } catch (err) {
          console.error('Failed to load catalog from Cloudflare, falling back to local:', err);
        }
      }

      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      } else {
        setVideos(INITIAL_VIDEOS);
        localStorage.setItem('cinemax_videos_v1', JSON.stringify(INITIAL_VIDEOS));
      }
    };

    loadVideos();

    if (storedComments) {
      setComments(JSON.parse(storedComments));
    } else {
      setComments(INITIAL_COMMENTS);
      localStorage.setItem('cinemax_comments_v1', JSON.stringify(INITIAL_COMMENTS));
    }

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.username === 'oanti') {
        parsedUser.role = 'admin';
      }
      setUser(parsedUser);
    }

    // Load downloads from IndexedDB with localStorage fallback
    import('./lib/indexedDB').then(({ getDownloadsList }) => {
      getDownloadsList().then((dbList) => {
        if (dbList && dbList.length > 0) {
          setDownloads(dbList);
        } else if (storedDownloads) {
          const parsed = JSON.parse(storedDownloads);
          setDownloads(parsed);
          import('./lib/indexedDB').then(({ saveDownloadsList }) => {
            saveDownloadsList(parsed).catch(err => console.error(err));
          });
        }
      }).catch(() => {
        if (storedDownloads) {
          setDownloads(JSON.parse(storedDownloads));
        }
      });
    }).catch(() => {
      if (storedDownloads) {
        setDownloads(JSON.parse(storedDownloads));
      }
    });

    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
    }

    if (storedHasNewWatchlist === 'true') {
      setHasNewWatchlist(true);
    }
    if (storedHasNewDownloads === 'true') {
      setHasNewDownloads(true);
    }
    if (storedAnnouncement) {
      setAnnouncement(storedAnnouncement);
    }
  }, []);

  // Clear unviewed bubbles when entering respective tab
  useEffect(() => {
    if (currentTab === 'watchlist') {
      setHasNewWatchlist(false);
      localStorage.setItem('cinemax_has_new_watchlist_v1', 'false');
    }
    if (currentTab === 'downloads') {
      setHasNewDownloads(false);
      localStorage.setItem('cinemax_has_new_downloads_v1', 'false');
    }
  }, [currentTab]);

  // Background Download Simulation Queue Engine
  useEffect(() => {
    const activeDownloadingItem = downloads.find((d) => d.status === 'downloading');

    if (!activeDownloadingItem) {
      // No active download, let's see if we can start the next 'queued' item
      const nextQueuedItem = downloads.find((d) => d.status === 'queued');
      if (nextQueuedItem) {
        const updated = downloads.map((d) => {
          if (d.videoId === nextQueuedItem.videoId) {
            return { ...d, status: 'downloading' as const, progress: d.progress ?? 0 };
          }
          return d;
        });
        saveDownloadsState(updated);
      }
      return;
    }

    // Advance download progress
    const timer = setTimeout(() => {
      let reached100 = false;
      let completedItem: DownloadItem | null = null;

      const updated = downloads.map((d) => {
        if (d.videoId === activeDownloadingItem.videoId) {
          const currentProgress = d.progress ?? 0;
          if (currentProgress >= 100) {
            reached100 = true;
            completedItem = d;
            return { ...d, status: 'completed' as const, progress: 100, downloadedAt: new Date().toISOString() };
          }
          const nextProgress = Math.min(100, currentProgress + 10);
          if (nextProgress === 100) {
            reached100 = true;
            completedItem = d;
            return { ...d, status: 'completed' as const, progress: 100, downloadedAt: new Date().toISOString() };
          }
          return { ...d, progress: nextProgress };
        }
        return d;
      });

      saveDownloadsState(updated);

      if (reached100 && completedItem) {
        const item: DownloadItem = completedItem;
        // Trigger IndexedDB and Cache API saves on complete
        import('./lib/indexedDB').then(async ({ saveFile, cacheAsset }) => {
          try {
            // 1. Fetch thumbnail and cache it in Cache API
            if (item.thumbnailUrl) {
              await cacheAsset(item.thumbnailUrl);
            }
            
            // 2. Fetch the video and save it in IndexedDB
            const actualVideo = videos.find((v) => v.id === item.videoId);
            const videoUrl = actualVideo?.videoUrl;
            if (videoUrl) {
              try {
                // Fetch first 500KB as a playable representative slice
                const response = await fetch(videoUrl, { headers: { 'Range': 'bytes=0-512000' } });
                const blob = await response.blob();
                await saveFile(`video_${item.videoId}`, blob);
              } catch (e) {
                // Fallback to synthetic offline playable video Blob
                const mockBlob = new Blob(['cinemax_offline_video_data_stream'], { type: 'video/mp4' });
                await saveFile(`video_${item.videoId}`, mockBlob);
              }
            }
          } catch (err) {
            console.error('Offline storage sync failed:', err);
          }
        }).catch(err => console.error(err));
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [downloads, videos]);

  // Lock background scrolling when fullscreen video player, more info modal, or upload/profile modal is open
  useEffect(() => {
    if (playingVideo || selectedVideo || showProfileModal || showUploadModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [playingVideo, selectedVideo, showProfileModal, showUploadModal]);

  // Scroll to top on tab changes to keep views independent
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  // Sync Helpers
  const saveVideosState = async (updatedVideos: Video[]) => {
    setVideos(updatedVideos);
    localStorage.setItem('cinemax_videos_v1', JSON.stringify(updatedVideos));

    if (CONFIG.CLOUDFLARE.USE_CLOUDFLARE_BACKEND) {
      try {
        await fetch(`${CONFIG.CLOUDFLARE.API_BASE_URL}/upload?action=catalog`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedVideos),
        });
      } catch (err) {
        console.error('Failed to sync catalog to Cloudflare:', err);
      }
    }
  };

  const saveCommentsState = (updatedComments: Comment[]) => {
    setComments(updatedComments);
    localStorage.setItem('cinemax_comments_v1', JSON.stringify(updatedComments));
  };

  const saveDownloadsState = (updatedDownloads: DownloadItem[]) => {
    setDownloads(updatedDownloads);
    localStorage.setItem('cinemax_downloads_v1', JSON.stringify(updatedDownloads));
    import('./lib/indexedDB').then(({ saveDownloadsList }) => {
      saveDownloadsList(updatedDownloads).catch((err) => console.error(err));
    }).catch((err) => console.error(err));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Profile Handlers
  const handleCreateProfile = (username: string) => {
    const isOanti = username.trim().toLowerCase() === 'oanti';
    const newProfile: UserProfile = {
      username,
      createdAt: new Date().toISOString(),
      role: isOanti ? 'admin' : 'user',
    };
    setUser(newProfile);
    localStorage.setItem('cinemax_user_v1', JSON.stringify(newProfile));
    if (isOanti) {
      showToast(`Welcome Admin @${username}! Click your name in the profile menu to input your PIN.`);
    } else {
      showToast(`Welcome to CINEMAX, @${username}! Offline downloads and uploads unlocked.`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDownloads([]);
    setWatchlist([]);
    localStorage.removeItem('cinemax_user_v1');
    localStorage.removeItem('cinemax_downloads_v1');
    localStorage.removeItem('cinemax_watchlist_v1');
    showToast('Logged out of profile successfully.');
    setCurrentTab('home');
  };

  const handleSaveAnnouncement = (text: string) => {
    setAnnouncement(text);
    if (text) {
      localStorage.setItem('cinemax_announcement_v1', text);
      showToast('Announcement broadcasted and updated successfully!');
    } else {
      localStorage.removeItem('cinemax_announcement_v1');
      showToast('Announcement cleared/deleted.');
    }
  };

  // Video Upload Handler
  const handleUploadVideo = (newVideoData: Omit<Video, 'id' | 'likes' | 'likedBy' | 'views'>) => {
    const newVideo: Video = {
      ...newVideoData,
      id: `uploaded-${Date.now()}`,
      likes: 0,
      likedBy: [],
      views: 0,
    };
    
    const updated = [newVideo, ...videos];
    saveVideosState(updated);
    showToast('Video submitted successfully! It is pending admin verification before going public.');
  };

  // Admin Modifiers
  const handleApproveVideo = (videoId: string) => {
    const updated = videos.map((v) => {
      if (v.id === videoId) {
        return { ...v, isPublic: true };
      }
      return v;
    });
    saveVideosState(updated);
    showToast('Content approved and successfully listed on the public catalog!');
  };

  const handleRejectVideo = async (videoId: string) => {
    // Find the video first
    const videoToDelete = videos.find((v) => v.id === videoId);
    
    // 1. Delete associated binary files from IndexedDB offline storage if they exist
    if (videoToDelete) {
      try {
        const { deleteFile } = await import('./lib/indexedDB');
        if (videoToDelete.videoUrl.startsWith('indexeddb://')) {
          const videoKey = videoToDelete.videoUrl.replace('indexeddb://', '');
          await deleteFile(videoKey);
        }
        if (videoToDelete.thumbnailUrl.startsWith('indexeddb://')) {
          const thumbKey = videoToDelete.thumbnailUrl.replace('indexeddb://', '');
          await deleteFile(thumbKey);
        }
      } catch (err) {
        console.error('Error deleting media files from IndexedDB local storage:', err);
      }
    }

    // 2. Filter from central videos array
    const updated = videos.filter((v) => v.id !== videoId);
    saveVideosState(updated);

    // 3. Purge associated comments
    const updatedComments = comments.filter((c) => c.videoId !== videoId);
    saveCommentsState(updatedComments);

    // 4. Purge from user saved Watchlist
    const updatedWatchlist = watchlist.filter((id) => id !== videoId);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('cinemax_watchlist_v1', JSON.stringify(updatedWatchlist));

    // 5. Purge from local download items
    const updatedDownloads = downloads.filter((d) => d.videoId !== videoId);
    setDownloads(updatedDownloads);
    localStorage.setItem('cinemax_downloads_v1', JSON.stringify(updatedDownloads));

    showToast('Video and all of its associated data, local storage & metadata have been permanently deleted.');
  };

  const handleUpdateVideo = (updatedVideo: Video) => {
    const updated = videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v));
    saveVideosState(updated);
    showToast(`"${updatedVideo.title}" edited and updated successfully.`);
  };

  const handleToggleTrending = (videoId: string) => {
    const updated = videos.map((v) => {
      if (v.id === videoId) {
        const isTrendingNow = !v.isTrending;
        showToast(isTrendingNow ? `"${v.title}" marked as Trending!` : `"${v.title}" removed from Trending.`);
        return { ...v, isTrending: isTrendingNow };
      }
      return v;
    });
    saveVideosState(updated);
  };

  const handleToggleFeatured = (videoId: string) => {
    // Ensure only ONE video is featured as the top hero banner at a time!
    const updated = videos.map((v) => {
      if (v.id === videoId) {
        const isFeaturedNow = !v.isFeatured;
        showToast(isFeaturedNow ? `"${v.title}" set as the Featured Hero Banner!` : `"${v.title}" removed from Featured Banner.`);
        return { ...v, isFeatured: isFeaturedNow };
      }
      // Set others to false
      return { ...v, isFeatured: false };
    });
    saveVideosState(updated);
  };

  // User interactions: Like
  const handleLikeVideo = (video: Video, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Check if user has profile, if not, generate a temp guest ID or prompt profile
    const activeUser = user?.username || 'anonymous_guest';
    
    const updated = videos.map((v) => {
      if (v.id === video.id) {
        const hasLiked = v.likedBy.includes(activeUser);
        let updatedLikedBy = [...v.likedBy];
        let likesDelta = v.likes;

        if (hasLiked) {
          updatedLikedBy = updatedLikedBy.filter((u) => u !== activeUser);
          likesDelta = Math.max(0, v.likes - 1);
          showToast(`Removed like from "${v.title}"`);
        } else {
          updatedLikedBy.push(activeUser);
          likesDelta = v.likes + 1;
          showToast(`Liked "${v.title}"!`);
        }

        return {
          ...v,
          likes: likesDelta,
          likedBy: updatedLikedBy,
        };
      }
      return v;
    });

    saveVideosState(updated);
  };

  // User interactions: Watchlist / My List
  const handleToggleWatchlist = (videoId: string) => {
    let updatedWatchlist = [...watchlist];
    if (updatedWatchlist.includes(videoId)) {
      updatedWatchlist = updatedWatchlist.filter((id) => id !== videoId);
      showToast('Removed from My List');
    } else {
      updatedWatchlist.push(videoId);
      showToast('Added to My List');
      if (currentTab !== 'watchlist') {
        setHasNewWatchlist(true);
        localStorage.setItem('cinemax_has_new_watchlist_v1', 'true');
      }
    }
    setWatchlist(updatedWatchlist);
    localStorage.setItem('cinemax_watchlist_v1', JSON.stringify(updatedWatchlist));
  };

  // User interactions: Download Simulator with Advanced Sequence Queueing & Pause/Resume
  const handleDownloadVideos = (videosToQueue: Video[]) => {
    let updatedDownloads = [...downloads];
    let addedCount = 0;

    videosToQueue.forEach((v) => {
      if (updatedDownloads.some((d) => d.videoId === v.id)) return;

      // If no download is currently 'downloading', set the first new item as 'downloading', rest as 'queued'
      const hasActive = updatedDownloads.some((d) => d.status === 'downloading');
      const status = (!hasActive && addedCount === 0) ? ('downloading' as const) : ('queued' as const);

      const newItem: DownloadItem = {
        videoId: v.id,
        downloadedAt: new Date().toISOString(),
        videoTitle: v.title,
        thumbnailUrl: v.thumbnailUrl,
        quality: v.quality,
        status,
        progress: status === 'downloading' ? 0 : 0,
        size: `${Math.floor(Math.random() * 80) + 40} MB`, // Generated mock size
      };

      updatedDownloads.push(newItem);
      addedCount++;
    });

    if (addedCount > 0) {
      saveDownloadsState(updatedDownloads);
      if (currentTab !== 'downloads') {
        setHasNewDownloads(true);
        localStorage.setItem('cinemax_has_new_downloads_v1', 'true');
      }
      showToast(`Successfully queued ${addedCount} release(s) for offline sync!`);
    } else {
      showToast(`Selected videos are already in your offline library.`);
    }
  };

  const handleDownloadVideo = (video: Video) => {
    handleDownloadVideos([video]);
  };

  const handlePauseDownload = (videoId: string) => {
    const updated = downloads.map((d) => {
      if (d.videoId === videoId) {
        return { ...d, status: 'paused' as const };
      }
      return d;
    });
    saveDownloadsState(updated);
    showToast('Download paused.');
  };

  const handleResumeDownload = (videoId: string) => {
    const updated = downloads.map((d) => {
      if (d.videoId === videoId) {
        // If there is already an active download, queue it, otherwise start downloading
        const hasActive = downloads.some((x) => x.status === 'downloading' && x.videoId !== videoId);
        return { ...d, status: hasActive ? ('queued' as const) : ('downloading' as const) };
      }
      return d;
    });
    saveDownloadsState(updated);
    showToast('Download resumed.');
  };

  const handleDeleteDownload = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = downloads.filter((d) => d.videoId !== videoId);
    saveDownloadsState(updated);

    // Purge files from IndexedDB and Cache API
    import('./lib/indexedDB').then(({ deleteFile, removeCachedAsset }) => {
      deleteFile(`video_${videoId}`).catch(err => console.error(err));
      const item = downloads.find((d) => d.videoId === videoId);
      if (item?.thumbnailUrl) {
        removeCachedAsset(item.thumbnailUrl).catch(err => console.error(err));
      }
    }).catch(err => console.error(err));

    showToast('Removed downloaded copy from device storage.');
  };

  // User interactions: Comments
  const handleAddComment = (videoId: string, text: string) => {
    const activeUser = user?.username || 'anonymous_guest';
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      videoId,
      username: activeUser,
      text,
      createdAt: new Date().toISOString(),
    };

    const updated = [newComment, ...comments];
    saveCommentsState(updated);
    showToast('Comment posted successfully!');
  };

  const handlePlayVideo = (video: Video) => {
    // Increment local views count on playback
    const updated = videos.map((v) => {
      if (v.id === video.id) {
        return { ...v, views: v.views + 1 };
      }
      return v;
    });
    saveVideosState(updated);
    setPlayingVideo(video);
  };

  // Filtering Logic
  const publicVideos = videos.filter((v) => v.isPublic);
  const featuredVideo = videos.find((v) => v.isFeatured && v.isPublic) || publicVideos[0] || null;

  // Search filtration
  const searchFilter = (v: Video) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query) ||
      v.category.toLowerCase().includes(query) ||
      v.uploadedBy.toLowerCase().includes(query)
    );
  };

  const searchedPublicVideos = publicVideos.filter(searchFilter);

  // Grouping episodic series together on main layouts, so only the first episode is shown,
  // but it bubbles up to the front when new episodes are added.
  const getGroupedVideos = (videoList: Video[]): Video[] => {
    const movies = videoList.filter((v) => v.type !== 'episode' || !v.seriesTitle);
    const episodes = videoList.filter((v) => v.type === 'episode' && v.seriesTitle);

    // Group episodes by series title
    const groups: { [title: string]: Video[] } = {};
    episodes.forEach((v) => {
      const title = v.seriesTitle!;
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(v);
    });

    const seriesRepresentatives: Video[] = [];

    Object.keys(groups).forEach((title) => {
      const seriesEpisodes = groups[title];
      if (seriesEpisodes.length === 0) return;

      // Sort episodes to find the first episode (Season 1 Episode 1 or lowest season & episode)
      const sortedForRep = [...seriesEpisodes].sort((a, b) => {
        const sA = a.seasonNumber ?? 1;
        const sB = b.seasonNumber ?? 1;
        if (sA !== sB) return sA - sB;
        const eA = a.episodeNumber ?? 1;
        const eB = b.episodeNumber ?? 1;
        return eA - eB;
      });

      const representative = sortedForRep[0];

      // Find the latest uploadedAt timestamp among all episodes of this series
      let latestUploadedAt = seriesEpisodes[0].uploadedAt;
      seriesEpisodes.forEach((ep) => {
        if (new Date(ep.uploadedAt) > new Date(latestUploadedAt)) {
          latestUploadedAt = ep.uploadedAt;
        }
      });

      // Clone representative and set its uploadedAt to the latest,
      // so sorting positions it accurately at its latest update time!
      seriesRepresentatives.push({
        ...representative,
        uploadedAt: latestUploadedAt,
      });
    });

    const combined = [...movies, ...seriesRepresentatives];

    // Keep chronological order (newest uploads/updates first)
    return combined.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  };

  // Group videos by categories
  const getVideosByCategory = (category: string): Video[] => {
    const rawCategoryVideos = searchedPublicVideos.filter((v) => v.category === category);
    return getGroupedVideos(rawCategoryVideos);
  };

  const userLikedVideoIds: string[] = user 
    ? videos.filter((v) => v.likedBy.includes(user.username)).map((v) => v.id) 
    : [];

  return (
    <div id="cinemax-app-root" className="bg-zinc-950 text-white min-h-screen font-sans pb-24 relative overflow-x-hidden">
      
      {/* Floating Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        downloadCount={downloads.length}
        watchlistCount={watchlist.length}
        hasNewWatchlist={hasNewWatchlist}
        hasNewDownloads={hasNewDownloads}
        announcement={announcement}
      />

      {/* TOAST SYSTEM */}
      {toastMessage && (
        <div id="toast-message" className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[999] bg-[#0c0c0c] border-l-4 border-red-600 border border-white/10 text-zinc-100 text-xs py-3 px-4 rounded-lg shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="h-4 w-4 text-red-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN VIEWPORT NAVIGATION GRID */}
      <main className="transition-all duration-300 pb-28 md:pb-12 pt-10 sm:pt-12 lg:pt-20">
        
        {/* TAB 1: HOME PLATFORM VIEW */}
        {currentTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Immersive Hero Banner */}
            {!searchQuery && (
              <HeroSection
                featuredVideo={featuredVideo}
                onPlayVideo={handlePlayVideo}
                onOpenInfo={setSelectedVideo}
                isInWatchlist={watchlist.includes(featuredVideo?.id || '')}
                onToggleWatchlist={() => handleToggleWatchlist(featuredVideo?.id || '')}
              />
            )}

            {/* Scrolling categories layout block */}
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 ${searchQuery ? 'pt-6' : 'pt-4'}`}>
              
              {searchQuery && (
                <div className="border-b border-zinc-900 pb-4 mb-4">
                  <h2 className="text-xl font-bold">Search Results for "{searchQuery}"</h2>
                  <p className="text-xs text-zinc-500 mt-1">Found {searchedPublicVideos.length} matching titles</p>
                </div>
              )}

              {/* Dynamic Row: Watchlist */}
              {!searchQuery && watchlist.length > 0 && (
                <VideoGrid
                  title="My Saved Watchlist"
                  videos={publicVideos.filter((v) => watchlist.includes(v.id))}
                  onPlayVideo={(v) => { handlePlayVideo(v); }}
                  onOpenInfo={(v) => { setSelectedVideo(v); }}
                  onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
                  userLikedVideos={userLikedVideoIds}
                />
              )}

              {/* Dynamic Row: Trending */}
              <VideoGrid
                title="Trending Hits Now"
                videos={getGroupedVideos(searchedPublicVideos.filter((v) => v.isTrending))}
                onPlayVideo={(v) => { handlePlayVideo(v); }}
                onOpenInfo={(v) => { setSelectedVideo(v); }}
                onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
                userLikedVideos={userLikedVideoIds}
              />

              {/* Standard categories rows */}
              {CATEGORIES.map((category) => (
                <VideoGrid
                  key={`category-row-${category}`}
                  title={`${category} Shows`}
                  videos={getVideosByCategory(category).slice(0, 5)}
                  onPlayVideo={(v) => { handlePlayVideo(v); }}
                  onOpenInfo={(v) => { setSelectedVideo(v); }}
                  onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
                  userLikedVideos={userLikedVideoIds}
                  category={category}
                  onExploreCategory={(cat) => {
                    setSelectedExploreCategory(cat as Category);
                    setCurrentTab('explore-category');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SERIES TAB */}
        {currentTab === 'series' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-zinc-900 pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">Series & Franchises</h1>
              <p className="text-xs text-zinc-400 mt-1">Browse multi-episode series and seasons.</p>
            </div>

            <VideoGrid
              title="Series & Seasons Episodes"
              videos={getGroupedVideos(searchedPublicVideos.filter((v) => v.type === 'episode'))}
              onPlayVideo={(v) => { handlePlayVideo(v); }}
              onOpenInfo={(v) => { setSelectedVideo(v); }}
              onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
              userLikedVideos={userLikedVideoIds}
              emptyMessage="No series or episodes are currently public."
            />
          </div>
        )}

        {/* TAB 3: MOVIES TAB */}
        {currentTab === 'movies' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-zinc-900 pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">Feature Films</h1>
              <p className="text-xs text-zinc-400 mt-1">Browse single releases and independent cinematic movies.</p>
            </div>

            <VideoGrid
              title="Cinematic Features"
              videos={searchedPublicVideos.filter((v) => v.type === 'movie')}
              onPlayVideo={(v) => { handlePlayVideo(v); }}
              onOpenInfo={(v) => { setSelectedVideo(v); }}
              onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
              userLikedVideos={userLikedVideoIds}
              emptyMessage="No movies are currently public on CINEMAX stream."
            />
          </div>
        )}

        {/* TAB 4: WATCHLIST VIEWPORT */}
        {currentTab === 'watchlist' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-zinc-900 pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">My Saved List</h1>
              <p className="text-xs text-zinc-400 mt-1">Your personal curated watchlist collection.</p>
            </div>

            {watchlist.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-16 text-center space-y-3">
                <Bookmark className="h-10 w-10 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-300">Your List is Empty</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">Explore movie cards and tap the heart or check badge to save items directly for quick access.</p>
                <button
                  id="watchlist-browse-home-btn"
                  onClick={() => setCurrentTab('home')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-all mt-4 cursor-pointer"
                >
                  Browse Home Catalog
                </button>
              </div>
            ) : (
              <VideoGrid
                title="Watchlist Library"
                videos={publicVideos.filter((v) => watchlist.includes(v.id))}
                onPlayVideo={(v) => { handlePlayVideo(v); }}
                onOpenInfo={(v) => { setSelectedVideo(v); }}
                onLikeVideo={(v, e) => { handleLikeVideo(v, e); }}
                userLikedVideos={userLikedVideoIds}
              />
            )}
          </div>
        )}

        {/* TAB 5: DOWNLOADS VIEWPORT */}
        {currentTab === 'downloads' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-zinc-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 id="my-downloads-title" className="text-2xl font-black uppercase tracking-wider text-white">MY DOWNLOADS</h1>
                <p className="text-xs text-zinc-400 mt-1">Enjoy contents offline.</p>
              </div>
              {user && downloads.length > 0 && (
                <button
                  onClick={() => {
                    saveDownloadsState([]);
                    import('./lib/indexedDB').then(({ deleteFile, removeCachedAsset }) => {
                      downloads.forEach((d) => {
                        deleteFile(`video_${d.videoId}`).catch(err => console.error(err));
                        if (d.thumbnailUrl) {
                          removeCachedAsset(d.thumbnailUrl).catch(err => console.error(err));
                        }
                      });
                    }).catch((err) => console.error(err));
                    showToast('Cleared all offline sync data, IndexedDB files, and Cache API assets.');
                  }}
                  className="bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all cursor-pointer self-start sm:self-auto"
                >
                  Purge All Cache
                </button>
              )}
            </div>

            {/* Requirements check */}
            {!user ? (
              <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-16 text-center space-y-3">
                <ShieldAlert className="h-10 w-10 text-red-500 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-zinc-300">Account Profile Required</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">Anyone can stream online. However, downloading video payloads requires setting up a quick profile username.</p>
                <button
                  id="downloads-register-btn"
                  onClick={() => setShowProfileModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-all mt-4 cursor-pointer"
                >
                  Create Profile Now
                </button>
              </div>
            ) : downloads.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-16 text-center space-y-3">
                <DownloadCloud className="h-10 w-10 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-300">No Offline Videos</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">Tap "More Info" on any movie or series episode card, and select "Download Offline" to save it into device storage.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. Active Queue Section */}
                {downloads.some((d) => d.status && d.status !== 'completed') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center space-x-2">
                      <RefreshCw className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                      <span>Active Synced Downloads</span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {downloads
                        .filter((d) => d.status && d.status !== 'completed')
                        .map((item) => {
                          const isDownloading = item.status === 'downloading';
                          const isPaused = item.status === 'paused';
                          const isQueued = item.status === 'queued';
 
                          return (
                            <div
                              key={item.videoId}
                              id={`active-download-${item.videoId}`}
                              className="bg-zinc-900/80 border border-zinc-850 rounded-lg sm:rounded-xl p-2 sm:p-4 flex gap-2 sm:gap-4 items-center relative overflow-hidden"
                            >
                              <div className="relative h-10 w-16 sm:h-16 sm:w-24 shrink-0 rounded-md sm:rounded-lg overflow-hidden bg-black border border-white/5">
                                <CineImage
                                  src={item.thumbnailUrl}
                                  alt={item.videoTitle}
                                  className="w-full h-full object-cover"
                                />
                                {isDownloading && (
                                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                    <RefreshCw className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#E50914] animate-spin" />
                                  </div>
                                )}
                              </div>
 
                              <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                                <h4 className="font-bold text-xs sm:text-sm text-zinc-250 truncate">{item.videoTitle}</h4>
                                <div className="flex items-center flex-wrap gap-1 sm:space-x-2 text-[8px] sm:text-[10px] text-zinc-500">
                                  <span>{item.quality}</span>
                                  <span className="text-zinc-700 sm:text-zinc-500">•</span>
                                  <span>{item.size || '72 MB'}</span>
                                  <span className="text-zinc-700 sm:text-zinc-500">•</span>
                                  <span className={`font-semibold ${isDownloading ? 'text-[#E50914]' : isPaused ? 'text-yellow-500' : 'text-zinc-400'}`}>
                                    {isDownloading ? `Syncing (${item.progress ?? 0}%)` : isPaused ? 'Paused' : 'Queued'}
                                  </span>
                                </div>
 
                                {/* Progress Bar */}
                                <div className="w-full bg-zinc-800 h-1 sm:h-1.5 rounded-full overflow-hidden mt-1 sm:mt-2">
                                  <div
                                    className={`h-full transition-all duration-300 ${isDownloading ? 'bg-[#E50914]' : isPaused ? 'bg-yellow-600' : 'bg-zinc-600'}`}
                                    style={{ width: `${item.progress ?? 0}%` }}
                                  />
                                </div>
                              </div>
 
                              {/* Controls */}
                              <div className="flex items-center space-x-1 sm:space-x-2 pl-1 sm:pl-2">
                                {isDownloading && (
                                  <button
                                    onClick={() => handlePauseDownload(item.videoId)}
                                    className="p-1 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer transition-all"
                                    title="Pause Download"
                                  >
                                    <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                )}
                                {isPaused && (
                                  <button
                                    onClick={() => handleResumeDownload(item.videoId)}
                                    className="p-1 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 text-green-400 hover:text-green-300 cursor-pointer transition-all"
                                    title="Resume Download"
                                  >
                                    <Play className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                                  </button>
                                )}
                                {isQueued && (
                                  <div className="p-1 sm:p-2 text-zinc-500 text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-0.5 sm:space-x-1 bg-white/5 rounded-md sm:rounded-lg border border-white/5">
                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span>Queued</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => handleDeleteDownload(item.videoId, e)}
                                  className="p-1 sm:p-2 rounded-full bg-white/5 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 cursor-pointer transition-all"
                                  title="Cancel Download"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
 
                {/* 2. Ready to Play Offline Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Ready to Play Offline ({downloads.filter((d) => !d.status || d.status === 'completed').length})</span>
                  </h3>
                  {downloads.filter((d) => !d.status || d.status === 'completed').length === 0 ? (
                    <p className="text-xs text-zinc-500 italic p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">No finished downloads yet. Items in queue will show up here once sync is 100% complete.</p>
                  ) : (
                    <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
                      {downloads
                        .filter((d) => !d.status || d.status === 'completed')
                        .map((item) => {
                          const correspondingVideo = videos.find((v) => v.id === item.videoId);
                          return (
                            <div
                              id={`download-card-${item.videoId}`}
                              key={item.videoId}
                              className="bg-zinc-900 border border-zinc-850 rounded-lg overflow-hidden group/download relative"
                            >
                              {/* Image section */}
                              <div className="relative aspect-video">
                                <CineImage
                                  src={item.thumbnailUrl}
                                  alt={item.videoTitle}
                                  className="w-full h-full object-cover group-hover/download:brightness-75 transition-all"
                                />
                                {/* Play trigger overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/download:opacity-100 transition-opacity flex items-center justify-center space-x-1 sm:space-x-2">
                                  <button
                                    id={`play-downloaded-${item.videoId}`}
                                    onClick={() => {
                                      if (correspondingVideo) {
                                        handlePlayVideo(correspondingVideo);
                                      } else {
                                        showToast('Downloaded source video deleted by system admin.');
                                      }
                                    }}
                                    className="bg-white text-black hover:bg-[#E50914] hover:text-white rounded-full h-6 w-6 sm:h-10 sm:w-10 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                                    title="Play Offline File"
                                  >
                                    <Play className="h-3 w-3 sm:h-4.5 sm:w-4.5 fill-current ml-0.5" />
                                  </button>
                                </div>
                                {/* Quality tag */}
                                <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/90 text-[7px] sm:text-[8px] font-bold text-green-400 px-1 sm:px-1.5 py-0.5 rounded font-mono border border-green-500/20">
                                  {item.quality} • Offline Sync
                                </span>
                              </div>
 
                              {/* Info section */}
                              <div className="p-1.5 sm:p-3.5 space-y-0.5 sm:space-y-1">
                                <h4 className="font-bold text-[10px] sm:text-sm text-zinc-200 truncate">{item.videoTitle}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] sm:text-[10px] text-zinc-500">
                                    {new Date(item.downloadedAt).toLocaleDateString()}
                                  </span>
                                  <button
                                    id={`delete-download-${item.videoId}`}
                                    onClick={(e) => handleDeleteDownload(item.videoId, e)}
                                    className="text-[8px] sm:text-[10px] text-red-500 hover:text-red-400 underline font-semibold cursor-pointer"
                                  >
                                    Delete Local Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ADMIN CONTROL PANEL PANEL */}
        {currentTab === 'admin' && isAdmin && (
          <div className="animate-in fade-in duration-300">
            <AdminPanel
              videos={videos}
              onApproveVideo={handleApproveVideo}
              onRejectVideo={handleRejectVideo}
              onUpdateVideo={handleUpdateVideo}
              onToggleTrending={handleToggleTrending}
              onToggleFeatured={handleToggleFeatured}
              onPlayVideo={handlePlayVideo}
              announcement={announcement}
              onSaveAnnouncement={handleSaveAnnouncement}
              onExitAdmin={() => {
                setIsAdmin(false);
                setCurrentTab('home');
              }}
            />
          </div>
        )}

        {/* TAB 7: EXPLORE CATEGORY DYNAMIC PAGE */}
        {currentTab === 'explore-category' && selectedExploreCategory && (
          <div className="animate-in fade-in duration-300">
            <CategoryExplore
              category={selectedExploreCategory}
              videos={getGroupedVideos(publicVideos.filter((v) => v.category === selectedExploreCategory))}
              onPlayVideo={handlePlayVideo}
              onOpenInfo={setSelectedVideo}
              onLikeVideo={handleLikeVideo}
              userLikedVideos={userLikedVideoIds}
              onBack={() => {
                setCurrentTab('home');
                setSelectedExploreCategory(null);
              }}
            />
          </div>
        )}

      </main>

      {/* Drag Boundary Container */}
      <div ref={dragConstraintsRef} className="fixed inset-x-6 top-14 sm:top-16 lg:top-24 bottom-24 pointer-events-none z-40" />

      {/* FLOATING ACTION TRIGGER: SUBMIT VIDEO RELEASE (Uploader) */}
      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 pointer-events-auto cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsUploadHovered(true)}
        onMouseLeave={() => setIsUploadHovered(false)}
      >
        <button
          id="global-upload-trigger-btn"
          onClick={() => setShowUploadModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] transform active:scale-95 transition-all cursor-pointer group relative"
          title="Submit a Video Release"
        >
          <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
        </button>

        {/* Floating Tooltip Label */}
        <AnimatePresence>
          {isUploadHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-50 flex items-center justify-center"
            >
              Upload Video
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* POPUP MODAL ARCHITECTURE CONTROLLERS */}
      {selectedVideo && (
        <VideoDetailModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          user={user}
          onOpenProfileModal={() => setShowProfileModal(true)}
          allVideos={videos}
          comments={comments}
          onAddComment={handleAddComment}
          onLikeVideo={(v) => handleLikeVideo(v)}
          userLikedVideos={user ? videos.filter((v) => v.likedBy.includes(user.username)).map((v) => v.id) : []}
          downloads={downloads}
          onDownloadVideo={handleDownloadVideo}
          onDownloadVideos={handleDownloadVideos}
          onPlayVideo={handlePlayVideo}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {playingVideo && (
        <CustomVideoPlayer
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          user={user}
          onOpenProfileModal={() => setShowProfileModal(true)}
          downloads={downloads}
          onDownloadVideo={handleDownloadVideo}
        />
      )}

      {showProfileModal && (
        <CreateProfileModal
          onClose={() => setShowProfileModal(false)}
          onSave={handleCreateProfile}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadVideo}
          user={user}
          onOpenProfileModal={() => setShowProfileModal(true)}
          allVideos={videos}
        />
      )}

    </div>
  );
}
