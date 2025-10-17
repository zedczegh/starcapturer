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
    layer1: HTMLCanvasElement | null;
    layer2: HTMLCanvasElement | null;
    layer3: HTMLCanvasElement | null;
  }>({ layer1: null, layer2: null, layer3: null });
  
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });

  // Load and separate stars into layers based on size
  useEffect(() => {
    if (!starsOnlyImage || stars.length === 0) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      setImageDimensions({ width: img.width, height: img.height });
      
      // Sort stars by size (bigger = closer)
      const sortedStars = [...stars].sort((a, b) => b.size - a.size);
      const third = Math.floor(sortedStars.length / 3);
      
      const layer1Stars = sortedStars.slice(0, third); // Biggest/closest
      const layer2Stars = sortedStars.slice(third, third * 2); // Medium
      const layer3Stars = sortedStars.slice(third * 2); // Smallest/farthest
      
      console.log(`Creating star layers: L1=${layer1Stars.length}, L2=${layer2Stars.length}, L3=${layer3Stars.length}`);
      
      // Create canvas for each layer
      const createLayerCanvas = (layerStars: StarData[]) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Draw the full stars image first
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Create a mask - only keep pixels that belong to stars in this layer
        const newData = ctx.createImageData(canvas.width, canvas.height);
        
        layerStars.forEach(star => {
          // Use larger radius to capture full star including glow
          const radius = Math.ceil(Math.max(star.size * 4, 8));
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const px = Math.round(star.x) + dx;
              const py = Math.round(star.y) + dy;
              
              if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                const idx = (py * canvas.width + px) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Copy all pixels within radius that have brightness
                if (dist <= radius && data[idx + 3] > 0) {
                  newData.data[idx] = data[idx];
                  newData.data[idx + 1] = data[idx + 1];
                  newData.data[idx + 2] = data[idx + 2];
                  newData.data[idx + 3] = data[idx + 3];
                }
              }
            }
          }
        });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(newData, 0, 0);
        return canvas;
      };
      
      setStarLayers({
        layer1: createLayerCanvas(layer1Stars),
        layer2: createLayerCanvas(layer2Stars),
        layer3: createLayerCanvas(layer3Stars)
      });
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
    
    // Update offsets based on motion type - NO RESET, continuous motion
    const speedFactor = speed * 0.5;
    
    if (motionType === 'zoom_in') {
      // Zoom in - increase scale continuously
      offsetsRef.current.background.scale += speedFactor * 0.0005;
      offsetsRef.current.layer3.scale += speedFactor * 0.001;
      offsetsRef.current.layer2.scale += speedFactor * 0.002;
      offsetsRef.current.layer1.scale += speedFactor * 0.003;
    } else if (motionType === 'zoom_out') {
      // Zoom out - decrease scale continuously
      offsetsRef.current.background.scale -= speedFactor * 0.0005;
      offsetsRef.current.layer3.scale -= speedFactor * 0.001;
      offsetsRef.current.layer2.scale -= speedFactor * 0.002;
      offsetsRef.current.layer1.scale -= speedFactor * 0.003;
    } else if (motionType === 'pan_left') {
      // Pan left - parallax movement continuously
      offsetsRef.current.background.x -= speedFactor * 0.2;
      offsetsRef.current.layer3.x -= speedFactor * 0.5;
      offsetsRef.current.layer2.x -= speedFactor * 1.0;
      offsetsRef.current.layer1.x -= speedFactor * 1.5;
    } else if (motionType === 'pan_right') {
      // Pan right - parallax movement continuously
      offsetsRef.current.background.x += speedFactor * 0.2;
      offsetsRef.current.layer3.x += speedFactor * 0.5;
      offsetsRef.current.layer2.x += speedFactor * 1.0;
      offsetsRef.current.layer1.x += speedFactor * 1.5;
    }
    
    // Draw background layer (nebula) - maintain aspect ratio
    if (backgroundImg) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      
      const bgScale = offsetsRef.current.background.scale;
      const bgX = offsetsRef.current.background.x;
      const bgY = offsetsRef.current.background.y;
      
      // Use actual image dimensions, no stretching
      const scaledWidth = backgroundImg.width * bgScale;
      const scaledHeight = backgroundImg.height * bgScale;
      const drawX = (canvas.width - scaledWidth) / 2 + bgX;
      const drawY = (canvas.height - scaledHeight) / 2 + bgY;
      
      ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    }
    
    // Draw star layers (farthest to closest) - maintain aspect ratio
    const drawLayer = (layer: HTMLCanvasElement | null, offset: { x: number, y: number, scale: number }, alpha: number = 1.0) => {
      if (!layer) return;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const scale = offset.scale;
      // Use actual layer dimensions, no stretching
      const scaledWidth = layer.width * scale;
      const scaledHeight = layer.height * scale;
      const drawX = (canvas.width - scaledWidth) / 2 + offset.x;
      const drawY = (canvas.height - scaledHeight) / 2 + offset.y;
      
      ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    };
    
    drawLayer(starLayers.layer3, offsetsRef.current.layer3, 1.0); // Farthest
    drawLayer(starLayers.layer2, offsetsRef.current.layer2, 1.0); // Medium
    drawLayer(starLayers.layer1, offsetsRef.current.layer1, 1.0); // Closest
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, settings, backgroundImg, starLayers, onProgressUpdate, onAnimationComplete]);

  useEffect(() => {
    if (isAnimating) {
      // Reset offsets and timer when animation starts
      animationStartTimeRef.current = 0;
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
        
        if (starLayers.layer3) {
          const drawX = (canvasRef.current.width - starLayers.layer3.width) / 2;
          const drawY = (canvasRef.current.height - starLayers.layer3.height) / 2;
          ctx.drawImage(starLayers.layer3, drawX, drawY);
        }
        if (starLayers.layer2) {
          const drawX = (canvasRef.current.width - starLayers.layer2.width) / 2;
          const drawY = (canvasRef.current.height - starLayers.layer2.height) / 2;
          ctx.drawImage(starLayers.layer2, drawX, drawY);
        }
        if (starLayers.layer1) {
          const drawX = (canvasRef.current.width - starLayers.layer1.width) / 2;
          const drawY = (canvasRef.current.height - starLayers.layer1.height) / 2;
          ctx.drawImage(starLayers.layer1, drawX, drawY);
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
      
      {/* Recording indicator - minimalist bar with animated dot */}
      {isRecording && (
        <div className="absolute top-4 right-4 w-32 h-1.5 bg-red-500/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-red-500/40 rounded-full" />
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-[slide_2s_ease-in-out_infinite]" 
                 style={{ animation: 'slide 2s ease-in-out infinite' }} />
          </div>
        </div>
      )}
      
      {/* Animation indicator - minimalist bar with animated dot */}
      {isAnimating && !isRecording && (
        <div className="absolute top-4 right-4 w-32 h-1.5 bg-primary/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-primary/40 rounded-full" />
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50 animate-[slide_2s_ease-in-out_infinite]" 
                 style={{ animation: 'slide 2s ease-in-out infinite' }} />
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slide {
          0%, 100% { left: 0; }
          50% { left: calc(100% - 0.5rem); }
        }
      `}</style>
    </div>
  );
};

export default StarField3D;
