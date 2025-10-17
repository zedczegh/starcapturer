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

  // Load and separate stars into layers - keep original appearance
  useEffect(() => {
    if (!starsOnlyImage || stars.length === 0) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      setImageDimensions({ width: img.width, height: img.height });
      
      // Sort stars by combined size and brightness for depth perception
      const sortedStars = [...stars].sort((a, b) => {
        const depthA = a.size * a.brightness;
        const depthB = b.size * b.brightness;
        return depthB - depthA;
      });
      
      // Distribute: 25% closest, 35% middle, 40% farthest
      const layer1Count = Math.floor(sortedStars.length * 0.25);
      const layer2Count = Math.floor(sortedStars.length * 0.35);
      
      const layer1Stars = sortedStars.slice(0, layer1Count);
      const layer2Stars = sortedStars.slice(layer1Count, layer1Count + layer2Count);
      const layer3Stars = sortedStars.slice(layer1Count + layer2Count);
      
      console.log(`Star layers: L1=${layer1Stars.length}, L2=${layer2Stars.length}, L3=${layer3Stars.length}`);
      
      // Load source image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);
      const sourceImageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const sourceData = sourceImageData.data;
      
      // Create canvas for each layer - preserve exact star appearance from original
      const createLayerCanvas = (layerStars: StarData[], layerName: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        
        // Create transparent canvas
        const newData = ctx.createImageData(canvas.width, canvas.height);
        
        // Extract each star with generous radius to capture full glow
        layerStars.forEach(star => {
          // Generous radius to capture full star and glow
          const radius = Math.ceil(Math.max(star.size * 5, 10));
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const px = Math.round(star.x) + dx;
              const py = Math.round(star.y) + dy;
              
              if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                const idx = (py * canvas.width + px) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= radius) {
                  const r = sourceData[idx];
                  const g = sourceData[idx + 1];
                  const b = sourceData[idx + 2];
                  
                  // Copy any non-black pixel (stars and their glow)
                  if (r > 5 || g > 5 || b > 5) {
                    // Use brightest value to preserve star appearance
                    const currentR = newData.data[idx];
                    const currentG = newData.data[idx + 1];
                    const currentB = newData.data[idx + 2];
                    
                    if (r + g + b > currentR + currentG + currentB) {
                      newData.data[idx] = r;
                      newData.data[idx + 1] = g;
                      newData.data[idx + 2] = b;
                      newData.data[idx + 3] = 255;
                    }
                  }
                }
              }
            }
          }
        });
        
        ctx.putImageData(newData, 0, 0);
        console.log(`${layerName}: ${layerStars.length} stars with original appearance`);
        return canvas;
      };
      
      setStarLayers({
        layer1: createLayerCanvas(layer1Stars, 'Layer1(closest)'),
        layer2: createLayerCanvas(layer2Stars, 'Layer2(middle)'),
        layer3: createLayerCanvas(layer3Stars, 'Layer3(farthest)')
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
    
    // Calculate zoom/pan based on progress for consistent animation
    const progressRatio = progress / 100;
    
    if (motionType === 'zoom_in') {
      // Zoom in from 1.0 - reduced motion intensity
      offsetsRef.current.background.scale = 1.0 + (progressRatio * 0.3);
      offsetsRef.current.layer3.scale = 1.0 + (progressRatio * 0.4);
      offsetsRef.current.layer2.scale = 1.0 + (progressRatio * 0.5);
      offsetsRef.current.layer1.scale = 1.0 + (progressRatio * 0.6);
    } else if (motionType === 'zoom_out') {
      // Zoom out - exact reverse of zoom in
      offsetsRef.current.background.scale = 1.3 - (progressRatio * 0.3);
      offsetsRef.current.layer3.scale = 1.4 - (progressRatio * 0.4);
      offsetsRef.current.layer2.scale = 1.5 - (progressRatio * 0.5);
      offsetsRef.current.layer1.scale = 1.6 - (progressRatio * 0.6);
    } else if (motionType === 'pan_left') {
      // Pan left with reduced speed
      const panAmount = progressRatio * speed * 200;
      offsetsRef.current.background.scale = 1.5; // Fixed scale to avoid gaps
      offsetsRef.current.layer3.scale = 1.5;
      offsetsRef.current.layer2.scale = 1.5;
      offsetsRef.current.layer1.scale = 1.5;
      offsetsRef.current.background.x = -panAmount * 0.3;
      offsetsRef.current.layer3.x = -panAmount * 0.5;
      offsetsRef.current.layer2.x = -panAmount * 0.8;
      offsetsRef.current.layer1.x = -panAmount * 1.2;
    } else if (motionType === 'pan_right') {
      // Pan right with reduced speed
      const panAmount = progressRatio * speed * 200;
      offsetsRef.current.background.scale = 1.5; // Fixed scale to avoid gaps
      offsetsRef.current.layer3.scale = 1.5;
      offsetsRef.current.layer2.scale = 1.5;
      offsetsRef.current.layer1.scale = 1.5;
      offsetsRef.current.background.x = panAmount * 0.3;
      offsetsRef.current.layer3.x = panAmount * 0.5;
      offsetsRef.current.layer2.x = panAmount * 0.8;
      offsetsRef.current.layer1.x = panAmount * 1.2;
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
    
    // Draw star layers on top (farthest to closest) with proper blending
    const drawLayer = (layer: HTMLCanvasElement | null, offset: { x: number, y: number, scale: number }) => {
      if (!layer) return;
      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for stars
      ctx.globalAlpha = 1.0; // Full opacity for stars
      
      const scale = offset.scale;
      const scaledWidth = layer.width * scale;
      const scaledHeight = layer.height * scale;
      const drawX = (canvas.width - scaledWidth) / 2 + offset.x;
      const drawY = (canvas.height - scaledHeight) / 2 + offset.y;
      
      ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
      ctx.restore();
    };
    
    drawLayer(starLayers.layer3, offsetsRef.current.layer3); // Farthest stars
    drawLayer(starLayers.layer2, offsetsRef.current.layer2); // Medium stars
    drawLayer(starLayers.layer1, offsetsRef.current.layer1); // Closest stars
    
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
