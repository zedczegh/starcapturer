import React, { useRef, useEffect, useCallback, useState } from 'react';

interface StereoscopicRendererProps {
  starsOnlyImage: string | null;
  starlessImage: string | null;
  isAnimating: boolean;
  onProgressUpdate?: (progress: number) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  animationDuration: number;
  stereoParams: {
    horizontalDisplace: number;
    starShiftAmount: number;
    luminanceBlur: number;
    contrastBoost: number;
    stereoSpacing: number;
  };
}

const StereoscopicRenderer: React.FC<StereoscopicRendererProps> = ({
  starsOnlyImage,
  starlessImage,
  isAnimating,
  onProgressUpdate,
  onCanvasReady,
  animationDuration,
  stereoParams
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  
  const [starsImg, setStarsImg] = useState<HTMLImageElement | null>(null);
  const [starlessImg, setStarlessImg] = useState<HTMLImageElement | null>(null);
  const [depthMap, setDepthMap] = useState<HTMLCanvasElement | null>(null);
  const [leftView, setLeftView] = useState<HTMLCanvasElement | null>(null);
  const [rightView, setRightView] = useState<HTMLCanvasElement | null>(null);

  // Load images
  useEffect(() => {
    console.log('🎬 [StereoRenderer] Loading images for stereoscopic rendering');
    
    if (!starsOnlyImage || !starlessImage) return;

    const loadImages = async () => {
      const starsImgEl = new Image();
      const starlessImgEl = new Image();

      await Promise.all([
        new Promise<void>((resolve) => {
          starsImgEl.onload = () => resolve();
          starsImgEl.src = starsOnlyImage;
        }),
        new Promise<void>((resolve) => {
          starlessImgEl.onload = () => resolve();
          starlessImgEl.src = starlessImage;
        })
      ]);

      console.log('✅ [StereoRenderer] Images loaded:', {
        starsSize: `${starsImgEl.width}x${starsImgEl.height}`,
        starlessSize: `${starlessImgEl.width}x${starlessImgEl.height}`
      });

      setStarsImg(starsImgEl);
      setStarlessImg(starlessImgEl);
    };

    loadImages();
  }, [starsOnlyImage, starlessImage]);

  // Generate depth map and stereo views
  useEffect(() => {
    if (!starlessImg || !starsImg) return;

    console.log('🗺️ [StereoRenderer] Generating depth map and stereo views');

    const width = starlessImg.width;
    const height = starlessImg.height;

    // Create depth map from starless image
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = width;
    depthCanvas.height = height;
    const depthCtx = depthCanvas.getContext('2d')!;
    
    depthCtx.drawImage(starlessImg, 0, 0);
    const imageData = depthCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Convert to grayscale depth map with blue bias for nebula
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.2 * data[i] + 0.5 * data[i + 1] + 0.8 * data[i + 2];
      const enhancedLum = Math.pow(luminance / 255, 0.8) * 255;
      data[i] = data[i + 1] = data[i + 2] = enhancedLum;
    }
    
    depthCtx.putImageData(imageData, 0, 0);
    
    // Apply blur to depth map
    if (stereoParams.luminanceBlur > 0) {
      depthCtx.filter = `blur(${stereoParams.luminanceBlur}px)`;
      depthCtx.drawImage(depthCanvas, 0, 0);
      depthCtx.filter = 'none';
    }

    setDepthMap(depthCanvas);

    // Generate LEFT view (reference)
    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = width;
    leftCanvas.height = height;
    const leftCtx = leftCanvas.getContext('2d')!;
    
    // Draw starless background
    leftCtx.drawImage(starlessImg, 0, 0);
    // Add stars on top
    leftCtx.globalCompositeOperation = 'screen';
    leftCtx.drawImage(starsImg, 0, 0);
    leftCtx.globalCompositeOperation = 'source-over';

    setLeftView(leftCanvas);

    // Generate RIGHT view with displacement
    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = width;
    rightCanvas.height = height;
    const rightCtx = rightCanvas.getContext('2d')!;

    // Apply depth-based displacement to starless background
    const depthData = depthCtx.getImageData(0, 0, width, height);
    leftCtx.clearRect(0, 0, width, height);
    leftCtx.drawImage(starlessImg, 0, 0);
    const starlessData = leftCtx.getImageData(0, 0, width, height);
    
    const displacedData = rightCtx.createImageData(width, height);
    
    // Initialize with black
    for (let i = 0; i < displacedData.data.length; i += 4) {
      displacedData.data[i] = 0;
      displacedData.data[i + 1] = 0;
      displacedData.data[i + 2] = 0;
      displacedData.data[i + 3] = 255;
    }

    // Apply horizontal displacement based on depth
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const depth = depthData.data[idx] / 255;
        const displacement = Math.round((depth - 0.5) * stereoParams.horizontalDisplace);
        
        const srcX = x - displacement;
        
        if (srcX >= 0 && srcX < width) {
          const srcIdx = (y * width + srcX) * 4;
          displacedData.data[idx] = starlessData.data[srcIdx];
          displacedData.data[idx + 1] = starlessData.data[srcIdx + 1];
          displacedData.data[idx + 2] = starlessData.data[srcIdx + 2];
          displacedData.data[idx + 3] = 255;
        }
      }
    }

    rightCtx.putImageData(displacedData, 0, 0);

    // Add stars with forward shift to right view
    rightCtx.globalCompositeOperation = 'screen';
    
    // Shift bright stars forward
    if (stereoParams.starShiftAmount > 0) {
      rightCtx.save();
      rightCtx.translate(stereoParams.starShiftAmount, 0);
      rightCtx.drawImage(starsImg, 0, 0);
      rightCtx.restore();
    } else {
      rightCtx.drawImage(starsImg, 0, 0);
    }
    
    rightCtx.globalCompositeOperation = 'source-over';

    // Apply contrast boost to both views
    if (stereoParams.contrastBoost !== 1.0) {
      [leftCtx, rightCtx].forEach(ctx => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] * stereoParams.contrastBoost);
          d[i + 1] = Math.min(255, d[i + 1] * stereoParams.contrastBoost);
          d[i + 2] = Math.min(255, d[i + 2] * stereoParams.contrastBoost);
        }
        ctx.putImageData(imgData, 0, 0);
      });
    }

    setRightView(rightCanvas);

    console.log('✅ [StereoRenderer] Stereo views generated successfully');
  }, [starlessImg, starsImg, stereoParams]);

  // Render stereo pair to main canvas
  const renderStereoFrame = useCallback((progress: number) => {
    if (!canvasRef.current || !leftView || !rightView) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const width = leftView.width;
    const height = leftView.height;
    const spacing = stereoParams.stereoSpacing;

    // Set canvas size for stereo pair
    canvas.width = width * 2 + spacing;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom animation based on progress
    const zoomFactor = 1 + (progress / 100) * 0.3; // 1.0 to 1.3x zoom
    const scaledWidth = width * zoomFactor;
    const scaledHeight = height * zoomFactor;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // Draw left view with zoom
    ctx.save();
    ctx.translate(0, 0);
    ctx.drawImage(leftView, offsetX, offsetY, scaledWidth, scaledHeight, 0, 0, width, height);
    ctx.restore();

    // Draw right view with zoom
    ctx.save();
    ctx.translate(width + spacing, 0);
    ctx.drawImage(rightView, offsetX, offsetY, scaledWidth, scaledHeight, 0, 0, width, height);
    ctx.restore();

  }, [leftView, rightView, stereoParams.stereoSpacing]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const progress = Math.min((elapsed / animationDuration) * 100, 100);
    currentProgressRef.current = progress;

    renderStereoFrame(progress);

    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }

    if (progress < 100) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      console.log('🏁 [StereoRenderer] Animation complete');
    }
  }, [isAnimating, animationDuration, renderStereoFrame, onProgressUpdate]);

  // Handle animation state changes
  useEffect(() => {
    if (isAnimating) {
      if (currentProgressRef.current >= 99.9) {
        startTimeRef.current = 0;
        currentProgressRef.current = 0;
      } else if (currentProgressRef.current > 0) {
        // Resume from current position
        const elapsedMs = (currentProgressRef.current / 100) * animationDuration * 1000;
        startTimeRef.current = Date.now() - elapsedMs;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Render current frame when paused
      if (leftView && rightView) {
        renderStereoFrame(currentProgressRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, animate, animationDuration, leftView, rightView, renderStereoFrame]);

  // Notify parent when canvas is ready and render initial frame
  useEffect(() => {
    if (canvasRef.current && leftView && rightView && onCanvasReady) {
      console.log('✅ [StereoRenderer] Canvas ready, rendering initial frame');
      renderStereoFrame(0);
      onCanvasReady(canvasRef.current);
    }
  }, [leftView, rightView, onCanvasReady, renderStereoFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain"
      style={{ maxHeight: '100%' }}
    />
  );
};

export default StereoscopicRenderer;
