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

  // Load stars as a single layer - no duplication
  useEffect(() => {
    if (!starsOnlyImage) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      // Single layer - dramatic 3D comes from animation scaling
      setStarLayers({
        layer1: canvas,
        layer2: null,
        layer3: null
      });
      
      console.log('Single star layer loaded with dramatic 3D scaling');
    };
    
    img.src = starsOnlyImage;
  }, [starsOnlyImage]);

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
    
    if (motionType === 'zoom_in') {
      // Dramatic zoom - close stars grow MUCH faster than far stars
      offsetsRef.current.background.scale = 1.0 + (progressRatio * 0.2);  // Background barely moves
      offsetsRef.current.layer3.scale = 1.0 + (progressRatio * 0.5);      // Far stars - slow
      offsetsRef.current.layer2.scale = 1.0 + (progressRatio * 1.2);      // Middle stars - medium
      offsetsRef.current.layer1.scale = 1.0 + (progressRatio * 2.5);      // Close stars - FAST dramatic zoom
    } else if (motionType === 'zoom_out') {
      // Dramatic zoom out - reverse effect
      offsetsRef.current.background.scale = 1.2 - (progressRatio * 0.2);
      offsetsRef.current.layer3.scale = 1.5 - (progressRatio * 0.5);
      offsetsRef.current.layer2.scale = 2.2 - (progressRatio * 1.2);
      offsetsRef.current.layer1.scale = 3.5 - (progressRatio * 2.5);
    } else if (motionType === 'pan_left') {
      // Dramatic pan with strong parallax
      const panAmount = progressRatio * speed * 250;
      offsetsRef.current.background.scale = 1.3; // Zoomed to avoid gaps
      offsetsRef.current.layer3.scale = 1.4;
      offsetsRef.current.layer2.scale = 1.5;
      offsetsRef.current.layer1.scale = 1.8;
      offsetsRef.current.background.x = -panAmount * 0.2;  // Background moves slowly
      offsetsRef.current.layer3.x = -panAmount * 0.6;      // Far stars
      offsetsRef.current.layer2.x = -panAmount * 1.3;      // Middle stars
      offsetsRef.current.layer1.x = -panAmount * 2.5;      // Close stars move FAST
    } else if (motionType === 'pan_right') {
      // Dramatic pan right with strong parallax
      const panAmount = progressRatio * speed * 250;
      offsetsRef.current.background.scale = 1.3;
      offsetsRef.current.layer3.scale = 1.4;
      offsetsRef.current.layer2.scale = 1.5;
      offsetsRef.current.layer1.scale = 1.8;
      offsetsRef.current.background.x = panAmount * 0.2;
      offsetsRef.current.layer3.x = panAmount * 0.6;
      offsetsRef.current.layer2.x = panAmount * 1.3;
      offsetsRef.current.layer1.x = panAmount * 2.5;
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
    
    // Draw single star layer with dramatic 3D scaling
    if (starLayers.layer1) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 1.0;
      
      const scale = offsetsRef.current.layer1.scale;
      const scaledWidth = starLayers.layer1.width * scale;
      const scaledHeight = starLayers.layer1.height * scale;
      const drawX = (canvas.width - scaledWidth) / 2 + offsetsRef.current.layer1.x;
      const drawY = (canvas.height - scaledHeight) / 2 + offsetsRef.current.layer1.y;
      
      ctx.drawImage(starLayers.layer1, drawX, drawY, scaledWidth, scaledHeight);
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
        
        if (starLayers.layer1) {
          ctx.globalCompositeOperation = 'screen';
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
