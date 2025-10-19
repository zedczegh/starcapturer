import React, { useRef, useEffect, useCallback, useState } from 'react';

interface StereoscopicRendererProps {
  starsOnlyImage: string | null;
  starlessImage: string | null;
  isAnimating: boolean;
  onProgressUpdate?: (progress: number) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  animationDuration: number;
  animationSettings: {
    motionType: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right';
    speed: number;
    amplification: number;
    spin: number;
    spinDirection: 'clockwise' | 'counterclockwise';
  };
  stereoParams: {
    horizontalDisplace: number;
    starShiftAmount: number;
    luminanceBlur: number;
    contrastBoost: number;
    stereoSpacing: number;
  };
  externalProgress?: number; // For video recording - forces render at specific progress
}

const StereoscopicRenderer: React.FC<StereoscopicRendererProps> = ({
  starsOnlyImage,
  starlessImage,
  isAnimating,
  onProgressUpdate,
  onCanvasReady,
  animationDuration,
  animationSettings,
  stereoParams,
  externalProgress
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

    console.log('🗺️ [StereoRenderer] Generating depth map and stereo views with current settings');

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

  // Render stereo pair to main canvas with motion settings applied
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

    const { motionType, amplification, spin, spinDirection } = animationSettings;
    
    // Calculate motion parameters based on progress
    const normalizedProgress = progress / 100;
    
    // Amplification affects the scale and movement range
    const amplificationFactor = amplification / 100;
    
    // Calculate scale based on motion type and amplification
    let scaleFactor = 1.0;
    let panX = 0;
    let panY = 0;
    let rotation = 0;
    
    if (motionType === 'zoom_in') {
      // Zoom in: scale from 1.0 to (1.0 + amplificationFactor)
      scaleFactor = 1.0 + (normalizedProgress * amplificationFactor);
    } else if (motionType === 'zoom_out') {
      // Zoom out: scale from (1.0 + amplificationFactor) to 1.0
      scaleFactor = (1.0 + amplificationFactor) - (normalizedProgress * amplificationFactor);
    } else if (motionType === 'pan_left') {
      // Pan left: move from right to left
      const maxPan = width * amplificationFactor * 0.5;
      panX = maxPan - (normalizedProgress * maxPan * 2);
    } else if (motionType === 'pan_right') {
      // Pan right: move from left to right
      const maxPan = width * amplificationFactor * 0.5;
      panX = -maxPan + (normalizedProgress * maxPan * 2);
    }
    
    // Apply spin rotation
    if (spin > 0) {
      const spinRadians = (spin * Math.PI) / 180;
      rotation = spinDirection === 'clockwise' 
        ? normalizedProgress * spinRadians 
        : -normalizedProgress * spinRadians;
    }

    // Function to draw a view with transformations
    const drawView = (view: HTMLCanvasElement, targetX: number) => {
      ctx.save();
      
      // Translate to target position
      ctx.translate(targetX, 0);
      
      // Move to center for transformations
      ctx.translate(width / 2, height / 2);
      
      // Apply rotation
      if (rotation !== 0) {
        ctx.rotate(rotation);
      }
      
      // Apply scale
      ctx.scale(scaleFactor, scaleFactor);
      
      // Apply pan offset
      ctx.translate(panX / scaleFactor, panY / scaleFactor);
      
      // Draw image centered
      ctx.drawImage(view, -width / 2, -height / 2, width, height);
      
      ctx.restore();
    };

    // Draw left view with motion
    drawView(leftView, 0);

    // Draw right view with motion
    drawView(rightView, width + spacing);

    console.log(`🎬 [StereoRenderer] Frame rendered - Progress: ${progress.toFixed(1)}%, Scale: ${scaleFactor.toFixed(2)}, Pan: (${panX.toFixed(0)}, ${panY.toFixed(0)}), Rotation: ${(rotation * 180 / Math.PI).toFixed(1)}°`);

  }, [leftView, rightView, stereoParams.stereoSpacing, animationSettings]);

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

  // Handle animation state changes and render current frame
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
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, animate, animationDuration]);

  // Always render current frame when views or settings change
  useEffect(() => {
    if (leftView && rightView) {
      renderStereoFrame(currentProgressRef.current);
    }
  }, [leftView, rightView, animationSettings, renderStereoFrame]);

  // Handle external progress updates (for video recording)
  useEffect(() => {
    if (externalProgress !== undefined && leftView && rightView) {
      console.log(`📹 [StereoRenderer] External progress update: ${externalProgress.toFixed(1)}%`);
      currentProgressRef.current = externalProgress;
      renderStereoFrame(externalProgress);
    }
  }, [externalProgress, leftView, rightView, renderStereoFrame]);

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
