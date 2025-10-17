import React, { useRef, useEffect, useState, useCallback } from 'react';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
}

interface StarField3DProps {
  stars: StarData[];
  settings: {
    motionType?: string;
    speed?: number;
    duration?: number;
    fieldOfView?: number;
    amplification?: number;
  };
  isAnimating: boolean;
  isRecording: boolean;
  backgroundImage?: string | null;
  starsOnlyImage?: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onProgressUpdate?: (progress: number) => void;
  onAnimationComplete?: () => void;
}

const StarField3D: React.FC<StarField3DProps> = ({ 
  stars, 
  settings, 
  isAnimating,
  isRecording,
  backgroundImage,
  starsOnlyImage,
  onCanvasReady,
  onProgressUpdate,
  onAnimationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const animationStartTimeRef = useRef<number>(0);
  const offsetsRef = useRef({ 
    layer1: { x: 0, y: 0, scale: 1 }, // Largest/brightest stars (closest)
    layer2: { x: 0, y: 0, scale: 1 }, // Medium stars
    layer3: { x: 0, y: 0, scale: 1 }, // Small stars (farthest)
    background: { x: 0, y: 0, scale: 1 } // Nebula background
  });
  
  const [starLayers, setStarLayers] = useState<{
    bright: HTMLCanvasElement | null;
    medium: HTMLCanvasElement | null;
    dim: HTMLCanvasElement | null;
  }>({ bright: null, medium: null, dim: null });
  
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });

  // Create SIZE-based star layers - each star (including spikes) in only ONE layer
  useEffect(() => {
    if (!starsOnlyImage || stars.length === 0) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      // Sort stars by size to determine layer thresholds
      const sortedBySizes = [...stars].sort((a, b) => b.size - a.size);
      const largeThreshold = sortedBySizes[Math.floor(stars.length * 0.3)]?.size || 10; // Top 30%
      const mediumThreshold = sortedBySizes[Math.floor(stars.length * 0.65)]?.size || 5; // Middle 35%
      
      console.log(`Size thresholds - Large: ${largeThreshold}, Medium: ${mediumThreshold}`);
      
      // Create three separate canvases
      const largeCanvas = document.createElement('canvas');
      const mediumCanvas = document.createElement('canvas');
      const smallCanvas = document.createElement('canvas');
      
      largeCanvas.width = mediumCanvas.width = smallCanvas.width = img.width;
      largeCanvas.height = mediumCanvas.height = smallCanvas.height = img.height;
      
      const largeCtx = largeCanvas.getContext('2d')!;
      const mediumCtx = mediumCanvas.getContext('2d')!;
      const smallCtx = smallCanvas.getContext('2d')!;
      
      // Draw image to temporary canvas to read pixel data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);
      
      const sourceData = tempCtx.getImageData(0, 0, img.width, img.height);
      
      // Create separate image data for each layer
      const largeData = largeCtx.createImageData(img.width, img.height);
      const mediumData = mediumCtx.createImageData(img.width, img.height);
      const smallData = smallCtx.createImageData(img.width, img.height);
      
      // Create a map of which layer each pixel belongs to based on nearest star
      const pixelLayerMap = new Uint8Array(img.width * img.height); // 0=none, 1=large, 2=medium, 3=small
      
      // For each star, assign all its pixels to appropriate layer
      for (const star of stars) {
        const starLayer = star.size >= largeThreshold ? 1 : 
                         star.size >= mediumThreshold ? 2 : 3;
        
        // Mark all pixels within star's bounding box
        const radius = Math.ceil(star.size / 2) + 5; // Extra padding for spikes
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const px = Math.floor(star.x) + dx;
            const py = Math.floor(star.y) + dy;
            
            if (px >= 0 && px < img.width && py >= 0 && py < img.height) {
              const idx = py * img.width + px;
              const pixelIdx = idx * 4;
              
              // Only assign if pixel has some brightness
              const luminance = 0.299 * sourceData.data[pixelIdx] + 
                              0.587 * sourceData.data[pixelIdx + 1] + 
                              0.114 * sourceData.data[pixelIdx + 2];
              
              if (luminance > 30 && pixelLayerMap[idx] === 0) {
                pixelLayerMap[idx] = starLayer;
              }
            }
          }
        }
      }
      
      // Split pixels into layers based on the map
      for (let i = 0; i < sourceData.data.length; i += 4) {
        const pixelIndex = i / 4;
        const layer = pixelLayerMap[pixelIndex];
        
        const r = sourceData.data[i];
        const g = sourceData.data[i + 1];
        const b = sourceData.data[i + 2];
        const a = sourceData.data[i + 3];
        
        if (layer === 1) {
          // Large stars (closest, fastest)
          largeData.data[i] = r;
          largeData.data[i + 1] = g;
          largeData.data[i + 2] = b;
          largeData.data[i + 3] = a;
        } else if (layer === 2) {
          // Medium stars
          mediumData.data[i] = r;
          mediumData.data[i + 1] = g;
          mediumData.data[i + 2] = b;
          mediumData.data[i + 3] = a;
        } else if (layer === 3) {
          // Small stars (farthest, slowest)
          smallData.data[i] = r;
          smallData.data[i + 1] = g;
          smallData.data[i + 2] = b;
          smallData.data[i + 3] = a;
        }
      }
      
      // Put the separated data onto the canvases
      largeCtx.putImageData(largeData, 0, 0);
      mediumCtx.putImageData(mediumData, 0, 0);
      smallCtx.putImageData(smallData, 0, 0);
      
      setStarLayers({
        bright: largeCanvas,   // Large stars (closest)
        medium: mediumCanvas,  // Medium stars
        dim: smallCanvas       // Small stars (farthest)
      });
      
      const largeCount = stars.filter(s => s.size >= largeThreshold).length;
      const mediumCount = stars.filter(s => s.size >= mediumThreshold && s.size < largeThreshold).length;
      const smallCount = stars.filter(s => s.size < mediumThreshold).length;
      console.log(`Star layers by size: ${largeCount} large, ${mediumCount} medium, ${smallCount} small`);
    };
    
    img.src = starsOnlyImage;
  }, [starsOnlyImage, stars]);

  // Load background image
  useEffect(() => {
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = () => {
      setBackgroundImg(img);
      // Set dimensions if not already set
      if (imageDimensions.width === 1920 && imageDimensions.height === 1080) {
        setImageDimensions({ width: img.width, height: img.height });
      }
    };
    img.src = backgroundImage;
  }, [backgroundImage, imageDimensions]);

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !isAnimating) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { motionType = 'zoom_in', speed = 1, duration = 10 } = settings;
    
    // Calculate progress
    if (animationStartTimeRef.current === 0) {
      animationStartTimeRef.current = Date.now();
    }
    
    const elapsed = (Date.now() - animationStartTimeRef.current) / 1000;
    const progress = Math.min((elapsed / duration) * 100, 100);
    
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
    
    // Stop animation when duration is reached
    if (progress >= 100) {
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return; // Stop the animation loop
    }
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate zoom/pan with DRAMATIC parallax differences for 3D depth
    const progressRatio = progress / 100;
    
    // Amplification factor from settings (100-300%)
    const ampFactor = (settings.amplification || 150) / 100;
    
    if (motionType === 'zoom_in') {
      // Create 3D depth: large stars zoom faster than small stars
      offsetsRef.current.background.scale = 1.0 + (progressRatio * 0.4 * ampFactor);  // Background moves slowest
      offsetsRef.current.layer3.scale = 1.0 + (progressRatio * 0.6 * ampFactor);      // Small stars (far)
      offsetsRef.current.layer2.scale = 1.0 + (progressRatio * 1.0 * ampFactor);      // Medium stars
      offsetsRef.current.layer1.scale = 1.0 + (progressRatio * 1.5 * ampFactor);      // Large stars (close) - fastest
    } else if (motionType === 'zoom_out') {
      // Zoom out with depth
      const bgMax = 1.0 + (0.4 * ampFactor);
      const smallMax = 1.0 + (0.6 * ampFactor);
      const medMax = 1.0 + (1.0 * ampFactor);
      const largeMax = 1.0 + (1.5 * ampFactor);
      
      offsetsRef.current.background.scale = bgMax - (progressRatio * 0.4 * ampFactor);
      offsetsRef.current.layer3.scale = smallMax - (progressRatio * 0.6 * ampFactor);
      offsetsRef.current.layer2.scale = medMax - (progressRatio * 1.0 * ampFactor);
      offsetsRef.current.layer1.scale = largeMax - (progressRatio * 1.5 * ampFactor);
    } else if (motionType === 'pan_left') {
      // Pan with 3D parallax: large stars pan faster
      const panAmount = progressRatio * speed * 250 * ampFactor;
      offsetsRef.current.background.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer3.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer2.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer1.scale = 1.0 + (0.3 * ampFactor);
      
      offsetsRef.current.background.x = -panAmount * 0.4;  // Background slowest
      offsetsRef.current.layer3.x = -panAmount * 0.6;      // Small stars
      offsetsRef.current.layer2.x = -panAmount * 1.0;      // Medium stars
      offsetsRef.current.layer1.x = -panAmount * 1.5;      // Large stars fastest
    } else if (motionType === 'pan_right') {
      // Pan right with 3D parallax
      const panAmount = progressRatio * speed * 250 * ampFactor;
      offsetsRef.current.background.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer3.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer2.scale = 1.0 + (0.3 * ampFactor);
      offsetsRef.current.layer1.scale = 1.0 + (0.3 * ampFactor);
      
      offsetsRef.current.background.x = panAmount * 0.4;
      offsetsRef.current.layer3.x = panAmount * 0.6;
      offsetsRef.current.layer2.x = panAmount * 1.0;
      offsetsRef.current.layer1.x = panAmount * 1.5;
    }
    
    // Draw background layer (nebula) first
    if (backgroundImg) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      
      const bgScale = offsetsRef.current.background.scale;
      const bgX = offsetsRef.current.background.x;
      const bgY = offsetsRef.current.background.y;
      
      const scaledWidth = backgroundImg.width * bgScale;
      const scaledHeight = backgroundImg.height * bgScale;
      const drawX = (canvas.width - scaledWidth) / 2 + bgX;
      const drawY = (canvas.height - scaledHeight) / 2 + bgY;
      
      ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    }
    
    // Draw three size-based star layers with 3D parallax (back to front)
    if (starLayers.dim || starLayers.medium || starLayers.bright) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Layer 3: Small stars (farthest, slowest movement)
      if (starLayers.dim) {
        const scale = offsetsRef.current.layer3.scale;
        const scaledWidth = starLayers.dim.width * scale;
        const scaledHeight = starLayers.dim.height * scale;
        const drawX = (canvas.width - scaledWidth) / 2 + offsetsRef.current.layer3.x;
        const drawY = (canvas.height - scaledHeight) / 2 + offsetsRef.current.layer3.y;
        ctx.drawImage(starLayers.dim, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 2: Medium stars (middle distance, medium speed)
      if (starLayers.medium) {
        const scale = offsetsRef.current.layer2.scale;
        const scaledWidth = starLayers.medium.width * scale;
        const scaledHeight = starLayers.medium.height * scale;
        const drawX = (canvas.width - scaledWidth) / 2 + offsetsRef.current.layer2.x;
        const drawY = (canvas.height - scaledHeight) / 2 + offsetsRef.current.layer2.y;
        ctx.drawImage(starLayers.medium, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 1: Large stars (closest, fastest movement)
      if (starLayers.bright) {
        const scale = offsetsRef.current.layer1.scale;
        const scaledWidth = starLayers.bright.width * scale;
        const scaledHeight = starLayers.bright.height * scale;
        const drawX = (canvas.width - scaledWidth) / 2 + offsetsRef.current.layer1.x;
        const drawY = (canvas.height - scaledHeight) / 2 + offsetsRef.current.layer1.y;
        ctx.drawImage(starLayers.bright, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      ctx.restore();
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, settings, backgroundImg, starLayers, onProgressUpdate, onAnimationComplete]);

  useEffect(() => {
    if (isAnimating) {
      // Reset timer and progress when animation starts
      animationStartTimeRef.current = 0;
      
      // Immediately set progress to 0 to ensure the dot starts at beginning
      if (onProgressUpdate) {
        onProgressUpdate(0);
      }
      
      // Initialize all scales and positions to their starting values
      // They will be calculated based on progress in the animate function
      offsetsRef.current = { 
        layer1: { x: 0, y: 0, scale: 1 },
        layer2: { x: 0, y: 0, scale: 1 },
        layer3: { x: 0, y: 0, scale: 1 },
        background: { x: 0, y: 0, scale: 1 }
      };
      
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationStartTimeRef.current = 0;
      if (onProgressUpdate) {
        onProgressUpdate(0);
      }
      // Draw static frame
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (backgroundImg) {
          ctx.globalAlpha = 0.85;
          // Center image without stretching
          const drawX = (canvasRef.current.width - backgroundImg.width) / 2;
          const drawY = (canvasRef.current.height - backgroundImg.height) / 2;
          ctx.drawImage(backgroundImg, drawX, drawY, backgroundImg.width, backgroundImg.height);
          ctx.globalAlpha = 1.0;
        }
        
        if (starLayers.dim || starLayers.medium || starLayers.bright) {
          ctx.globalCompositeOperation = 'screen';
          if (starLayers.dim) {
            const drawX = (canvasRef.current.width - starLayers.dim.width) / 2;
            const drawY = (canvasRef.current.height - starLayers.dim.height) / 2;
            ctx.drawImage(starLayers.dim, drawX, drawY);
          }
          if (starLayers.medium) {
            const drawX = (canvasRef.current.width - starLayers.medium.width) / 2;
            const drawY = (canvasRef.current.height - starLayers.medium.height) / 2;
            ctx.drawImage(starLayers.medium, drawX, drawY);
          }
          if (starLayers.bright) {
            const drawX = (canvasRef.current.width - starLayers.bright.width) / 2;
            const drawY = (canvasRef.current.height - starLayers.bright.height) / 2;
            ctx.drawImage(starLayers.bright, drawX, drawY);
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, animate, backgroundImg, starLayers, onProgressUpdate, onAnimationComplete]);

  // Notify parent when canvas is ready
  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  if (stars.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cosmic-950 rounded-b-lg">
        <p className="text-cosmic-400">
          Upload both images and process to generate 3D star field
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-b-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={imageDimensions.width}
        height={imageDimensions.height}
        className="w-full h-full object-contain bg-black"
      />
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-300 text-sm font-medium">Recording</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;
