import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, Sparkles, Eye, Settings2, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VideoGenerationService, MotionSettings } from '@/services/VideoGenerationService';
import { validateImageFile } from '@/utils/imageProcessingUtils';
import { generateSimpleDepthMap, detectStars, type SimpleDepthParams } from '@/lib/simpleDepthMap';
import StarField3D from '@/components/starfield/StarField3D';
import { toast } from 'sonner';
import { CanvasPool } from '@/lib/performance/CanvasPool';
import { UploadProgress } from '@/components/ui/upload-progress';
import { Separator } from '@/components/ui/separator';
import VideoPlayerControls from '@/components/video/VideoPlayerControls';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
}

const ParallelVideoGenerator: React.FC = () => {
  const { language } = useLanguage();

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    starless: { show: false, progress: 0, fileName: '' },
    stars: { show: false, progress: 0, fileName: '' }
  });

  // File inputs
  const [starlessFile, setStarlessFile] = useState<File | null>(null);
  const [starsFile, setStarsFile] = useState<File | null>(null);
  const [starlessElement, setStarlessElement] = useState<HTMLImageElement | null>(null);
  const [starsElement, setStarsElement] = useState<HTMLImageElement | null>(null);
  const starlessInputRef = useRef<HTMLInputElement>(null);
  const starsInputRef = useRef<HTMLInputElement>(null);

  // Morphed images - separated into backgrounds and stars
  const [leftBackground, setLeftBackground] = useState<string | null>(null);
  const [rightBackground, setRightBackground] = useState<string | null>(null);
  const [leftStarsOnly, setLeftStarsOnly] = useState<string | null>(null);
  const [rightStarsOnly, setRightStarsOnly] = useState<string | null>(null);
  
  // Debug: Show intermediate composites
  const [leftComposite, setLeftComposite] = useState<string | null>(null);
  const [rightComposite, setRightComposite] = useState<string | null>(null);

  // Detected stars for 3D rendering
  const [leftStars, setLeftStars] = useState<StarData[]>([]);
  const [rightStars, setRightStars] = useState<StarData[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ stage: '', percent: 0 });
  const [isReady, setIsReady] = useState(false);
  const [canvasInitProgress, setCanvasInitProgress] = useState(0);

  // Canvas refs for video generation
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stitchedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Two depth maps: starless and stars
  const [starlessDepthMapUrl, setStarlessDepthMapUrl] = useState<string | null>(null);
  const [starsDepthMapUrl, setStarsDepthMapUrl] = useState<string | null>(null);
  
  // Store canvases for download
  const [processedCanvases, setProcessedCanvases] = useState<{
    leftBackground?: HTMLCanvasElement;
    leftStars?: HTMLCanvasElement;
    rightBackground?: HTMLCanvasElement;
    rightStars?: HTMLCanvasElement;
    starlessDepthMap?: HTMLCanvasElement;
    starsDepthMap?: HTMLCanvasElement;
  }>({});

  // Processing Parameters - matching stereoscope processor exactly
  const [stereoSpacing, setStereoSpacing] = useState<number>(600);
  const [borderSize, setBorderSize] = useState<number>(300);
  
  // Internal processing parameters (not exposed in UI)
  const horizontalDisplace = 25; // Fixed depth displacement
  const starShiftAmount = 6; // Fixed star shift amount

  // 3D Star Field Motion Settings - complete settings
  const [motionSettings, setMotionSettings] = useState<MotionSettings>({
    motionType: 'zoom_in',
    speed: 1.5,
    duration: 10,
    fieldOfView: 75,
    amplification: 150,
    spin: 0,
    spinDirection: 'clockwise'
  });

  const [depthIntensity, setDepthIntensity] = useState<number>(100);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Video generation control refs
  const videoProgressRef = useRef<number>(0);
  const [frameRenderTrigger, setFrameRenderTrigger] = useState(0);

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  // Download canvas as high-quality PNG (browsers don't support TIFF saving natively)
  const downloadCanvasAsPNG = useCallback((canvas: HTMLCanvasElement, filename: string) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t(`Downloaded ${filename}`, `已下载 ${filename}`));
      }
    }, 'image/png', 1.0); // Maximum quality PNG
  }, [t]);

  // Download processed image handler
  const handleDownloadProcessedImage = useCallback((type: string) => {
    const canvas = processedCanvases[type as keyof typeof processedCanvases];
    if (!canvas) {
      toast.error(t('Image not available', '图片不可用'));
      return;
    }
    
    const timestamp = Date.now();
    downloadCanvasAsPNG(canvas, `${type}_${timestamp}.png`);
  }, [processedCanvases, downloadCanvasAsPNG, t]);

  // Progress tracking handler
  const handleProgressUpdate = useCallback((progress: number) => {
    setAnimationProgress(progress);
    if (progress >= 100) {
      console.log('🎬 [Generator] Animation reached 100%');
      setIsAnimating(false);
    }
  }, []);

  // Replay handler
  const handleReplay = useCallback(() => {
    setIsAnimating(false);
    setAnimationProgress(0);
    setTimeout(() => {
      setIsAnimating(true);
    }, 100);
  }, []);

  // Function to stitch left and right canvases together with optimized rendering
  const stitchCanvases = useCallback(() => {
    if (!leftCanvasRef.current || !rightCanvasRef.current) return;
    
    // Find or ensure stitched canvas ref is set
    if (!stitchedCanvasRef.current) {
      const stitchedCanvasElement = document.querySelector('canvas[style*="pixelated"]') as HTMLCanvasElement;
      if (stitchedCanvasElement) {
        stitchedCanvasRef.current = stitchedCanvasElement;
      } else {
        return; // Canvas not ready yet
      }
    }

    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    const stitchedCanvas = stitchedCanvasRef.current;

    // Calculate dimensions
    const viewWidth = leftCanvas.width;
    const viewHeight = leftCanvas.height;
    const totalWidth = viewWidth * 2 + stereoSpacing + borderSize * 2;
    const totalHeight = viewHeight + borderSize * 2;

    // Set stitched canvas size
    if (stitchedCanvas.width !== totalWidth || stitchedCanvas.height !== totalHeight) {
      stitchedCanvas.width = totalWidth;
      stitchedCanvas.height = totalHeight;
    }

    const ctx = stitchedCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true, // Better performance
      willReadFrequently: false
    });
    if (!ctx) return;

    // High-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Draw left view
    ctx.drawImage(
      leftCanvas,
      borderSize,
      borderSize,
      viewWidth,
      viewHeight
    );

    // Draw right view
    ctx.drawImage(
      rightCanvas,
      borderSize + viewWidth + stereoSpacing,
      borderSize,
      viewWidth,
      viewHeight
    );
  }, [stereoSpacing, borderSize]);

  // Ensure stitched canvas is rendered and perform initial stitch
  useEffect(() => {
    if (isReady && leftCanvasRef.current && rightCanvasRef.current) {
      setCanvasInitProgress(0);
      
      // Simulate progress during initialization
      const progressInterval = setInterval(() => {
        setCanvasInitProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      // Perform initial stitch immediately
      const performStitch = () => {
        if (leftCanvasRef.current && rightCanvasRef.current) {
          console.log('✅ Performing initial canvas stitch');
          // Give the DOM a moment to fully render the canvas element
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              stitchCanvases();
              setCanvasInitProgress(100);
              clearInterval(progressInterval);
            });
          });
        }
      };
      
      performStitch();
      
      return () => clearInterval(progressInterval);
    }
  }, [isReady, stitchCanvases]);

  // Stitch canvases together during normal animation
  useEffect(() => {
    if (!isAnimating || isGenerating) return;

    const interval = setInterval(() => {
      stitchCanvases();
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [isAnimating, isGenerating, stitchCanvases]);

  // Unified image upload handler from StarFieldGenerator
  const handleImageUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File) => void,
    setElement: (el: HTMLImageElement) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    uploadType: 'stars' | 'starless'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || t('Invalid file format', '无效的文件格式'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      // Show upload progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { show: true, progress: 0, fileName: file.name }
      }));

      // Simulate progress (since loadImageFromFile is quick)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadType]: { 
            ...prev[uploadType], 
            progress: Math.min(prev[uploadType].progress + 20, 90) 
          }
        }));
      }, 100);

      const { loadImageFromFile } = await import('@/utils/imageProcessingUtils');
      const { dataUrl, element } = await loadImageFromFile(file, {
        enableDownscale: false, // No downscaling for parallel video
        maxResolution: 4096 * 4096
      });
      
      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { ...prev[uploadType], progress: 100 }
      }));

      setFile(file);
      setElement(element);

      // Hide progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadType]: { show: false, progress: 0, fileName: '' }
        }));
      }, 1000);
    } catch (error) {
      console.error('Image load error:', error);
      toast.error(t('Failed to load image', '加载图片失败'));
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { show: false, progress: 0, fileName: '' }
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [t]);

  const handleStarlessUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    return handleImageUpload(event, setStarlessFile, setStarlessElement, starlessInputRef, 'starless');
  }, [handleImageUpload]);

  const handleStarsUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    return handleImageUpload(event, setStarsFile, setStarsElement, starsInputRef, 'stars');
  }, [handleImageUpload]);

  // Helper to load image from file (handles TIFF)
  const loadImageFromFileElement = useCallback(async (element: HTMLImageElement): Promise<HTMLImageElement> => {
    return element; // Already loaded by handleImageUpload
  }, []);

  // Extract stars from composite image
  const extractStarsFromComposite = useCallback((
    compositeCanvas: HTMLCanvasElement,
    starlessImage: HTMLImageElement,
    depthMap: HTMLCanvasElement
  ): { starsOnly: HTMLCanvasElement; stars: StarData[] } => {
    const canvasPool = CanvasPool.getInstance();
    const starsCanvas = canvasPool.acquire(compositeCanvas.width, compositeCanvas.height);
    const ctx = starsCanvas.getContext('2d')!;

    // Get composite data
    const compositeCtx = compositeCanvas.getContext('2d')!;
    const compositeData = compositeCtx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height);

    // Draw starless to temp canvas
    const tempCanvas = canvasPool.acquire(starlessImage.width, starlessImage.height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(starlessImage, 0, 0);
    const starlessData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // Subtract starless from composite to get stars only
    const starsData = ctx.createImageData(compositeCanvas.width, compositeCanvas.height);
    for (let i = 0; i < compositeData.data.length; i += 4) {
      starsData.data[i] = Math.max(0, compositeData.data[i] - starlessData.data[i]);
      starsData.data[i + 1] = Math.max(0, compositeData.data[i + 1] - starlessData.data[i + 1]);
      starsData.data[i + 2] = Math.max(0, compositeData.data[i + 2] - starlessData.data[i + 2]);
      starsData.data[i + 3] = 255;
    }

    ctx.putImageData(starsData, 0, 0);

    // Detect star positions
    const stars: StarData[] = [];
    const threshold = 50;
    const visited = new Uint8Array(compositeCanvas.width * compositeCanvas.height);
    const depthCtx = depthMap.getContext('2d')!;
    const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);

    for (let y = 1; y < compositeCanvas.height - 1; y++) {
      for (let x = 1; x < compositeCanvas.width - 1; x++) {
        const idx = y * compositeCanvas.width + x;
        if (visited[idx]) continue;

        const pixelIdx = idx * 4;
        const luminance = 0.299 * starsData.data[pixelIdx] + 
                         0.587 * starsData.data[pixelIdx + 1] + 
                         0.114 * starsData.data[pixelIdx + 2];

        if (luminance > threshold) {
          visited[idx] = 1;
          
          // Get depth
          const depthIdx = (Math.floor(y) * depthMap.width + Math.floor(x)) * 4;
          const depth = depthData.data[depthIdx] / 255;

          // Calculate 3D coordinates
          const centerX = compositeCanvas.width / 2;
          const centerY = compositeCanvas.height / 2;
          const scale = 0.08;

          stars.push({
            x: (x - centerX) * scale,
            y: -(y - centerY) * scale,
            z: (depth - 0.5) * 200 * (0.2 + (depthIntensity / 100) * 1.8),
            brightness: luminance / 255,
            size: 3,
            color3d: `rgb(${starsData.data[pixelIdx]}, ${starsData.data[pixelIdx + 1]}, ${starsData.data[pixelIdx + 2]})`
          });
        }
      }
    }

    canvasPool.release(tempCanvas);
    console.log(`Detected ${stars.length} stars in composite`);
    return { starsOnly: starsCanvas, stars };
  }, [depthIntensity]);

  // Helper to create stereo views from Fast Mode displacement logic
  const createStereoViews = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    depthMap: ImageData,
    width: number,
    height: number,
    maxShift: number,
    starMask: Uint8ClampedArray
  ): { left: ImageData; right: ImageData } => {
    const originalData = ctx.getImageData(0, 0, width, height);
    const leftData = new ImageData(width, height);
    const rightData = new ImageData(width, height);

    // Simple inverse mapping - pull pixels from source
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        const depthValue = depthMap.data[destIdx] / 255.0;
        const shift = depthValue * maxShift;
        
        // LEFT VIEW: Pull from right
        const leftSourceX = Math.round(x + shift);
        if (leftSourceX >= 0 && leftSourceX < width) {
          const leftSrcIdx = (y * width + leftSourceX) * 4;
          leftData.data[destIdx] = originalData.data[leftSrcIdx];
          leftData.data[destIdx + 1] = originalData.data[leftSrcIdx + 1];
          leftData.data[destIdx + 2] = originalData.data[leftSrcIdx + 2];
          leftData.data[destIdx + 3] = 255;
        }
        
        // RIGHT VIEW: Pull from left
        const rightSourceX = Math.round(x - shift);
        if (rightSourceX >= 0 && rightSourceX < width) {
          const rightSrcIdx = (y * width + rightSourceX) * 4;
          rightData.data[destIdx] = originalData.data[rightSrcIdx];
          rightData.data[destIdx + 1] = originalData.data[rightSrcIdx + 1];
          rightData.data[destIdx + 2] = originalData.data[rightSrcIdx + 2];
          rightData.data[destIdx + 3] = 255;
        }
      }
    }

    return { left: leftData, right: rightData };
  }, []);

  // Process images with unified algorithm - matching Stereoscope Processor
  const processImages = useCallback(async () => {
    if (!starlessFile || !starsFile || !starlessElement || !starsElement) {
      toast.error(t('Please upload both images', '请上传两张图片'));
      return;
    }

    setIsProcessing(true);
    setIsReady(false);
    setProgress(0);
    setProcessingStep(t('Initializing processor...', '初始化处理器...'));

    try {
      console.log('Starting unified processing with images:', {
        starless: { width: starlessElement.width, height: starlessElement.height },
        stars: { width: starsElement.width, height: starsElement.height }
      });

      const width = Math.max(starlessElement.width, starsElement.width);
      const height = Math.max(starlessElement.height, starsElement.height);

      // Create canvases
      const starlessCanvas = document.createElement('canvas');
      const starlessCtx = starlessCanvas.getContext('2d')!;
      starlessCanvas.width = width;
      starlessCanvas.height = height;
      starlessCtx.drawImage(starlessElement, 0, 0, width, height);

      const starsCanvas = document.createElement('canvas');
      const starsCtx = starsCanvas.getContext('2d')!;
      starsCanvas.width = width;
      starsCanvas.height = height;
      starsCtx.drawImage(starsElement, 0, 0, width, height);

      // STEP 1: Generate depth map from starless (Fast Mode approach)
      setProcessingStep(t('Generating starless depth map...', '生成无星深度图...'));
      setProgress(20);

      const starlessImageData = starlessCtx.getImageData(0, 0, width, height);
      const simpleParams: SimpleDepthParams = {
        depth: horizontalDisplace,
        edgeWeight: 0.3,
        brightnessWeight: 0.7
      };

      const starlessDepthMap = generateSimpleDepthMap(starlessImageData, simpleParams);

      // Save starless depth map
      const starlessDepthCanvas = document.createElement('canvas');
      const starlessDepthCtx = starlessDepthCanvas.getContext('2d')!;
      starlessDepthCanvas.width = width;
      starlessDepthCanvas.height = height;
      starlessDepthCtx.putImageData(starlessDepthMap, 0, 0);
      setStarlessDepthMapUrl(starlessDepthCanvas.toDataURL('image/png'));

      // STEP 2: Generate depth map for stars (using same Fast Mode approach)
      setProcessingStep(t('Generating stars depth map...', '生成恒星深度图...'));
      setProgress(30);

      const starsImageData = starsCtx.getImageData(0, 0, width, height);
      const starsDepthMap = generateSimpleDepthMap(starsImageData, simpleParams);

      // Save stars depth map
      const starsDepthCanvas = document.createElement('canvas');
      const starsDepthCtx = starsDepthCanvas.getContext('2d')!;
      starsDepthCanvas.width = width;
      starsDepthCanvas.height = height;
      starsDepthCtx.putImageData(starsDepthMap, 0, 0);
      setStarsDepthMapUrl(starsDepthCanvas.toDataURL('image/png'));

      // STEP 3: Process starless with its own depth map (Fast Mode displacement)
      setProcessingStep(t('Processing starless displacement...', '处理无星位移...'));
      setProgress(50);

      const starMask = detectStars(starlessImageData.data, width, height, 200);
      const { left: starlessLeft, right: starlessRight } = createStereoViews(
        starlessCanvas,
        starlessCtx,
        starlessDepthMap,
        width,
        height,
        horizontalDisplace,
        starMask
      );

      // STEP 4: Process stars with starless depth map (Traditional Mode displacement)
      setProcessingStep(t('Processing stars displacement...', '处理恒星位移...'));
      setProgress(65);

      const { left: starsLeft, right: starsRight } = createStereoViews(
        starsCanvas,
        starsCtx,
        starlessDepthMap, // Use starless depth map for stars
        width,
        height,
        horizontalDisplace,
        new Uint8ClampedArray(width * height)
      );

      // STEP 5: Composite starless + stars for each eye
      setProcessingStep(t('Compositing layers...', '合成图层...'));
      setProgress(80);

      const compositeLeft = new ImageData(width, height);
      const compositeRight = new ImageData(width, height);

      for (let i = 0; i < starlessLeft.data.length; i += 4) {
        compositeLeft.data[i] = Math.min(255, starlessLeft.data[i] + starsLeft.data[i]);
        compositeLeft.data[i + 1] = Math.min(255, starlessLeft.data[i + 1] + starsLeft.data[i + 1]);
        compositeLeft.data[i + 2] = Math.min(255, starlessLeft.data[i + 2] + starsLeft.data[i + 2]);
        compositeLeft.data[i + 3] = 255;

        compositeRight.data[i] = Math.min(255, starlessRight.data[i] + starsRight.data[i]);
        compositeRight.data[i + 1] = Math.min(255, starlessRight.data[i + 1] + starsRight.data[i + 1]);
        compositeRight.data[i + 2] = Math.min(255, starlessRight.data[i + 2] + starsRight.data[i + 2]);
        compositeRight.data[i + 3] = 255;
      }

      // Create canvas versions for storage
      const leftBgCanvas = document.createElement('canvas');
      leftBgCanvas.width = width;
      leftBgCanvas.height = height;
      const leftBgCtx = leftBgCanvas.getContext('2d')!;
      leftBgCtx.putImageData(starlessLeft, 0, 0);

      const leftStarsCanvas = document.createElement('canvas');
      leftStarsCanvas.width = width;
      leftStarsCanvas.height = height;
      const leftStarsCtx = leftStarsCanvas.getContext('2d')!;
      leftStarsCtx.putImageData(starsLeft, 0, 0);

      const rightBgCanvas = document.createElement('canvas');
      rightBgCanvas.width = width;
      rightBgCanvas.height = height;
      const rightBgCtx = rightBgCanvas.getContext('2d')!;
      rightBgCtx.putImageData(starlessRight, 0, 0);

      const rightStarsCanvas = document.createElement('canvas');
      rightStarsCanvas.width = width;
      rightStarsCanvas.height = height;
      const rightStarsCtx = rightStarsCanvas.getContext('2d')!;
      rightStarsCtx.putImageData(starsRight, 0, 0);

      const leftCompositeCanvas = document.createElement('canvas');
      leftCompositeCanvas.width = width;
      leftCompositeCanvas.height = height;
      const leftCompCtx = leftCompositeCanvas.getContext('2d')!;
      leftCompCtx.putImageData(compositeLeft, 0, 0);

      const rightCompositeCanvas = document.createElement('canvas');
      rightCompositeCanvas.width = width;
      rightCompositeCanvas.height = height;
      const rightCompCtx = rightCompositeCanvas.getContext('2d')!;
      rightCompCtx.putImageData(compositeRight, 0, 0);

      // Store composites and separated layers for display
      setLeftComposite(leftCompositeCanvas.toDataURL());
      setRightComposite(rightCompositeCanvas.toDataURL());
      setLeftBackground(leftBgCanvas.toDataURL());
      setRightBackground(rightBgCanvas.toDataURL());
      setLeftStarsOnly(leftStarsCanvas.toDataURL());
      setRightStarsOnly(rightStarsCanvas.toDataURL());

      // Store canvases for download
      setProcessedCanvases({
        leftBackground: leftBgCanvas,
        leftStars: leftStarsCanvas,
        rightBackground: rightBgCanvas,
        rightStars: rightStarsCanvas,
        starlessDepthMap: starlessDepthCanvas,
        starsDepthMap: starsDepthCanvas
      });
      
      
      // Step 2: Detect stars from composited images for 3D rendering
      setProcessingStep(t('Detecting stars for 3D...', '检测3D星点...'));
      setProgress(90);

      const canvasPool = CanvasPool.getInstance();
      
      // Extract stars from left composite
      const leftExtractCanvas = canvasPool.acquire(width, height);
      const leftExtractCtx = leftExtractCanvas.getContext('2d')!;
      leftExtractCtx.putImageData(compositeLeft, 0, 0);
      
      const leftStarData = extractStarsFromComposite(leftExtractCanvas, starlessElement, starlessDepthCanvas);
      setLeftStars(leftStarData.stars);
      canvasPool.release(leftExtractCanvas);
      
      // Extract stars from right composite
      const rightExtractCanvas = canvasPool.acquire(width, height);
      const rightExtractCtx = rightExtractCanvas.getContext('2d')!;
      rightExtractCtx.putImageData(compositeRight, 0, 0);
      
      const rightStarData = extractStarsFromComposite(rightExtractCanvas, starlessElement, starlessDepthCanvas);
      setRightStars(rightStarData.stars);
      canvasPool.release(rightExtractCanvas);

      console.log(`✓ Detected ${leftStarData.stars.length} left stars and ${rightStarData.stars.length} right stars for 3D rendering`);
      
      console.log('✓ Prepared separated layers for 3D rendering');
      console.log('Left background:', leftBackground ? 'SET' : 'NULL');
      console.log('Right background:', rightBackground ? 'SET' : 'NULL');
      console.log('Left stars only:', leftStarsOnly ? 'SET' : 'NULL');
      console.log('Right stars only:', rightStarsOnly ? 'SET' : 'NULL');

      setIsReady(true);
      setProgress(100);
      setProcessingStep(t('Complete!', '完成！'));

      // Don't auto-start animation - let user control when to play
      setProcessingStep('');

    } catch (error) {
      console.error('Processing error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('Processing failed: ' + errorMsg, '处理失败：' + errorMsg));
      setIsReady(false);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, [starlessFile, starsFile, starlessElement, starsElement, horizontalDisplace, starShiftAmount, t, extractStarsFromComposite]);

  // Generate stitched parallel video with frame-by-frame rendering
  const generateParallelVideo = useCallback(async () => {
    if (!leftCanvasRef.current || !rightCanvasRef.current || !stitchedCanvasRef.current) {
      toast.error(t('Canvas not ready', '画布未就绪'));
      return;
    }

    setIsGenerating(true);
    const canvasPool = CanvasPool.getInstance();
    
    try {
      const stitchedCanvas = stitchedCanvasRef.current;
      
      // Use the EXACT dimensions from the stitched canvas to match preview
      // Calculate dimensions the same way as stitchCanvases() does
      const leftCanvas = leftCanvasRef.current;
      const rightCanvas = rightCanvasRef.current;
      
      if (!leftCanvas || !rightCanvas) {
        throw new Error('Canvas references not available');
      }
      
      const viewWidth = leftCanvas.width;
      const viewHeight = leftCanvas.height;
      const totalWidth = viewWidth * 2 + stereoSpacing + borderSize * 2;
      const totalHeight = viewHeight + borderSize * 2;
      
      // Calculate scale to fit within reasonable video dimensions if needed
      let scale = 1;
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      if (totalWidth > maxWidth || totalHeight > maxHeight) {
        scale = Math.min(maxWidth / totalWidth, maxHeight / totalHeight);
        console.log(`Scaling video by ${scale.toFixed(3)} to fit within ${maxWidth}x${maxHeight}`);
      }
      
      const recordWidth = Math.round(totalWidth * scale);
      const recordHeight = Math.round(totalHeight * scale);
      
      console.log(`Recording dimensions: ${recordWidth}x${recordHeight} (scale: ${scale.toFixed(3)})`);
      console.log(`Layout: viewWidth=${viewWidth}, spacing=${stereoSpacing}, border=${borderSize}`);
      
      const fps = 30;
      const duration = motionSettings.duration;
      const totalFrames = Math.ceil(duration * fps);
      
      console.log(`Rendering ${totalFrames} frames at ${fps}fps for stitched video`);
      console.log(`Video quality: 50Mbps bitrate, VP9 codec`);
      
      // Create offscreen canvas for high-performance rendering
      const renderCanvas = canvasPool.acquire(recordWidth, recordHeight);
      const renderCtx = renderCanvas.getContext('2d', {
        alpha: false,
        desynchronized: true, // Better performance
        willReadFrequently: false
      })!;
      
      // High-quality rendering settings
      renderCtx.imageSmoothingEnabled = true;
      renderCtx.imageSmoothingQuality = 'high';
      
      // STAGE 1: Pre-render all frames with optimized timing
      setVideoProgress({ stage: t('Rendering frames...', '渲染帧...'), percent: 0 });
      console.log('Stage 1: Pre-rendering frames with optimizations...');
      
      const frames: ImageData[] = [];
      
      // Stop normal animation
      setIsAnimating(false);
      
      // Batch size for progress updates
      const batchSize = 5;
      
      // Render each frame
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Calculate exact progress for this frame (0-100)
        const frameProgress = (frameIndex / (totalFrames - 1)) * 100;
        
        // Set progress directly in ref (bypasses React batching)
        videoProgressRef.current = frameProgress;
        
        // Trigger a re-render to update both canvases
        setFrameRenderTrigger(prev => prev + 1);
        
        // Wait for rendering to complete - optimized RAF timing
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // CRITICAL: Stitch the canvases together AFTER both views have rendered
        stitchCanvases();
        
        // Single RAF for stitching to complete
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Capture frame from stitched canvas with high-quality scaling
        renderCtx.fillStyle = '#000000';
        renderCtx.fillRect(0, 0, recordWidth, recordHeight);
        
        // Draw with exact aspect ratio preservation and high quality
        if (scale === 1) {
          // No scaling needed - draw directly
          renderCtx.drawImage(stitchedCanvas, 0, 0);
        } else {
          // Scale uniformly maintaining aspect ratio with quality
          renderCtx.drawImage(stitchedCanvas, 0, 0, totalWidth, totalHeight, 0, 0, recordWidth, recordHeight);
        }
        
        // Store frame data
        const frameData = renderCtx.getImageData(0, 0, recordWidth, recordHeight);
        frames.push(frameData);
        
        // Update progress in batches for better UI performance
        if (frameIndex % batchSize === 0 || frameIndex === totalFrames - 1) {
          const renderProgress = (frameIndex / totalFrames) * 50;
          setVideoProgress({ 
            stage: t(`Rendering frames... ${frameIndex + 1}/${totalFrames}`, `渲染帧... ${frameIndex + 1}/${totalFrames}`), 
            percent: renderProgress 
          });
        }
        
        if ((frameIndex + 1) % 30 === 0) {
          console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames (${frameProgress.toFixed(1)}% animation)`);
        }
      }
      
      console.log(`✓ All ${frames.length} frames rendered`);
      
      // STAGE 2: Encode frames to WebM video with high quality
      setVideoProgress({ stage: t('Encoding video...', '编码视频...'), percent: 50 });
      console.log('Stage 2: Encoding to high-quality WebM...');
      
      // Create a temporary canvas for MediaRecorder with optimized settings
      const encodingCanvas = canvasPool.acquire(recordWidth, recordHeight);
      const encodingCtx = encodingCanvas.getContext('2d', {
        alpha: false,
        desynchronized: true
      })!;
      
      // High-quality rendering for encoding
      encodingCtx.imageSmoothingEnabled = true;
      encodingCtx.imageSmoothingQuality = 'high';
      
      // Set up MediaRecorder with optimal codec
      const stream = encodingCanvas.captureStream(fps);
      
      // Try codecs in order of quality
      let mimeType = 'video/webm;codecs=vp9';
      let bitrate = 50000000; // 50Mbps for VP9
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('VP9 not supported, falling back to VP8');
        mimeType = 'video/webm;codecs=vp8';
        bitrate = 30000000; // 30Mbps for VP8
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.log('VP8 not supported, using default WebM');
          mimeType = 'video/webm';
          bitrate = 20000000; // 20Mbps fallback
        }
      }
      
      console.log(`Using codec: ${mimeType} at ${bitrate / 1000000}Mbps`);
      
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      const videoBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        
        mediaRecorder.onerror = (e) => {
          reject(new Error('MediaRecorder error'));
        };
        
        mediaRecorder.start();
        
        // Play back frames with precise timing
        let frameIdx = 0;
        const frameInterval = 1000 / fps;
        let startTime = performance.now();
        
        const playFrames = () => {
          if (frameIdx >= frames.length) {
            mediaRecorder.stop();
            return;
          }
          
          // Draw frame with high quality
          encodingCtx.putImageData(frames[frameIdx], 0, 0);
          frameIdx++;
          
          // Update progress in batches
          if (frameIdx % batchSize === 0 || frameIdx === frames.length) {
            const encodeProgress = 50 + (frameIdx / frames.length) * 45;
            setVideoProgress({
              stage: t(`Encoding video... ${frameIdx}/${frames.length}`, `编码视频... ${frameIdx}/${frames.length}`),
              percent: encodeProgress
            });
          }
          
          // Precise timing calculation
          const expectedTime = startTime + (frameIdx * frameInterval);
          const currentTime = performance.now();
          const drift = expectedTime - currentTime;
          
          setTimeout(playFrames, Math.max(0, frameInterval + drift));
        };
        
        playFrames();
      });
      
      console.log('✓ Video encoded successfully');
      
      // Download video
      setVideoProgress({ stage: t('Downloading...', '下载中...'), percent: 95 });
      VideoGenerationService.downloadVideo(videoBlob, `parallel-3d-${Date.now()}.webm`);
      
      toast.success(t('Video generated successfully!', '视频生成成功！'));
      setVideoProgress({ stage: '', percent: 100 });
      
      // Clean up
      canvasPool.release(renderCanvas);
      canvasPool.release(encodingCanvas);
      
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(t('Failed to generate video', '视频生成失败'));
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setVideoProgress({ stage: '', percent: 0 });
      }, 2000);
    }
  }, [leftCanvasRef, rightCanvasRef, stitchedCanvasRef, motionSettings, stereoSpacing, borderSize, t]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full">
          <Sparkles className="h-6 w-6 text-amber-400" />
          <span className="text-xl font-semibold text-white">
            {t('3D Parallel Video Generator', '3D平行视频生成器')}
          </span>
        </div>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t(
            'Generate stunning stereoscopic 3D videos from astronomy images using Traditional Morph processing',
            '使用传统变形处理从天文图像生成令人惊叹的立体3D视频'
          )}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-cosmic-900/50 border border-cosmic-700/50 rounded-lg p-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${!isReady ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
            <Upload className="h-4 w-4" />
            <span className="text-sm">{t('1. Upload & Process', '1. 上传与处理')}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isReady && !isGenerating ? 'bg-amber-500/20 text-amber-300' : isGenerating ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Settings2 className="h-4 w-4" />
            <span className="text-sm">{t('2. Configure Motion', '2. 配置运动')}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isGenerating ? 'bg-amber-500/20 text-amber-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Video className="h-4 w-4" />
            <span className="text-sm">{t('3. Generate Video', '3. 生成视频')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Step 1: Upload & Traditional Morph Settings */}
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {t('Step 1: Upload Images', '步骤1：上传图片')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Upload your starless and stars-only images', '上传无星和仅星图像')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-orange-400 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('Stars Only Image', '仅星图像')}
                </Label>
                <input
                  ref={starsInputRef}
                  type="file"
                  accept="image/*,.tif,.tiff"
                  onChange={handleStarsUpload}
                  className="hidden"
                />
                
                {uploadProgress.stars.show && (
                  <UploadProgress 
                    show={true}
                    progress={uploadProgress.stars.progress}
                    fileName={uploadProgress.stars.fileName}
                  />
                )}
                
                {!starsElement ? (
                  <Button
                    onClick={() => starsInputRef.current?.click()}
                    className="group w-full h-24 bg-cosmic-800/50 hover:bg-orange-500/10 border-2 border-dashed border-cosmic-600 hover:border-orange-500/50 transition-all"
                    variant="outline"
                    disabled={uploadProgress.stars.show}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-cosmic-400 group-hover:text-orange-400 transition-colors" />
                      <span className="text-sm text-cosmic-300 group-hover:hidden">
                        {t('Click to upload', '点击上传')}
                      </span>
                      <span className="text-sm text-orange-400 hidden group-hover:block">
                        {t('Stars Only', '仅星图像')}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => starsInputRef.current?.click()}>
                    <img
                      src={starsElement.src}
                      alt="Stars Preview"
                      className="w-full h-40 object-cover rounded-lg border-2 border-orange-500/50 hover:border-orange-500 transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-orange-400" />
                    </div>
                    <span className="text-xs text-cosmic-400 mt-1 block text-center">
                      {starsElement.width} × {starsElement.height}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('Starless Image (Background)', '无星图像（背景）')}
                </Label>
                <input
                  ref={starlessInputRef}
                  type="file"
                  accept="image/*,.tif,.tiff"
                  onChange={handleStarlessUpload}
                  className="hidden"
                />
                
                {uploadProgress.starless.show && (
                  <UploadProgress 
                    show={true}
                    progress={uploadProgress.starless.progress}
                    fileName={uploadProgress.starless.fileName}
                  />
                )}
                
                {!starlessElement ? (
                  <Button
                    onClick={() => starlessInputRef.current?.click()}
                    className="group w-full h-24 bg-cosmic-800/50 hover:bg-purple-500/10 border-2 border-dashed border-cosmic-600 hover:border-purple-500/50 transition-all"
                    variant="outline"
                    disabled={uploadProgress.starless.show}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-cosmic-400 group-hover:text-purple-400 transition-colors" />
                      <span className="text-sm text-cosmic-300 group-hover:hidden">
                        {t('Click to upload', '点击上传')}
                      </span>
                      <span className="text-sm text-purple-400 hidden group-hover:block">
                        {t('Starless', '无星图像')}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => starlessInputRef.current?.click()}>
                    <img
                      src={starlessElement.src}
                      alt="Starless Preview"
                      className="w-full h-40 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <span className="text-xs text-cosmic-400 mt-1 block text-center">
                      {starlessElement.width} × {starlessElement.height}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-cosmic-700/30" />

            {/* Processing Parameters - Exactly matching stereoscope processor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  {t('Processing Parameters', '处理参数')}
                </h3>
                <p className="text-sm text-cosmic-400">
                  {t('Configure stereo spacing and borders', '配置立体间距和边框')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stereo Spacing */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Stereo Spacing', '立体间距')}</span>
                    <span className="text-blue-400 font-mono text-lg">({stereoSpacing}px)</span>
                  </Label>
                  <Slider
                    value={[stereoSpacing]}
                    onValueChange={([value]) => setStereoSpacing(value)}
                    min={0}
                    max={1000}
                    step={50}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Gap between left and right stereo images for easier viewing', '左右立体图像之间的间隙，便于观看')}
                  </p>
                </div>

                {/* Border Size */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Border Size', '边框大小')}</span>
                    <span className="text-blue-400 font-mono text-lg">({borderSize}px)</span>
                  </Label>
                  <Slider
                    value={[borderSize]}
                    onValueChange={([value]) => setBorderSize(value)}
                    min={0}
                    max={600}
                    step={50}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Size of black borders around stereo pair (0 = no borders)', '立体对周围的黑色边框大小（0 = 无边框）')}
                  </p>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={processImages}
              disabled={!starlessFile || !starsFile || !starlessElement || !starsElement || isProcessing}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/20"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{processingStep || t('Processing...', '处理中...')}</span>
                  {progress > 0 && <span className="text-white/80">({progress}%)</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('Process Images', '处理图像')}
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Motion Settings & Preview */}
        {isReady && (
          <>
            {/* Debug View: Show all intermediate images */}
            <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-white">Debug: Processed Images</CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Intermediate results from processing', '处理的中间结果')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {leftComposite && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Left Composite</Label>
                      <img src={leftComposite} alt="Left Composite" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                  {rightComposite && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Right Composite</Label>
                      <img src={rightComposite} alt="Right Composite" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                  {leftStarsOnly && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Left Stars Only</Label>
                      <img src={leftStarsOnly} alt="Left Stars" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                  {rightStarsOnly && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Right Stars Only</Label>
                      <img src={rightStarsOnly} alt="Right Stars" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                  {leftBackground && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Left Background</Label>
                      <img src={leftBackground} alt="Left Background" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                  {rightBackground && (
                    <div className="space-y-2">
                      <Label className="text-cosmic-200 text-xs">Right Background (Displaced)</Label>
                      <img src={rightBackground} alt="Right Background" className="w-full rounded border border-cosmic-600" />
                    </div>
                  )}
                </div>
                
                {/* Depth Maps Section */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Depth Analysis Maps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {starlessDepthMapUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-cosmic-200 text-xs">Starless Depth Map</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadProcessedImage('starlessDepthMap')}
                            className="h-7 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PNG
                          </Button>
                        </div>
                        <img src={starlessDepthMapUrl} alt="Starless Depth Map" className="w-full rounded border border-cosmic-600" />
                      </div>
                    )}
                    {starsDepthMapUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-cosmic-200 text-xs">Stars Depth Map</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadProcessedImage('starsDepthMap')}
                            className="h-7 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PNG
                          </Button>
                        </div>
                        <img src={starsDepthMapUrl} alt="Stars Depth Map" className="w-full rounded border border-cosmic-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Download All Section */}
                  <div className="space-y-2">
                    <Label className="text-cosmic-200 text-sm">Download Processed Layers (High-Quality PNG)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('leftBackground')}
                        disabled={!processedCanvases.leftBackground}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Left BG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('leftStars')}
                        disabled={!processedCanvases.leftStars}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Left Stars
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('rightBackground')}
                        disabled={!processedCanvases.rightBackground}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Right BG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('rightStars')}
                        disabled={!processedCanvases.rightStars}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Right Stars
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('starlessDepthMap')}
                        disabled={!processedCanvases.starlessDepthMap}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Starless Depth
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadProcessedImage('starsDepthMap')}
                        disabled={!processedCanvases.starsDepthMap}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Stars Depth
                      </Button>
                    </div>
                    <p className="text-xs text-cosmic-400">
                      {t(
                        'Note: Downloaded as PNG for browser compatibility. Maximum quality preserved.',
                        '注意：为浏览器兼容性下载为PNG格式。保留最高质量。'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <Settings2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    {t('Step 2: Configure 3D Motion Settings', '步骤2：配置3D运动设置')}
                  </CardTitle>
                  <CardDescription className="text-cosmic-300">
                    {t('Adjust animation parameters for your 3D star field', '调整3D星场的动画参数')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Motion Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Motion Type */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200">{t('Motion Type', '运动类型')}</Label>
                  <Select
                    value={motionSettings.motionType}
                    onValueChange={(value: any) => 
                      setMotionSettings({ ...motionSettings, motionType: value })
                    }
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom_in">{t('Zoom In', '拉近')}</SelectItem>
                      <SelectItem value="zoom_out">{t('Zoom Out', '拉远')}</SelectItem>
                      <SelectItem value="pan_left">{t('Pan Left', '向左平移')}</SelectItem>
                      <SelectItem value="pan_right">{t('Pan Right', '向右平移')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Duration', '时长')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.duration}s</span>
                  </Label>
                  <Slider
                    value={[motionSettings.duration]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, duration: value })
                    }
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Speed', '速度')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.speed.toFixed(1)}x</span>
                  </Label>
                  <Slider
                    value={[motionSettings.speed]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, speed: value })
                    }
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Amplification */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Amplification', '放大')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.amplification}%</span>
                  </Label>
                  <Slider
                    value={[motionSettings.amplification]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, amplification: value })
                    }
                    min={100}
                    max={300}
                    step={10}
                  />
                </div>

                {/* Spin Amount */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Spin Amount', '旋转量')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.spin}°</span>
                  </Label>
                  <Slider
                    value={[motionSettings.spin]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, spin: value })
                    }
                    min={0}
                    max={90}
                    step={5}
                  />
                </div>

                {/* Spin Direction */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200">{t('Spin Direction', '旋转方向')}</Label>
                  <Select
                    value={motionSettings.spinDirection}
                    onValueChange={(value: any) => 
                      setMotionSettings({ ...motionSettings, spinDirection: value })
                    }
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clockwise">{t('Clockwise', '顺时针')}</SelectItem>
                      <SelectItem value="counterclockwise">{t('Counterclockwise', '逆时针')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Depth Intensity */}
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('3D Depth Intensity', '3D深度强度')}</span>
                    <span className="text-blue-400 font-mono">{depthIntensity}</span>
                  </Label>
                  <Slider
                    value={[depthIntensity]}
                    onValueChange={([value]) => setDepthIntensity(value)}
                    min={0}
                    max={200}
                    step={5}
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Controls the parallax effect intensity', '控制视差效果强度')}
                  </p>
                </div>
              </div>

              <Separator className="bg-cosmic-700/30" />

              {/* Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  {t('Preview', '预览')}
                </h3>

                {/* Hidden Left View - for rendering only (must be rendered, not display:none) */}
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                  {leftStars.length > 0 && leftBackground && leftStarsOnly ? (
                    <StarField3D
                      stars={leftStars}
                      settings={motionSettings}
                      isAnimating={isAnimating}
                      isRecording={false}
                      backgroundImage={leftBackground}
                      starsOnlyImage={leftStarsOnly}
                      depthIntensity={depthIntensity}
                      horizontalDisplace={horizontalDisplace}
                      starShiftAmount={starShiftAmount}
                      videoProgressRef={isGenerating ? videoProgressRef : undefined}
                      frameRenderTrigger={frameRenderTrigger}
                      onProgressUpdate={handleProgressUpdate}
                      onCanvasReady={(canvas) => { 
                        leftCanvasRef.current = canvas;
                        console.log('✅ Left canvas ready for stitching');
                      }}
                    />
                  ) : (
                    <div>Left view waiting: stars={leftStars.length}, bg={leftBackground ? 'yes' : 'no'}, starsOnly={leftStarsOnly ? 'yes' : 'no'}</div>
                  )}
                </div>

                {/* Hidden Right View - for rendering only (must be rendered, not display:none) */}
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                  {rightStars.length > 0 && rightBackground && rightStarsOnly ? (
                    <StarField3D
                      stars={rightStars}
                      settings={motionSettings}
                      isAnimating={isAnimating}
                      isRecording={false}
                      backgroundImage={rightBackground}
                      starsOnlyImage={rightStarsOnly}
                      depthIntensity={depthIntensity}
                      horizontalDisplace={horizontalDisplace}
                      starShiftAmount={starShiftAmount}
                      videoProgressRef={isGenerating ? videoProgressRef : undefined}
                      frameRenderTrigger={frameRenderTrigger}
                      onProgressUpdate={handleProgressUpdate}
                      onCanvasReady={(canvas) => { 
                        rightCanvasRef.current = canvas;
                        console.log('✅ Right canvas ready for stitching');
                      }}
                    />
                  ) : (
                    <div>Right view waiting: stars={rightStars.length}, bg={rightBackground ? 'yes' : 'no'}, starsOnly={rightStarsOnly ? 'yes' : 'no'}</div>
                  )}
                </div>

                {/* Stitched View */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 text-sm">
                    {t('Stitched Parallel View (With Displacement Applied)', '拼接平行视图（已应用位移）')}
                  </Label>
                  <div className="bg-black rounded-lg overflow-hidden border-2 border-cyan-500 shadow-2xl">
                    <div className="overflow-x-auto">
                      <canvas 
                        ref={stitchedCanvasRef} 
                        className="max-w-full h-auto"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-cosmic-400">
                    {t(
                      'Stereoscopic pair with depth-based displacement - view cross-eyed for 3D effect',
                      '基于深度位移的立体对 - 交叉眼查看3D效果'
                    )}
                  </p>
                </div>

                {/* Video Player Controls */}
                <VideoPlayerControls
                  isPlaying={isAnimating}
                  progress={animationProgress}
                  duration={motionSettings.duration}
                  onPlayPause={() => setIsAnimating(!isAnimating)}
                  onReplay={handleReplay}
                  disabled={!leftCanvasRef.current || !rightCanvasRef.current || !stitchedCanvasRef.current || isGenerating}
                />

                {/* Generate Video Button */}
                <Button
                  onClick={generateParallelVideo}
                  disabled={isGenerating || !leftCanvasRef.current || !rightCanvasRef.current || !stitchedCanvasRef.current}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/20"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {isGenerating 
                    ? `${videoProgress.stage} (${Math.round(videoProgress.percent)}%)` 
                    : t('Generate Video', '生成视频')
                  }
                </Button>

                {(!leftCanvasRef.current || !rightCanvasRef.current || !stitchedCanvasRef.current) && (
                  <div className="space-y-2">
                    <p className="text-sm text-cosmic-400 text-center">
                      {t('Initializing canvas...', '初始化画布中...')} {canvasInitProgress}%
                    </p>
                    <div className="w-full h-2 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${canvasInitProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ParallelVideoGenerator;
