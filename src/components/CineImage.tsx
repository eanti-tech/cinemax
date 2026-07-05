/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface CineImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "eager" | "lazy";
}

export default function CineImage({ src, alt, className, style, loading }: CineImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      return;
    }

    // If it's a local IndexedDB thumbnail key
    if (src.startsWith('indexeddb://')) {
      const key = src.replace('indexeddb://', '');
      let active = true;
      let objectUrl = '';

      const fetchImage = async () => {
        try {
          const { getFile } = await import('../lib/indexedDB');
          const blob = await getFile(key);
          if (active) {
            if (blob) {
              objectUrl = URL.createObjectURL(blob);
              setResolvedSrc(objectUrl);
            } else {
              // fallback placeholder
              setResolvedSrc('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop');
            }
          }
        } catch (err) {
          console.error('Error fetching image from IndexedDB:', err);
          if (active) {
            setResolvedSrc('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop');
          }
        }
      };

      fetchImage();

      return () => {
        active = false;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } else {
      // Standard HTTP URL
      setResolvedSrc(src);
    }
  }, [src]);

  // Render a skeleton placeholder when waiting for local file to load
  if (!resolvedSrc) {
    return (
      <div 
        className={`bg-zinc-900 animate-pulse ${className || ''}`} 
        style={style}
      />
    );
  }

  return (
    <img 
      src={resolvedSrc} 
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      referrerPolicy="no-referrer"
    />
  );
}
