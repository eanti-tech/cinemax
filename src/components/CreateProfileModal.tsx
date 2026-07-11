/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User, Check, Lock, Unlock, ShieldAlert } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { UserProfile } from '../types';

interface CreateProfileModalProps {
  onClose: () => void;
  onSave: (username: string, pinCode?: string) => void;
  profiles: UserProfile[];
}

export default function CreateProfileModal({
  onClose,
  onSave,
  profiles,
}: CreateProfileModalProps) {
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  const cleanUsername = username.trim().toLowerCase();
  const existing = profiles.find(p => p.username.toLowerCase() === cleanUsername);

  let mode: 'create' | 'login' | 'claim' = 'create';
  if (cleanUsername) {
    if (existing) {
      mode = existing.pinCode ? 'login' : 'claim';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // PIN code validation
    const cleanPin = pinCode.trim();
    if (mode === 'login') {
      if (!cleanPin) {
        setError('PIN is required to unlock this profile');
        return;
      }
      try {
        let isValid = false;
        let needsUpgrade = false;
        let hashedPinToSave = '';

        if (existing?.pinCode) {
          const isBcryptHash = existing.pinCode.startsWith('$');
          if (isBcryptHash) {
            isValid = bcrypt.compareSync(cleanPin, existing.pinCode);
          } else {
            // Plaintext fallback for legacy profiles
            isValid = cleanPin === existing.pinCode;
            if (isValid) {
              needsUpgrade = true;
              const salt = bcrypt.genSaltSync(10);
              hashedPinToSave = bcrypt.hashSync(cleanPin, salt);
            }
          }
        }

        if (!isValid) {
          setError('Incorrect security PIN. Please try again.');
          return;
        }

        if (needsUpgrade && hashedPinToSave) {
          onSave(cleanUsername, hashedPinToSave);
        } else {
          onSave(cleanUsername);
        }
        onClose();
      } catch (err) {
        console.error('PIN verification failed:', err);
        setError('Verification failed. Please try again.');
        return;
      }
    } else {
      // For create or claim, let's require a 4-digit numeric PIN
      if (!cleanPin) {
        setError('A 4-digit security PIN is required to protect your profile');
        return;
      }
      if (!/^\d{4}$/.test(cleanPin)) {
        setError('PIN must be exactly 4 digits (0-9)');
        return;
      }

      try {
        const salt = bcrypt.genSaltSync(10);
        const hashedPin = bcrypt.hashSync(cleanPin, salt);
        onSave(cleanUsername, hashedPin);
        onClose();
      } catch (err) {
        console.error('Bcrypt hashing failed:', err);
        setError('Failed to secure PIN. Please try again.');
      }
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // only allow digits
    if (val.length <= 4) {
      setPinCode(val);
      setError('');
    }
  };

  return (
    <div 
      id="profile-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
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
            <h3 className="font-bold text-white text-base">CINEMAX Profile Access</h3>
          </div>
          <button
            id="close-profile-modal"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info/Intro */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          Sign in or create a profile to unlock offline downloads, write comments, and submit your videos. Each profile is secured by a 4-digit PIN so your account is safe from others.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-500 block">Username</label>
            <div className="relative">
              <span className="absolute left-3 inset-y-0 flex items-center text-zinc-500 text-xs font-mono">@</span>
              <input
                id="username-input-field"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setPinCode('');
                  setError('');
                }}
                placeholder="movie_fanatic"
                className="w-full bg-[#050505] border border-white/10 text-white rounded pl-7 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] font-mono"
                maxLength={20}
                autoFocus
              />
            </div>
          </div>

          {/* Dynamic PIN Field based on state */}
          {cleanUsername && cleanUsername.length >= 3 && (
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center space-x-2">
                {mode === 'login' ? (
                  <Lock className="h-4 w-4 text-amber-500 animate-pulse" />
                ) : mode === 'claim' ? (
                  <ShieldAlert className="h-4 w-4 text-[#E50914]" />
                ) : (
                  <Unlock className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs font-bold text-white">
                  {mode === 'login' ? 'Profile Locked' : mode === 'claim' ? 'Secure Legacy Account' : 'New Profile Security'}
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-normal">
                {mode === 'login' 
                  ? 'This username is registered. Enter your 4-digit PIN to authenticate.' 
                  : mode === 'claim'
                  ? 'This legacy account is currently unsecured. Establish a 4-digit PIN now to secure your account name!'
                  : 'Establish a new 4-digit numeric PIN to secure your username.'}
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] uppercase font-bold text-zinc-400 block">4-Digit Security PIN</label>
                <input
                  id="profile-pincode-field"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={pinCode}
                  onChange={handlePinChange}
                  placeholder="••••"
                  className="w-full text-center bg-black border border-white/10 text-white rounded py-2 text-sm focus:outline-none focus:border-[#E50914] tracking-widest font-bold"
                  maxLength={4}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-[10px] text-red-400 font-semibold text-center bg-red-950/20 py-1.5 px-2 rounded border border-red-900/30">
              {error}
            </p>
          )}

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
              <span>
                {mode === 'login' ? 'Unlock & Sign In' : mode === 'claim' ? 'Secure & Sign In' : 'Create & Secure'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
