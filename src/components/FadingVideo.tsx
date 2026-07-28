import React, { useRef, useState, useEffect } from 'react';

interface FadingVideoProps {
  src: string | string[];
  className?: string;
  style?: React.CSSProperties;
}

export const FadingVideo: React.FC<FadingVideoProps> = ({ src, className = '', style }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sources = Array.isArray(src) ? src : [src];
  const currentSrc = sources[currentIndex] || sources[0];

  const handleLoadedData = () => {
    let start: number | null = null;
    const duration = 500; // 500ms fade in

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const currentOpacity = Math.min(progress / duration, 1);
      setOpacity(currentOpacity);
      if (progress < duration) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const remaining = videoRef.current.duration - videoRef.current.currentTime;
    if (remaining <= 0.55 && opacity === 1) {
      let start: number | null = null;
      const duration = 550; // 550ms fade out

      const fadeOutStep = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const currentOpacity = Math.max(1 - progress / duration, 0);
        setOpacity(currentOpacity);
        if (progress < duration) {
          requestAnimationFrame(fadeOutStep);
        }
      };
      requestAnimationFrame(fadeOutStep);
    }
  };

  const handleEnded = () => {
    if (sources.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setCurrentIndex((prev) => (prev + 1) % sources.length);
    }
  };

  return (
    <video
      ref={videoRef}
      src={currentSrc}
      className={className}
      style={{ ...style, opacity, transition: 'opacity 0.2s ease-out' }}
      autoPlay
      muted
      playsInline
      preload="auto"
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
};
