/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Sparkles, Check } from 'lucide-react';

interface CreateProfileModalProps {
  onClose: () => void;
  onSave: (username: string) => void;
}

export default function CreateProfileModal({
  onClose,
  onSave,
}: CreateProfileModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    
    if (!cleanUsername) {
      setError('Username cannot be empty');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('Only lowercase letters, numbers, and underscores are allowed');
      return;
    }

    onSave(cleanUsername);
    onClose();
  };

  return (
    <div 
      id="profile-modal-overlay"
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md"
    >
      <div
        id="profile-modal-container"
        className="bg-[#0c0c0c] border border-white/10 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2 text-[#E50914]">
            <User className="h-5 w-5" />
            <h3 className="font-bold text-white text-base">Setup CINEMAX Profile</h3>
          </div>
          <button
            id="close-profile-modal"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          Create a simple username to personalize your stream list. This will allow you to <strong className="text-[#E50914]">download videos offline</strong>, add comments to movies, and upload your own content for verification! No email or registration required.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-500">Choose Username</label>
            <div className="relative">
              <span className="absolute left-3 inset-y-0 flex items-center text-zinc-500 text-xs font-mono">@</span>
              <input
                id="username-input-field"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="movie_fanatic"
                className="w-full bg-[#050505] border border-white/10 text-white rounded pl-7 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] font-mono"
                maxLength={20}
                autoFocus
              />
            </div>
            {error ? (
              <p className="text-[10px] text-red-400 font-semibold">{error}</p>
            ) : (
              <p className="text-[9px] text-zinc-500">Use lowercases, numbers, or underscores. E.g., @novela_lover</p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
            <button
              id="profile-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-white/5 border border-white/10 text-zinc-350 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="profile-submit-btn"
              type="submit"
              className="px-4 py-2 rounded bg-[#E50914] hover:bg-[#b20710] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Create Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
