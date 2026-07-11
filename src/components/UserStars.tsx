/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star } from 'lucide-react';
import { UserProfile, Video, Comment, getUserStarStatus } from '../types';

interface UserStarsProps {
  username: string;
  profiles: UserProfile[];
  videos: Video[];
  comments: Comment[];
  size?: 'xs' | 'sm' | 'md';
}

export default function UserStars({
  username,
  profiles = [],
  videos = [],
  comments = [],
  size = 'sm'
}: UserStarsProps): React.JSX.Element {
  const status = getUserStarStatus(username, profiles, videos, comments);
  
  const starSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  };
  
  const gapSizes = {
    xs: 'space-x-0.5',
    sm: 'space-x-0.5',
    md: 'space-x-1'
  };

  const containerPadding = {
    xs: 'px-1 py-0.5 rounded',
    sm: 'px-1 py-0.5 rounded',
    md: 'px-2 py-1 rounded-md'
  };

  const sClass = starSizes[size];

  return (
    <div 
      className={`inline-flex items-center ${gapSizes[size]} bg-black/35 px-1.5 py-0.5 rounded select-none flex-shrink-0 align-middle`}
      title={`@${username}'s Star Honor Level`}
    >
      {/* Diamond Star */}
      <Star 
        className={`${sClass} transition-all duration-300 ${
          status.isDiamond 
            ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.7)]' 
            : 'text-zinc-800'
        }`}
        title={status.isDiamond ? "Diamond Star" : "Diamond Star Slot"}
      />
      {/* Gold Star */}
      <Star 
        className={`${sClass} transition-all duration-300 ${
          status.isGold 
            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.7)]' 
            : 'text-zinc-800'
        }`}
        title={status.isGold ? "Gold Star (Top 10 Uploader)" : "Gold Star Slot"}
      />
      {/* Silver Star */}
      <Star 
        className={`${sClass} transition-all duration-300 ${
          status.isSilver 
            ? 'text-zinc-300 fill-zinc-300 drop-shadow-[0_0_3px_rgba(228,228,231,0.7)]' 
            : 'text-zinc-800'
        }`}
        title={status.isSilver ? "Silver Star (Top 50 Viewer)" : "Silver Star Slot"}
      />
      {/* Bronze Star */}
      <Star 
        className={`${sClass} transition-all duration-300 ${
          status.isBronze 
            ? 'text-orange-500 fill-orange-500 drop-shadow-[0_0_3px_rgba(249,115,22,0.7)]' 
            : 'text-zinc-800'
        }`}
        title={status.isBronze ? "Bronze Star (Top 20 Commenter)" : "Bronze Star Slot"}
      />
      {/* Wood Star */}
      <Star 
        className={`${sClass} text-[#854d0e] fill-[#854d0e] drop-shadow-[0_0_2px_rgba(133,77,14,0.5)]`}
        title="Wood Star (Default)"
      />
    </div>
  );
}
