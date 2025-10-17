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
  };
  isAnimating: boolean;
  isRecording: boolean;
  backgroundImage?: string | null;
  starsOnlyImage?: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const StarField3D: React.FC<StarField3DProps> = ({ 
  stars, 
  settings, 
  isAnimating,
  isRecording,
  backgroundImage,
  starsOnlyImage,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
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

  // Load and separate stars into layers based on size
  useEffect(() => {
    if (!starsOnlyImage || stars.length === 0) return;

    const img = new Image();
    img.onload = () => {
      // Sort stars by size (bigger = closer)
      const sortedStars = [...stars].sort((a, b) => b.size - a.size);
      const third = Math.floor(sortedStars.length / 3);
      
      const layer1Stars = sortedStars.slice(0, third); // Biggest/closest
      const layer2Stars = sortedStars.slice(third, third * 2); // Medium
      const layer3Stars = sortedStars.slice(third * 2); // Smallest/farthest
      
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
          const radius = Math.ceil(star.size * 2); // Capture area around star
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const px = Math.round(star.x) + dx;
              const py = Math.round(star.y) + dy;
              
              if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                const idx = (py * canvas.width + px) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Only copy if within star radius
                if (dist <= radius) {
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
    img.onload = () => setBackgroundImg(img);
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !isAnimating) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { motionType = 'zoom_in', speed = 1 } = settings;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update offsets based on motion type
    const speedFactor = speed * 0.5;
    
    if (motionType === 'zoom_in') {
      // Zoom in - increase scale
      offsetsRef.current.background.scale += speedFactor * 0.0005;
      offsetsRef.current.layer3.scale += speedFactor * 0.001;
      offsetsRef.current.layer2.scale += speedFactor * 0.002;
      offsetsRef.current.layer1.scale += speedFactor * 0.003;
      
      // Reset if too zoomed
      if (offsetsRef.current.layer1.scale > 1.8) {
        Object.keys(offsetsRef.current).forEach(key => {
          offsetsRef.current[key as keyof typeof offsetsRef.current].scale = 1;
        });
      }
    } else if (motionType === 'zoom_out') {
      // Zoom out - decrease scale
      offsetsRef.current.background.scale -= speedFactor * 0.0005;
      offsetsRef.current.layer3.scale -= speedFactor * 0.001;
      offsetsRef.current.layer2.scale -= speedFactor * 0.002;
      offsetsRef.current.layer1.scale -= speedFactor * 0.003;
      
      // Reset if too zoomed out
      if (offsetsRef.current.layer1.scale < 0.5) {
        Object.keys(offsetsRef.current).forEach(key => {
          offsetsRef.current[key as keyof typeof offsetsRef.current].scale = 1;
        });
      }
    } else if (motionType === 'pan_left') {
      // Pan left - parallax movement
      offsetsRef.current.background.x -= speedFactor * 0.2;
      offsetsRef.current.layer3.x -= speedFactor * 0.5;
      offsetsRef.current.layer2.x -= speedFactor * 1.0;
      offsetsRef.current.layer1.x -= speedFactor * 1.5;
      
      // Wrap around
      if (offsetsRef.current.layer1.x < -canvas.width * 0.3) {
        Object.keys(offsetsRef.current).forEach(key => {
          offsetsRef.current[key as keyof typeof offsetsRef.current].x = 0;
        });
      }
    } else if (motionType === 'pan_right') {
      // Pan right - parallax movement
      offsetsRef.current.background.x += speedFactor * 0.2;
      offsetsRef.current.layer3.x += speedFactor * 0.5;
      offsetsRef.current.layer2.x += speedFactor * 1.0;
      offsetsRef.current.layer1.x += speedFactor * 1.5;
      
      // Wrap around
      if (offsetsRef.current.layer1.x > canvas.width * 0.3) {
        Object.keys(offsetsRef.current).forEach(key => {
          offsetsRef.current[key as keyof typeof offsetsRef.current].x = 0;
        });
      }
    }
    
    // Draw background layer (nebula)
    if (backgroundImg) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      
      const bgScale = offsetsRef.current.background.scale;
      const bgX = offsetsRef.current.background.x;
      const bgY = offsetsRef.current.background.y;
      
      const scaledWidth = canvas.width * bgScale;
      const scaledHeight = canvas.height * bgScale;
      const drawX = (canvas.width - scaledWidth) / 2 + bgX;
      const drawY = (canvas.height - scaledHeight) / 2 + bgY;
      
      ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    }
    
    // Draw star layers (farthest to closest)
    const drawLayer = (layer: HTMLCanvasElement | null, offset: { x: number, y: number, scale: number }, alpha: number = 1.0) => {
      if (!layer) return;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const scale = offset.scale;
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const drawX = (canvas.width - scaledWidth) / 2 + offset.x;
      const drawY = (canvas.height - scaledHeight) / 2 + offset.y;
      
      ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    };
    
    drawLayer(starLayers.layer3, offsetsRef.current.layer3, 1.0); // Farthest
    drawLayer(starLayers.layer2, offsetsRef.current.layer2, 1.0); // Medium
    drawLayer(starLayers.layer1, offsetsRef.current.layer1, 1.0); // Closest
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, settings, backgroundImg, starLayers]);

  useEffect(() => {
    if (isAnimating) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Draw static frame
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (backgroundImg) {
          ctx.globalAlpha = 0.8;
          ctx.drawImage(backgroundImg, 0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.globalAlpha = 1.0;
        }
        
        if (starLayers.layer3) ctx.drawImage(starLayers.layer3, 0, 0);
        if (starLayers.layer2) ctx.drawImage(starLayers.layer2, 0, 0);
        if (starLayers.layer1) ctx.drawImage(starLayers.layer1, 0, 0);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, animate, backgroundImg, starLayers]);

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
        width={1920}
        height={1080}
        className="w-full h-full object-contain"
      />
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-300 text-sm font-medium">Recording</span>
        </div>
      )}
      
      {/* Animation indicator */}
      {isAnimating && !isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-300 text-sm font-medium">Animating</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;
