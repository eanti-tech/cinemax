/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Film, Search, Download, ShieldAlert, LogOut, Heart, Tv, UserPlus, User, Lock, KeyRound, ShieldCheck, X, Megaphone, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { CONFIG } from '../config';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenProfileModal: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  downloadCount: number;
  watchlistCount: number;
  hasNewWatchlist?: boolean;
  hasNewDownloads?: boolean;
  announcement?: string;
}

export default function Header({
  currentTab,
  setCurrentTab,
  user,
  onOpenProfileModal,
  onLogout,
  isAdmin,
  setIsAdmin,
  searchQuery,
  setSearchQuery,
  downloadCount,
  watchlistCount,
  hasNewWatchlist = false,
  hasNewDownloads = false,
  announcement = '',
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAnnouncementDropdown, setShowAnnouncementDropdown] = useState(false);
  
  // Passcode Security Modal States
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Custom PWA Installer prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowProfileDropdown(false);
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    setPasscodeError(false);
    try {
      const bcrypt = await import('bcryptjs');
      const isValid = bcrypt.compareSync(code, CONFIG.ADMIN_PASSCODE_HASH);
      
      if (isValid) {
        setTimeout(() => {
          setIsAdmin(true);
          setCurrentTab('admin');
          setShowPasscodeModal(false);
        }, 150);
      } else {
        setTimeout(() => {
          setPasscodeError(true);
          setPasscode('');
        }, 150);
      }
    } catch (err) {
      console.error('Bcrypt verification failed:', err);
      setPasscodeError(true);
      setPasscode('');
    } finally {
      setIsVerifying(false);
    }
  };

  // Home tab is removed from list, clicking on CINE logo navigates home.
  const tabs = [
    { id: 'series', label: 'Series', Icon: Tv },
    { id: 'movies', label: 'Movies', Icon: Film },
    { id: 'watchlist', label: 'My List', Icon: Heart, count: user && watchlistCount > 0 ? watchlistCount : undefined, hasDot: user && watchlistCount > 0 ? hasNewWatchlist : false },
    { id: 'downloads', label: 'Downloads', Icon: Download, count: user && downloadCount > 0 ? downloadCount : undefined, hasDot: user && downloadCount > 0 ? hasNewDownloads : false },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-10 sm:h-12 lg:h-20 flex items-center justify-between">
          
          {/* Left Section: Logo & Tabs */}
          <div className="flex items-center space-x-6 lg:space-x-12">
            {/* Logo */}
            <div 
              id="cine-logo"
              onClick={() => setCurrentTab('home')}
              className="flex items-center cursor-pointer select-none group"
              title="Go to Home"
            >
              <span className="text-xl sm:text-2xl lg:text-4xl font-black tracking-tighter font-display transition-transform duration-200 group-hover:scale-105 select-none">
                <span className="text-[#E50914]">CINE</span>
                <span className="text-white">MAX</span>
              </span>
            </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center space-x-4">
            {tabs.map((tab) => {
              const IconComponent = tab.Icon;
              return (
                <button
                  id={`tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`relative flex items-center justify-center p-2.5 rounded-full transition-all duration-200 cursor-pointer group/btn ${
                    currentTab === tab.id
                      ? 'text-[#E50914] bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(229,9,20,0.1)]'
                      : 'text-zinc-400 border border-transparent hover:text-white hover:bg-white/5'
                  }`}
                  title={tab.label}
                >
                  <IconComponent className="h-5 w-5 transition-transform duration-200 group-hover/btn:scale-110" />
                  {tab.hasDot ? (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E50914] border border-zinc-950 animate-pulse shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
                  ) : (
                    tab.count !== undefined && tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-zinc-850 text-zinc-300 text-[8px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-black animate-in zoom-in duration-250">
                        {tab.count}
                      </span>
                    )
                  )}
                  {/* Tooltip label that slides up on hover */}
                  <span className="absolute top-full mt-2 bg-zinc-950 border border-white/10 text-[9px] font-extrabold uppercase tracking-widest text-zinc-300 px-2 py-1 rounded opacity-0 scale-95 group-hover/btn:opacity-100 group-hover/btn:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Actions, Admin Mode, Profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Expandable/Collapsible Search Container */}
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery.trim()) {
                  setShowSearch(false);
                }
              }}
              placeholder="Search catalog..."
              className={`text-white text-xs bg-transparent focus:outline-none transition-all duration-350 ease-in-out ${
                showSearch 
                  ? 'w-28 sm:w-48 pl-3 pr-1 py-1 opacity-100' 
                  : 'w-0 px-0 py-0 opacity-0 pointer-events-none'
              }`}
            />
            <button
              id="toggle-search-btn"
              onClick={() => {
                if (showSearch) {
                  if (!searchQuery.trim()) {
                    setShowSearch(false);
                  }
                } else {
                  setShowSearch(true);
                  setTimeout(() => {
                    document.getElementById('search-input')?.focus();
                  }, 100);
                }
              }}
              className="p-1 sm:p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Search"
            >
              <Search className="h-3.5 w-3.5 lg:h-4.5 lg:w-4.5" />
            </button>
          </div>

          {/* Announcement Button & Dropdown */}
          <div className="relative">
            <button
              id="announcement-btn"
              onClick={() => {
                setShowAnnouncementDropdown(!showAnnouncementDropdown);
                setShowProfileDropdown(false);
              }}
              className={`flex items-center justify-center rounded-full cursor-pointer border transition-all duration-200 h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 relative ${
                showAnnouncementDropdown
                  ? 'bg-red-950/40 text-red-400 border-[#E50914] hover:bg-red-950/60 shadow-[0_0_10px_rgba(229,9,20,0.2)]'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="System Announcements"
            >
              <Megaphone className="h-4 w-4 lg:h-5 lg:w-5" />
              {announcement && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E50914] border border-zinc-950 animate-pulse shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
              )}
            </button>

            {/* Announcement Dropdown Card */}
            {showAnnouncementDropdown && (
              <div
                id="announcement-dropdown"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 space-y-3"
              >
                <div className="flex items-center space-x-2 text-[#E50914] border-b border-white/10 pb-2">
                  <Megaphone className="h-4 w-4 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider text-white font-sans">System Broadcast</span>
                </div>

                {announcement ? (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-300 leading-relaxed bg-[#050505] p-3 rounded border border-white/5 select-text font-sans">
                      {announcement}
                    </p>
                    <span className="text-[9px] font-mono font-semibold text-zinc-500 block text-right">
                      Broadcasted by Admin
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-1">
                    <p className="text-xs text-zinc-500 italic font-sans">No live announcements from the administrator.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Info */}
          {user ? (
            <div className="relative">
              <button
                id="profile-dropdown-btn"
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowAnnouncementDropdown(false);
                }}
                className="bg-white/5 border border-white/10 p-1.5 sm:p-2 lg:p-2.5 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-white text-zinc-300 transition-all duration-200 focus:outline-none h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 relative"
                title={`Profile: @${user.username}`}
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5 text-red-500" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050505]"></span>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div 
                  id="profile-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-[#0c0c0c] border border-white/10 rounded-lg shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-xs text-zinc-400">Signed in as</p>
                    {user.username === 'oanti' ? (
                      <button
                        onClick={() => {
                          setPasscode('');
                          setPasscodeError(false);
                          setShowPasscodeModal(true);
                          setShowProfileDropdown(false);
                        }}
                        className="text-sm font-semibold text-[#E50914] hover:text-red-400 underline cursor-pointer text-left block w-full truncate transition-all duration-150 focus:outline-none"
                        title="Click to authenticate Admin"
                      >
                        @{user.username} (Admin Login)
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-white truncate">@{user.username}</p>
                    )}
                    <span className="inline-block mt-1 bg-red-950/40 text-red-400 border border-red-900/40 text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {user.username === 'oanti' ? 'Administrator' : 'Account Registered'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      id="dropdown-exit-admin"
                      onClick={() => {
                        setIsAdmin(false);
                        setCurrentTab('home');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-white/5 hover:text-amber-300 flex items-center space-x-2 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Exit Admin Mode</span>
                    </button>
                  )}

                  <button
                    id="dropdown-watchlist"
                    onClick={() => {
                      setCurrentTab('watchlist');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Heart className="h-3.5 w-3.5 text-zinc-400" />
                      <span>My Watchlist ({watchlistCount})</span>
                    </div>
                    {hasNewWatchlist && (
                      <span className="h-2 w-2 rounded-full bg-[#E50914] animate-pulse" />
                    )}
                  </button>

                  <button
                    id="dropdown-downloads"
                    onClick={() => {
                      setCurrentTab('downloads');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Download className="h-3.5 w-3.5 text-zinc-400" />
                      <span>My Downloads ({downloadCount})</span>
                    </div>
                    {hasNewDownloads && (
                      <span className="h-2 w-2 rounded-full bg-[#E50914] animate-pulse" />
                    )}
                  </button>

                  <div className="border-t border-white/10 my-1"></div>

                  {deferredPrompt && (
                    <>
                      <button
                        id="pwa-install-dropdown-btn"
                        onClick={handleInstallApp}
                        className="w-full text-left px-4 py-2 text-xs text-yellow-400 hover:bg-yellow-950/20 hover:text-yellow-350 flex items-center space-x-2 cursor-pointer font-bold animate-pulse"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Install App (PWA)</span>
                      </button>
                      <div className="border-t border-white/10 my-1"></div>
                    </>
                  )}

                  <button
                    id="logout-btn"
                    onClick={() => {
                      onLogout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300 flex items-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Change Profile</span>
                  </button>

                  <div className="border-t border-white/5 mt-1.5 pt-1.5 px-4 text-center">
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest block select-none">
                      powered by: OANTI I.T. SOLUTIONS
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-create-profile-btn"
              onClick={onOpenProfileModal}
              className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 p-1.5 sm:p-2 lg:p-2.5 rounded-full transition-all duration-200 cursor-pointer shadow flex items-center justify-center hover:scale-105 active:scale-95 h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
              title="Create Profile"
            >
              <User className="h-4 w-4 lg:h-5 lg:w-5" />
            </button>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Navigation Bar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 py-1 sm:py-1.5 flex justify-around items-center z-50 backdrop-blur-md">
      {tabs.map((tab) => {
        const IconComponent = tab.Icon;
        return (
          <button
            id={`tab-mobile-${tab.id}`}
            key={tab.id}
            onClick={() => {
              setCurrentTab(tab.id);
              setSearchQuery('');
            }}
            className={`relative flex flex-col items-center justify-center p-1 sm:p-1.5 transition-all duration-200 cursor-pointer group/mob ${
              currentTab === tab.id
                ? 'text-[#E50914]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <IconComponent className="h-5.5 w-5.5 transition-transform duration-200 group-hover/mob:scale-110" />
              {tab.hasDot ? (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#E50914] border border-black animate-pulse shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
              ) : (
                tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-zinc-850 text-zinc-300 text-[8px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-black">
                    {tab.count}
                  </span>
                )
              )}
            </div>
            
            {/* Tooltip popup above the SVG */}
            <span className="absolute bottom-full mb-3 bg-zinc-950 border border-white/10 text-[9px] font-extrabold uppercase tracking-widest text-zinc-350 px-2.5 py-1.5 rounded-md opacity-0 scale-95 group-hover/mob:opacity-100 group-hover/mob:scale-100 group-focus/mob:opacity-100 group-focus/mob:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-2xl">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>

    {/* CUSTOM ADMIN PASSCODE MODAL OVERLAY */}
    {showPasscodeModal && (
      <div 
        id="passcode-verification-modal"
        className="fixed inset-0 bg-[#020202]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      >
        <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl w-full max-w-[340px] sm:max-w-sm max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800 shadow-[0_0_50px_rgba(229,9,20,0.15)] p-5 sm:p-6 text-center relative animate-in zoom-in-95 duration-200">
          
          {/* Close button */}
          <button 
            onClick={() => setShowPasscodeModal(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
 
          {/* Secure lock icon header */}
          <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-red-950/40 border border-[#E50914]/30 rounded-full flex items-center justify-center text-[#E50914] mb-3 sm:mb-4">
            <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-pulse" />
          </div>
 
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
            ADMIN ACCESS RESTRICTED
          </h3>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Enter the master security PIN to authorize developer controls & moderation features.
          </p>
 
          {/* Passcode indicators display */}
          <div className="flex justify-center space-x-2.5 sm:space-x-3.5 my-4 sm:my-6">
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = passcode.length > idx;
              return (
                <div 
                  key={idx}
                  className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 transition-all duration-150 ${
                    passcodeError 
                      ? 'border-red-500 bg-red-500/20 animate-bounce' 
                      : hasDigit 
                        ? 'border-[#E50914] bg-[#E50914]' 
                        : 'border-white/15 bg-transparent'
                  }`}
                />
              );
            })}
          </div>
 
          {/* Error message */}
          {passcodeError && (
            <p className="text-[9px] sm:text-[10px] text-red-500 font-mono font-bold uppercase tracking-wider mb-3 sm:mb-4 animate-pulse">
              ⚠️ Invalid Security Passcode
            </p>
          )}
 
          {/* Touch-friendly Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-[200px] sm:max-w-[240px] mx-auto mb-3 sm:mb-4 font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                disabled={isVerifying}
                onClick={() => {
                  if (passcode.length < 4 && !isVerifying) {
                    setPasscodeError(false);
                    const newPass = passcode + num;
                    setPasscode(newPass);
                    
                    // Auto-validate once 4 characters are reached
                    if (newPass.length === 4) {
                      handleVerifyCode(newPass);
                    }
                  }
                }}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/5 bg-white/5 text-white font-bold text-base sm:text-lg hover:bg-white/15 hover:border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            
            {/* Clear button */}
            <button
              disabled={isVerifying}
              onClick={() => {
                setPasscode('');
                setPasscodeError(false);
              }}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full text-zinc-500 hover:text-white text-[10px] sm:text-xs font-bold transition-colors cursor-pointer flex items-center justify-center uppercase disabled:opacity-50"
            >
              Clear
            </button>
 
            {/* Zero button */}
            <button
              key="0"
              disabled={isVerifying}
              onClick={() => {
                if (passcode.length < 4 && !isVerifying) {
                  setPasscodeError(false);
                  const newPass = passcode + '0';
                  setPasscode(newPass);
                  
                  if (newPass.length === 4) {
                    handleVerifyCode(newPass);
                  }
                }
              }}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/5 bg-white/5 text-white font-bold text-base sm:text-lg hover:bg-white/15 hover:border-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              0
            </button>
 
            {/* Backspace button */}
            <button
              disabled={isVerifying}
              onClick={() => {
                setPasscode(passcode.slice(0, -1));
                setPasscodeError(false);
              }}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full text-zinc-400 hover:text-white text-[10px] sm:text-xs font-bold transition-colors cursor-pointer flex items-center justify-center uppercase"
            >
              Delete
            </button>
          </div>
 
          <div className="text-[8px] sm:text-[9px] text-zinc-500 font-mono mt-2">
            Protected by secure cryptographic passcode verification.
          </div>
 
        </div>
      </div>
    )}
  </>
);
}
