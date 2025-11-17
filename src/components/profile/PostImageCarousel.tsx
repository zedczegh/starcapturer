import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PostImageCarouselProps {
  images: string[];
  alt: string;
}

export const PostImageCarousel: React.FC<PostImageCarouselProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (images.length === 0) return null;

  // Check if current item is a video based on file extension or URL pattern
  const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = [
      '.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv', '.m4v',
      '.flv', '.wmv', '.3gp', '.mpeg', '.mpg', '.m2v'
    ];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('video') ||
           url.includes('/video/');
  };

  // Get MIME type from URL
  const getVideoMimeType = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.webm')) return 'video/webm';
    if (lowerUrl.includes('.ogg') || lowerUrl.includes('.ogv')) return 'video/ogg';
    if (lowerUrl.includes('.mov') || lowerUrl.includes('.m4v')) return 'video/mp4';
    return 'video/mp4'; // default fallback
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentIsVideo = isVideo(images[currentIndex]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(currentIsVideo);
    
    if (videoRef.current && currentIsVideo) {
      const video = videoRef.current;
      
      // Reset video element
      video.pause();
      video.currentTime = 0;
      video.load();
      
      // Small delay to ensure video is ready
      const playTimeout = setTimeout(() => {
        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error('Video play error:', error);
            setIsLoading(false);
          });
      }, 100);
      
      return () => clearTimeout(playTimeout);
    }
  }, [currentIndex, currentIsVideo, images]);

  return (
    <div className="relative w-full aspect-square bg-cosmic-900">
      {/* Main Image or Video */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {currentIsVideo ? (
            <div className="relative w-full h-full" onClick={togglePlayPause}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover cursor-pointer"
                playsInline
                loop
                muted={isMuted}
                autoPlay
                preload="auto"
                onLoadStart={() => setIsLoading(true)}
                onLoadedData={() => setIsLoading(false)}
                onError={(e) => {
                  console.error('Video load error - check if file exists in storage');
                  setIsLoading(false);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                key={images[currentIndex]}
              >
                <source src={images[currentIndex]} type={getVideoMimeType(images[currentIndex])} />
                <source src={images[currentIndex]} type="video/mp4" />
                <source src={images[currentIndex]} type="video/webm" />
                <source src={images[currentIndex]} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
              
              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              
              {/* Mute/Unmute button - TikTok style */}
              <button
                onClick={toggleMute}
                className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm z-20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          ) : (
            <OptimizedImage
              src={images[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Only show if multiple items */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to ${isVideo(url) ? 'video' : 'image'} ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
