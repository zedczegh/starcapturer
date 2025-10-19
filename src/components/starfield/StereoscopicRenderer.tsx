import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TraditionalMorphProcessor } from '@/lib/traditionalMorphMode';

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
  const [leftView, setLeftView] = useState<HTMLCanvasElement | null>(null);
  const [rightView, setRightView] = useState<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const processorRef = useRef<TraditionalMorphProcessor | null>(null);

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

  // Initialize processor
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = new TraditionalMorphProcessor();
      console.log('🔧 [StereoRenderer] TraditionalMorphProcessor initialized');
    }
    
    return () => {
      if (processorRef.current) {
        processorRef.current.dispose();
        processorRef.current = null;
      }
    };
  }, []);

  // Generate stereo views using TraditionalMorphProcessor
  useEffect(() => {
    if (!starlessImg || !starsImg || !processorRef.current || isGenerating) return;

    const generateStereoViews = async () => {
      setIsGenerating(true);
      console.log('🗺️ [StereoRenderer] Generating stereo pair using TraditionalMorphProcessor');

      try {
        const processor = processorRef.current!;
        
        // Convert images to files for processor
        const starlessCanvas = document.createElement('canvas');
        starlessCanvas.width = starlessImg.width;
        starlessCanvas.height = starlessImg.height;
        const starlessCtx = starlessCanvas.getContext('2d')!;
        starlessCtx.drawImage(starlessImg, 0, 0);
        
        const starsCanvas = document.createElement('canvas');
        starsCanvas.width = starsImg.width;
        starsCanvas.height = starsImg.height;
        const starsCtx = starsCanvas.getContext('2d')!;
        starsCtx.drawImage(starsImg, 0, 0);
        
        // Convert canvas to blob then to file
        const starlessBlob = await new Promise<Blob>((resolve) => 
          starlessCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        );
        const starsBlob = await new Promise<Blob>((resolve) => 
          starsCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        );
        
        const starlessFile = new File([starlessBlob], 'starless.png', { type: 'image/png' });
        const starsFile = new File([starsBlob], 'stars.png', { type: 'image/png' });
        
        console.log('📊 [StereoRenderer] Processing with params:', stereoParams);
        
        // Generate stereo pair using traditional morph mode
        const result = await processor.createTraditionalStereoPair(
          {
            starlessImage: starlessFile,
            starsOnlyImage: starsFile
          },
          {
            horizontalDisplace: stereoParams.horizontalDisplace,
            starShiftAmount: stereoParams.starShiftAmount,
            luminanceBlur: stereoParams.luminanceBlur,
            contrastBoost: stereoParams.contrastBoost
          },
          (step, progress) => {
            console.log(`[StereoRenderer] ${step} - ${progress?.toFixed(0)}%`);
          }
        );
        
        // Store the left and right views (without combining into stereo pair yet)
        setLeftView(result.leftCanvas);
        setRightView(result.rightCanvas);
        
        console.log('✅ [StereoRenderer] Stereo views generated successfully:', {
          leftSize: `${result.leftCanvas.width}x${result.leftCanvas.height}`,
          rightSize: `${result.rightCanvas.width}x${result.rightCanvas.height}`
        });
        
      } catch (error) {
        console.error('❌ [StereoRenderer] Failed to generate stereo views:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateStereoViews();
  }, [starlessImg, starsImg, stereoParams]);

  // Render stereo pair to main canvas with motion settings applied
  const renderStereoFrame = useCallback((progress: number) => {
    if (!canvasRef.current || !leftView || !rightView) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const width = leftView.width;
    const height = leftView.height;
    const spacing = stereoParams.stereoSpacing;

    // Set canvas size for stereo pair side-by-side
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

    // Function to draw a view with transformations at original size
    const drawView = (view: HTMLCanvasElement, targetX: number) => {
      ctx.save();
      
      // Translate to target position
      ctx.translate(targetX + width / 2, height / 2);
      
      // Apply rotation
      if (rotation !== 0) {
        ctx.rotate(rotation);
      }
      
      // Apply scale
      ctx.scale(scaleFactor, scaleFactor);
      
      // Apply pan offset (scaled appropriately)
      ctx.translate(panX / scaleFactor, panY / scaleFactor);
      
      // Draw image centered at original size
      ctx.drawImage(view, -width / 2, -height / 2, width, height);
      
      ctx.restore();
    };

    // Draw left view with motion
    drawView(leftView, 0);

    // Draw right view with motion  
    drawView(rightView, width + spacing);

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
