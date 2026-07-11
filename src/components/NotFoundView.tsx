import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Undo2 } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
}

export default function NotFoundView({ onGoHome }: NotFoundViewProps) {
  return (
    <div id="not-found-container" className="max-w-xl mx-auto px-4 py-12 space-y-6 text-white animate-in fade-in duration-300">
      
      {/* Title & Path Breadcrumbs */}
      <div id="not-found-breadcrumbs" className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 id="not-found-main-title" className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            ERROR <span className="text-[#E50914]">404</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-0.5">STATUS: SIGNAL_LOST</p>
        </div>
        <button
          id="not-found-back-home-btn"
          onClick={onGoHome}
          className="flex items-center justify-center bg-white/5 border border-white/10 p-2.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-[#E50914]/15 hover:border-[#E50914]/40 hover:text-white text-zinc-400 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
          title="Back to Screen"
        >
          <Undo2 className="h-4 w-4 text-zinc-300" />
          <span className="hidden sm:inline ml-1.5">Back to Screen</span>
        </button>
      </div>

      {/* Elegant, stylized Television Monitor Screen */}
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-xl overflow-hidden relative shadow-2xl aspect-video flex flex-col justify-between p-4">
        
        {/* Ambient Background Grid / Noise */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-15 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_6px_100%]" />

        {/* Static SMPTE Color Bars background with noise */}
        <div className="absolute inset-0 z-0 flex flex-col opacity-40 filter blur-[1px] contrast-125">
          <div className="h-full w-full bg-[#151515] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-repeat bg-[radial-gradient(#252525_10%,transparent_11%)] bg-[length:12px_12px] opacity-20 animate-pulse" />
            
            {/* Visual Glitch Bars */}
            <div 
              className="absolute h-3 w-full bg-[#E50914]/20 top-1/4 left-0 animate-bounce"
              style={{ animationDuration: '3s' }}
            />
            <div 
              className="absolute h-2 w-full bg-cyan-500/20 bottom-1/3 left-0 animate-bounce"
              style={{ animationDuration: '1.8s' }}
            />

            {/* SMPTE Bar Grid */}
            <div className="absolute inset-0 flex opacity-25">
              <div className="w-1/7 bg-white h-full" />
              <div className="w-1/7 bg-yellow-400 h-full" />
              <div className="w-1/7 bg-cyan-400 h-full" />
              <div className="w-1/7 bg-green-500 h-full" />
              <div className="w-1/7 bg-magenta-500 h-full" />
              <div className="w-1/7 bg-red-600 h-full" />
              <div className="w-1/7 bg-blue-600 h-full" />
            </div>
          </div>
        </div>

        {/* Screen Header overlay */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-500 bg-black/40 px-2 py-1 rounded border border-white/5 backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E50914] animate-ping" />
            SIGNAL LOST (404)
          </span>
          <span>FREQ: 104.9 MHz</span>
        </div>

        {/* Screen Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2 px-6"
          >
            <AlertTriangle className="h-10 w-10 text-[#E50914] mx-auto drop-shadow-[0_0_10px_rgba(229,9,20,0.5)] animate-pulse" />
            <h3 className="text-base sm:text-lg font-black font-display text-white tracking-tight uppercase">
              Feed Signal Interrupted
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans">
              The page or reel you're looking for is off-frequency or has been taken offline. Tap the back button to return to the main lobby.
            </p>
          </motion.div>
        </div>

        {/* Screen Footer overlay */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded border border-white/5 backdrop-blur-sm mt-2">
          <span>SCANNING DEVIATIONS...</span>
          <span>FOCUS: 100%</span>
        </div>

      </div>

    </div>
  );
}
