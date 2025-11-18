import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Loader2, Maximize2, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';

interface PostImageCarouselProps {
  images: string[];
  alt: string;
}

export const PostImageCarousel: React.FC<PostImageCarouselProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  console.log('PostImageCarousel received images:', images);

  if (images.length === 0) {
    console.log('No images to display');
    return null;
  }

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
  
  console.log('Current item:', images[currentIndex], 'Is video?', currentIsVideo);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
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

  const renderCarousel = (isInDialog = false) => (
    <div className={`relative w-full ${isInDialog ? 'h-screen' : 'aspect-square'} bg-cosmic-900 group`}>
      {/* Fullscreen Button - Top Left */}
      {!isInDialog && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(true)}
          className="absolute left-2 top-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
      )}

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
            <div className="relative w-full h-full bg-black">
              <video
                ref={videoRef}
                src={images[currentIndex]}
                className={`w-full h-full ${isInDialog ? 'object-contain' : 'object-cover'}`}
                playsInline
                loop
                muted
                autoPlay
                preload="auto"
                crossOrigin="anonymous"
                controls={false}
                onLoadStart={() => {
                  console.log('Video loading:', images[currentIndex]);
                  setIsLoading(true);
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully');
                  setIsLoading(false);
                }}
                onError={(e) => {
                  const video = e.target as HTMLVideoElement;
                  console.error('Video error:', {
                    src: images[currentIndex],
                    error: video.error,
                    networkState: video.networkState,
                    readyState: video.readyState
                  });
                  setIsLoading(false);
                }}
                onPlay={() => {
                  console.log('Video started playing');
                  setIsPlaying(true);
                }}
                onPause={() => setIsPlaying(false)}
                key={images[currentIndex]}
              >
                Your browser does not support the video tag.
              </video>
              
              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
              
              {/* Play/Pause button in center */}
              {!isPlaying && !isLoading && (
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center group"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <div className="p-4 bg-black/50 rounded-full hover:bg-black/70 transition-all backdrop-blur-sm group-hover:scale-110">
                    <Play className="h-12 w-12 text-white fill-white" />
                  </div>
                </button>
              )}
              
              {/* Invisible overlay for pause when playing */}
              {isPlaying && !isLoading && (
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 bg-transparent"
                  aria-label="Pause video"
                />
              )}
            </div>
          ) : (
            <OptimizedImage
              src={images[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              className={`w-full h-full ${isInDialog ? 'object-contain' : 'object-cover'}`}
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
                key={url}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {renderCarousel(false)}
      
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-full h-screen w-screen p-0 bg-black border-0">
          <DialogDescription className="sr-only">
            Fullscreen image viewer with carousel navigation
          </DialogDescription>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12 backdrop-blur-sm z-50"
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </Button>
          
          {renderCarousel(true)}
        </DialogContent>
      </Dialog>
    </>
  );
};
