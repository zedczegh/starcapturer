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
    spin?: number;
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

  // Create star layers by detecting complete stars first, then assigning whole stars to layers
  useEffect(() => {
    if (!starsOnlyImage) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      console.log('Detecting complete stars with cores and spikes...');
      
      // Draw image to canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);
      
      const sourceData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = sourceData.data;
      
      // Detect complete star regions (core + glow + spikes together)
      const visited = new Uint8Array(img.width * img.height);
      const starRegions: {
        pixels: Set<number>;
        maxLuminance: number;
        centerX: number;
        centerY: number;
        size: number;
      }[] = [];
      
      const threshold = 30; // Low threshold to capture full stars including faint spikes
      
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const idx = y * img.width + x;
          if (visited[idx]) continue;
          
          const pixelIdx = idx * 4;
          const luminance = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
          
          if (luminance > threshold) {
            // Found a star pixel - grow the complete star region
            const starPixels = new Set<number>();
            const queue: {x: number, y: number}[] = [{x, y}];
            visited[idx] = 1;
            
            let maxLum = luminance;
            let totalX = 0, totalY = 0, totalWeight = 0;
            let minX = x, maxX = x, minY = y, maxY = y;
            
            while (queue.length > 0 && starPixels.size < 5000) {
              const curr = queue.shift()!;
              const currIdx = curr.y * img.width + curr.x;
              starPixels.add(currIdx);
              
              const currPixelIdx = currIdx * 4;
              const currLum = 0.299 * data[currPixelIdx] + 0.587 * data[currPixelIdx + 1] + 0.114 * data[currPixelIdx + 2];
              
              if (currLum > maxLum) maxLum = currLum;
              
              // Weighted centroid
              const weight = currLum * currLum;
              totalX += curr.x * weight;
              totalY += curr.y * weight;
              totalWeight += weight;
              
              minX = Math.min(minX, curr.x);
              maxX = Math.max(maxX, curr.x);
              minY = Math.min(minY, curr.y);
              maxY = Math.max(maxY, curr.y);
              
              // Check 8-connected neighbors
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  
                  const nx = curr.x + dx;
                  const ny = curr.y + dy;
                  
                  if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
                    const nIdx = ny * img.width + nx;
                    if (!visited[nIdx]) {
                      const nPixelIdx = nIdx * 4;
                      const nLum = 0.299 * data[nPixelIdx] + 0.587 * data[nPixelIdx + 1] + 0.114 * data[nPixelIdx + 2];
                      
                      // Very low threshold to capture faint spikes
                      if (nLum > threshold * 0.5) {
                        visited[nIdx] = 1;
                        queue.push({x: nx, y: ny});
                      }
                    }
                  }
                }
              }
            }
            
            // Only keep significant star regions
            if (starPixels.size >= 5 && starPixels.size <= 5000) {
              const centerX = totalX / totalWeight;
              const centerY = totalY / totalWeight;
              const size = Math.max(maxX - minX, maxY - minY);
              
              starRegions.push({
                pixels: starPixels,
                maxLuminance: maxLum,
                centerX,
                centerY,
                size
              });
            }
          }
        }
      }
      
      console.log(`Detected ${starRegions.length} complete stars`);
      
      // Sort stars by size to determine layer distribution
      const sortedBySize = [...starRegions].sort((a, b) => b.size - a.size);
      const largeThreshold = sortedBySize[Math.floor(starRegions.length * 0.33)]?.size || 15;
      const mediumThreshold = sortedBySize[Math.floor(starRegions.length * 0.67)]?.size || 7;
      
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
      
      // Create image data for each layer
      const largeData = largeCtx.createImageData(img.width, img.height);
      const mediumData = mediumCtx.createImageData(img.width, img.height);
      const smallData = smallCtx.createImageData(img.width, img.height);
      
      let largeCount = 0, mediumCount = 0, smallCount = 0;
      
      // Assign each complete star to one layer based on its size
      for (const star of starRegions) {
        let targetData: ImageData;
        if (star.size >= largeThreshold) {
          targetData = largeData;
          largeCount++;
        } else if (star.size >= mediumThreshold) {
          targetData = mediumData;
          mediumCount++;
        } else {
          targetData = smallData;
          smallCount++;
        }
        
        // Copy all pixels of this complete star to the target layer
        for (const pixelIdx of star.pixels) {
          const dataIdx = pixelIdx * 4;
          targetData.data[dataIdx] = data[dataIdx];
          targetData.data[dataIdx + 1] = data[dataIdx + 1];
          targetData.data[dataIdx + 2] = data[dataIdx + 2];
          targetData.data[dataIdx + 3] = data[dataIdx + 3];
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
      
      console.log(`Star layers created: ${largeCount} large, ${mediumCount} medium, ${smallCount} small stars`);
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
    const { motionType = 'zoom_in', speed = 1, duration = 10, spin = 0 } = settings;
    
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
    
    // Calculate rotation angle based on progress and spin setting
    const currentRotation = (spin * progressRatio * Math.PI) / 180; // Convert to radians
    
    // Calculate scale needed to fill frame when rotated
    // At 45 degrees, we need sqrt(2) ≈ 1.414x scale to avoid corners
    const rotationScale = spin > 0 ? 1 + (Math.abs(Math.sin(currentRotation)) * 0.414) : 1;
    
    // Save context and apply rotation at center
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(currentRotation);
    ctx.scale(rotationScale, rotationScale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Amplification factor from settings (100-300%)
    const ampFactor = (settings.amplification || 150) / 100;
    
    if (motionType === 'zoom_in') {
      // Dramatic 3D depth: large stars zoom MUCH faster than small stars
      offsetsRef.current.background.scale = 1.0 + (progressRatio * 0.3 * ampFactor);  // Background barely moves
      offsetsRef.current.layer3.scale = 1.0 + (progressRatio * 0.5 * ampFactor);      // Small stars (far) - slow
      offsetsRef.current.layer2.scale = 1.0 + (progressRatio * 1.0 * ampFactor);      // Medium stars - moderate
      offsetsRef.current.layer1.scale = 1.0 + (progressRatio * 2.0 * ampFactor);      // Large stars (close) - FAST
    } else if (motionType === 'zoom_out') {
      // Dramatic zoom out with depth
      const bgMax = 1.0 + (0.3 * ampFactor);
      const smallMax = 1.0 + (0.5 * ampFactor);
      const medMax = 1.0 + (1.0 * ampFactor);
      const largeMax = 1.0 + (2.0 * ampFactor);
      
      offsetsRef.current.background.scale = bgMax - (progressRatio * 0.3 * ampFactor);
      offsetsRef.current.layer3.scale = smallMax - (progressRatio * 0.5 * ampFactor);
      offsetsRef.current.layer2.scale = medMax - (progressRatio * 1.0 * ampFactor);
      offsetsRef.current.layer1.scale = largeMax - (progressRatio * 2.0 * ampFactor);
    } else if (motionType === 'pan_left') {
      // Dramatic pan with strong 3D parallax: large stars pan MUCH faster
      const panAmount = progressRatio * speed * 250 * ampFactor;
      offsetsRef.current.background.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer3.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer2.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer1.scale = 1.0 + (0.2 * ampFactor);
      
      offsetsRef.current.background.x = -panAmount * 0.3;   // Background slowest
      offsetsRef.current.layer3.x = -panAmount * 0.5;       // Small stars - slow
      offsetsRef.current.layer2.x = -panAmount * 1.0;       // Medium stars - moderate
      offsetsRef.current.layer1.x = -panAmount * 2.0;       // Large stars - FAST
    } else if (motionType === 'pan_right') {
      // Dramatic pan right with strong 3D parallax
      const panAmount = progressRatio * speed * 250 * ampFactor;
      offsetsRef.current.background.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer3.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer2.scale = 1.0 + (0.2 * ampFactor);
      offsetsRef.current.layer1.scale = 1.0 + (0.2 * ampFactor);
      
      offsetsRef.current.background.x = panAmount * 0.3;
      offsetsRef.current.layer3.x = panAmount * 0.5;
      offsetsRef.current.layer2.x = panAmount * 1.0;
      offsetsRef.current.layer1.x = panAmount * 2.0;
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
    
    // Restore rotation transform
    ctx.restore();
    
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
