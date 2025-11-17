import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PostImageCarouselProps {
  images: string[];
  alt: string;
}

export const PostImageCarousel: React.FC<PostImageCarouselProps> = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full aspect-square bg-cosmic-900">
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <OptimizedImage
            src={images[currentIndex]}
            alt={`${alt} - ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Only show if multiple images */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
