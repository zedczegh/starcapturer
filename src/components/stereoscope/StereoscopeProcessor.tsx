import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Upload, Eye, Download, Loader2, Layers, Settings2, Sparkles, ChevronDown, Package, RotateCcw, Info, Wand2, Check, Search } from 'lucide-react';
import { UploadProgress } from '@/components/ui/upload-progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateSimpleDepthMap, detectStars, type SimpleDepthParams } from '@/lib/simpleDepthMap';
import { TraditionalMorphProcessor, type TraditionalInputs, type TraditionalMorphParams } from '@/lib/traditionalMorphMode';
import { NobelPrizeStereoscopeEngine } from '@/lib/advanced/NobelPrizeStereoscopeEngine';
import { analyzeStarsWithAI, type StarAnalysisResult } from '@/services/aiStarAnalysis';
import { plateSolveImage, formatRA, formatDec, identifyDeepSkyObject, calculateSuggestedDisplacement, type PlateSolveResult } from '@/services/plateSolve';
import { searchTarget, calculateDisplacementFromDistance, mapObjectType, type TargetSearchResult } from '@/services/targetSearch';
import { toast } from 'sonner';
import JSZip from 'jszip';
// @ts-ignore
import * as UTIF from 'utif';

interface ProcessingParams {
  maxShift: number;
  edgeWeight: number;
  blurSigma: number;
  contrastAlpha: number;
  starThreshold: number;
  nebulaDepthBoost: number;
  colorChannelWeights: {
    red: number;
    green: number;
    blue: number;
  };
  objectType: 'nebula' | 'galaxy' | 'planetary' | 'mixed';
  starParallaxPx: number;
  preserveStarShapes: boolean;
}

const StereoscopeProcessor: React.FC = () => {
  const { t } = useLanguage();
  
  // Unified mode states
  const [starlessImage, setStarlessImage] = useState<File | null>(null);
  const [starsImage, setStarsImage] = useState<File | null>(null);
  const [starlessPreview, setStarlessPreview] = useState<string | null>(null);
  const [starsPreview, setStarsPreview] = useState<string | null>(null);
  const [starlessElement, setStarlessElement] = useState<HTMLImageElement | null>(null);
  const [starsElement, setStarsElement] = useState<HTMLImageElement | null>(null);
  
  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    starless: { show: false, progress: 0, fileName: '' },
    stars: { show: false, progress: 0, fileName: '' }
  });
  
  // Result states
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [leftImageUrl, setLeftImageUrl] = useState<string | null>(null);
  const [rightImageUrl, setRightImageUrl] = useState<string | null>(null);
  const [anaglyphImageUrl, setAnaglyphImageUrl] = useState<string | null>(null);
  const [starlessDepthMapUrl, setStarlessDepthMapUrl] = useState<string | null>(null);
  const [starsDepthMapUrl, setStarsDepthMapUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const starlessInputRef = useRef<HTMLInputElement>(null);
  const starsInputRef = useRef<HTMLInputElement>(null);
  
  // Output format selection
  const [outputFormat, setOutputFormat] = useState<'stereo' | 'anaglyph' | 'lenticular' | 'reald3d' | 'both'>('stereo');
  const [lenticularImageUrl, setLenticularImageUrl] = useState<string | null>(null);
  const [reald3dImageUrl, setReald3dImageUrl] = useState<string | null>(null);
  const [lenticularLPI, setLenticularLPI] = useState<number>(60); // Lines Per Inch for lenticular
  
  const [params, setParams] = useState<ProcessingParams>({
    maxShift: 30,
    edgeWeight: 0.3,
    blurSigma: 1.0,
    contrastAlpha: 1.2,
    starThreshold: 200,
    nebulaDepthBoost: 1.5,
    colorChannelWeights: {
      red: 0.299,
      green: 0.587,
      blue: 0.114
    },
    objectType: 'nebula',
    starParallaxPx: 15, // Increased for better visibility
    preserveStarShapes: true,
  });

  // Add stereo spacing parameter
  const [stereoSpacing, setStereoSpacing] = useState<number>(600);
  
  // Add border size parameter (0-600px)
  const [borderSize, setBorderSize] = useState<number>(300);
  
  // Displacement controls for starless image
  const [displacementAmount, setDisplacementAmount] = useState<number>(25); // 0-50 pixels
  const [displacementDirection, setDisplacementDirection] = useState<'left' | 'right'>('right');
  
  // Displacement controls for stars image
  const [starsDisplacementAmount, setStarsDisplacementAmount] = useState<number>(15); // 0-50 pixels
  const [starsDisplacementDirection, setStarsDisplacementDirection] = useState<'left' | 'right'>('left');
  
  // Traditional mode parameters - enhanced for better 3D effect
  const [traditionalParams, setTraditionalParams] = useState<TraditionalMorphParams>({
    horizontalDisplace: 25, // Increased for more nebula depth
    starShiftAmount: 6, // Increased for more dramatic star 3D effect
    luminanceBlur: 1.5,
    contrastBoost: 1.2
  });

  // AI Star Analysis states
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<StarAnalysisResult | null>(null);
  const [useAiParams, setUseAiParams] = useState(false);

  // Plate Solve states
  const [plateSolveEnabled, setPlateSolveEnabled] = useState(false);
  const [plateSolving, setPlateSolving] = useState(false);
  const [plateSolveResult, setPlateSolveResult] = useState<PlateSolveResult | null>(null);
  const [identifiedObject, setIdentifiedObject] = useState<{ name: string; commonName?: string; distanceLY?: number; type: string } | null>(null);

  // Target Search states (SIMBAD)
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [targetSearching, setTargetSearching] = useState(false);
  const [targetSearchResult, setTargetSearchResult] = useState<TargetSearchResult | null>(null);

  // Handle target search
  const handleTargetSearch = async () => {
    if (!targetSearchQuery.trim()) {
      toast.error(t('Please enter a target name', '请输入目标名称'));
      return;
    }

    setTargetSearching(true);
    setTargetSearchResult(null);
    try {
      const result = await searchTarget(targetSearchQuery);
      if (result) {
        setTargetSearchResult(result);
        toast.success(t(`Found: ${result.name}`, `已找到: ${result.name}`));
      } else {
        toast.error(t('Object not found in SIMBAD database', '在SIMBAD数据库中未找到该天体'));
      }
    } catch (error) {
      console.error('Target search error:', error);
      toast.error(t('Failed to search target', '搜索目标失败'));
    } finally {
      setTargetSearching(false);
    }
  };

  // Apply target search parameters
  const applyTargetSearchParams = () => {
    if (!targetSearchResult) return;
    
    if (targetSearchResult.distance?.value) {
      const suggested = calculateDisplacementFromDistance(targetSearchResult.distance.value);
      setDisplacementAmount(suggested.starless);
      setStarsDisplacementAmount(suggested.stars);
      
      // Set identified object for display
      setIdentifiedObject({
        name: targetSearchResult.name,
        commonName: targetSearchResult.aliases?.[0],
        distanceLY: targetSearchResult.distance.value,
        type: targetSearchResult.objectType || 'unknown'
      });
      
      // Set object type
      const mappedType = mapObjectType(targetSearchResult.objectType);
      setParams(prev => ({ ...prev, objectType: mappedType }));
      
      toast.success(t(`Displacement set based on ${targetSearchResult.distance.value.toLocaleString()} LY distance`, `已根据 ${targetSearchResult.distance.value.toLocaleString()} 光年距离设置位移`));
    } else {
      // No distance info, just set identified object
      setIdentifiedObject({
        name: targetSearchResult.name,
        commonName: targetSearchResult.aliases?.[0],
        type: targetSearchResult.objectType || 'unknown'
      });
      toast.info(t('No distance data available for this object', '此天体无距离数据'));
    }
  };

  // Handle AI analysis with target search data from SIMBAD
  const handleAiAnalysisWithTargetData = async () => {
    const imageUrl = starsPreview || starlessPreview;
    if (!imageUrl) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    if (!targetSearchResult) {
      toast.error(t('Please search for a target first', '请先搜索目标'));
      return;
    }

    setAiAnalyzing(true);
    try {
      // Build context from target search results
      const plateSolveContext = {
        ra: targetSearchResult.ra,
        dec: targetSearchResult.dec,
        fieldRadius: 2, // Assume typical 2 degree FOV
        pixelScale: 1, // Default
        identifiedObject: {
          name: targetSearchResult.name,
          commonName: targetSearchResult.aliases?.[0],
          distanceLY: targetSearchResult.distance?.value,
          type: targetSearchResult.objectType || 'unknown'
        },
        objectsInField: targetSearchResult.aliases || []
      };

      const result = await analyzeStarsWithAI(imageUrl, 'star-analysis', plateSolveContext);
      if (result && 'summary' in result) {
        setAiAnalysisResult(result as StarAnalysisResult);
        
        // Auto-apply the recommendations
        const recs = (result as StarAnalysisResult).stereoscopicRecommendations;
        const classification = (result as StarAnalysisResult).objectClassification;
        
        setParams(prev => ({
          ...prev,
          maxShift: recs.suggestedMaxShift || prev.maxShift,
          objectType: classification.dominantType as 'nebula' | 'galaxy' | 'planetary' | 'mixed'
        }));
        
        // Set displacement based on AI recommendation or distance
        if (targetSearchResult.distance?.value) {
          const suggested = calculateDisplacementFromDistance(targetSearchResult.distance.value);
          setDisplacementAmount(suggested.starless);
          setStarsDisplacementAmount(suggested.stars);
        } else if (recs.depthContrast === 'high') {
          setDisplacementAmount(35);
          setStarsDisplacementAmount(20);
        } else if (recs.depthContrast === 'medium') {
          setDisplacementAmount(25);
          setStarsDisplacementAmount(15);
        } else {
          setDisplacementAmount(15);
          setStarsDisplacementAmount(10);
        }
        
        // Set identified object for display
        setIdentifiedObject({
          name: targetSearchResult.name,
          commonName: targetSearchResult.aliases?.[0],
          distanceLY: targetSearchResult.distance?.value,
          type: targetSearchResult.objectType || 'unknown'
        });
        
        setUseAiParams(true);
        toast.success(t('AI analysis complete! Parameters applied.', 'AI分析完成！参数已应用。'));
      } else {
        toast.error(t('Analysis failed', '分析失败'));
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error(t('Failed to analyze image', '分析图像失败'));
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle AI analysis - now uses plate solve results for better recommendations
  const handleAiAnalysis = async () => {
    const imageUrl = starsPreview || starlessPreview;
    if (!imageUrl) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setAiAnalyzing(true);
    try {
      // Build context from plate solve results for better AI recommendations
      const plateSolveContext = plateSolveResult?.success && plateSolveResult?.calibration ? {
        ra: plateSolveResult.calibration.ra,
        dec: plateSolveResult.calibration.dec,
        fieldRadius: plateSolveResult.calibration.radius,
        pixelScale: plateSolveResult.calibration.pixscale,
        identifiedObject: identifiedObject ? {
          name: identifiedObject.name,
          commonName: identifiedObject.commonName,
          distanceLY: identifiedObject.distanceLY,
          type: identifiedObject.type
        } : undefined,
        objectsInField: plateSolveResult.objectsInField
      } : undefined;

      const result = await analyzeStarsWithAI(imageUrl, 'star-analysis', plateSolveContext);
      if (result && 'summary' in result) {
        setAiAnalysisResult(result as StarAnalysisResult);
        toast.success(t('AI analysis complete!', 'AI分析完成！'));
      } else {
        toast.error(t('Analysis failed', '分析失败'));
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error(t('Failed to analyze image', '分析图像失败'));
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Apply AI recommended parameters
  const applyAiRecommendations = () => {
    if (!aiAnalysisResult) return;
    
    const recs = aiAnalysisResult.stereoscopicRecommendations;
    setParams(prev => ({
      ...prev,
      maxShift: recs.suggestedMaxShift || prev.maxShift,
      objectType: aiAnalysisResult.objectClassification.dominantType as 'nebula' | 'galaxy' | 'planetary' | 'mixed'
    }));
    
    // Set displacement based on depth contrast
    if (recs.depthContrast === 'high') {
      setDisplacementAmount(35);
      setStarsDisplacementAmount(20);
    } else if (recs.depthContrast === 'medium') {
      setDisplacementAmount(25);
      setStarsDisplacementAmount(15);
    } else {
      setDisplacementAmount(15);
      setStarsDisplacementAmount(10);
    }
    
    setUseAiParams(true);
    toast.success(t('AI parameters applied!', 'AI参数已应用！'));
  };

  // Handle plate solving
  const handlePlateSolve = async () => {
    const imageUrl = starsPreview || starlessPreview;
    if (!imageUrl) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setPlateSolving(true);
    setIdentifiedObject(null);
    try {
      const result = await plateSolveImage(imageUrl);
      setPlateSolveResult(result);
      if (result.success && result.calibration) {
        // Try to identify the celestial object from coordinates
        const identified = identifyDeepSkyObject(
          result.calibration.ra, 
          result.calibration.dec,
          result.calibration.radius
        );
        if (identified) {
          setIdentifiedObject(identified);
          toast.success(t(`Identified: ${identified.commonName || identified.name}`, `已识别: ${identified.commonName || identified.name}`));
        } else if (result.objectsInField && result.objectsInField.length > 0) {
          // Use Astrometry.net's identified objects
          setIdentifiedObject({
            name: result.objectsInField[0],
            type: 'unknown'
          });
          toast.success(t('Plate solve complete!', '星图解析完成！'));
        } else {
          toast.success(t('Plate solve complete!', '星图解析完成！'));
        }
      } else {
        toast.error(result.error || t('Plate solve failed', '星图解析失败'));
      }
    } catch (error) {
      console.error('Plate solve error:', error);
      toast.error(t('Failed to plate solve image', '星图解析失败'));
    } finally {
      setPlateSolving(false);
    }
  };

  // Apply plate solve based displacement (uses distance for accurate parallax)
  const applyPlateSolveDisplacement = () => {
    if (!identifiedObject?.distanceLY) {
      toast.error(t('No distance information available', '无距离信息'));
      return;
    }
    
    const suggested = calculateSuggestedDisplacement(identifiedObject.distanceLY);
    setDisplacementAmount(suggested.starless);
    setStarsDisplacementAmount(suggested.stars);
    
    // Also set object type based on identified object
    if (identifiedObject.type === 'galaxy') {
      setParams(prev => ({ ...prev, objectType: 'galaxy' }));
    } else if (identifiedObject.type === 'planetary') {
      setParams(prev => ({ ...prev, objectType: 'planetary' }));
    } else if (identifiedObject.type === 'nebula' || identifiedObject.type === 'dark_nebula') {
      setParams(prev => ({ ...prev, objectType: 'nebula' }));
    } else {
      setParams(prev => ({ ...prev, objectType: 'mixed' }));
    }
    
    toast.success(t(`Displacement set based on ${identifiedObject.distanceLY.toLocaleString()} LY distance`, `已根据 ${identifiedObject.distanceLY.toLocaleString()} 光年距离设置位移`));
  };

  const validateImageFile = (file: File): boolean => {
    const supportedFormats = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/tiff', 'image/tif'  // Added TIFF support
    ];
    
    return supportedFormats.some(format => file.type.startsWith(format)) || 
           !!file.name.toLowerCase().match(/\.(tiff?|cr2|nef|arw|dng|raw|orf|rw2|pef)$/);
  };

  const isTiffFile = (file: File): boolean => {
    return file.type === 'image/tiff' || file.type === 'image/tif' || 
           !!file.name.toLowerCase().match(/\.tiff?$/);
  };

  // Generate red-blue anaglyph from left and right stereo views
  const generateAnaglyphImage = (leftData: ImageData, rightData: ImageData): ImageData => {
    const width = leftData.width;
    const height = leftData.height;
    const anaglyphData = new ImageData(width, height);
    
    for (let i = 0; i < leftData.data.length; i += 4) {
      // Red channel from left image
      anaglyphData.data[i] = leftData.data[i];
      // Green and blue channels from right image
      anaglyphData.data[i + 1] = rightData.data[i + 1];
      anaglyphData.data[i + 2] = rightData.data[i + 2];
      // Alpha channel
      anaglyphData.data[i + 3] = 255;
    }
    
    return anaglyphData;
  };

  // Generate lenticular interlaced image from left and right stereo views
  const generateLenticularImage = (leftData: ImageData, rightData: ImageData, lpi: number): ImageData => {
    const width = leftData.width;
    const height = leftData.height;
    const lenticularData = new ImageData(width, height);
    
    // Calculate stripe width based on LPI (assuming 300 DPI output)
    const dpi = 300;
    const stripeWidth = Math.max(1, Math.round(dpi / lpi));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Alternate between left and right based on vertical stripes
        const stripeIndex = Math.floor(x / stripeWidth);
        const sourceData = (stripeIndex % 2 === 0) ? leftData : rightData;
        
        lenticularData.data[idx] = sourceData.data[idx];
        lenticularData.data[idx + 1] = sourceData.data[idx + 1];
        lenticularData.data[idx + 2] = sourceData.data[idx + 2];
        lenticularData.data[idx + 3] = 255;
      }
    }
    
    return lenticularData;
  };

  // Generate RealD 3D (half side-by-side) format for polarized 3D displays
  const generateRealD3DImage = (leftCanvas: HTMLCanvasElement, rightCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const width = leftCanvas.width;
    const height = leftCanvas.height;
    
    // RealD format: half-width side-by-side (each eye squeezed to half width)
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width; // Total width same as original
    resultCanvas.height = height;
    const ctx = resultCanvas.getContext('2d')!;
    
    // Draw left eye squeezed to left half
    ctx.drawImage(leftCanvas, 0, 0, width, height, 0, 0, width / 2, height);
    // Draw right eye squeezed to right half
    ctx.drawImage(rightCanvas, 0, 0, width, height, width / 2, 0, width / 2, height);
    
    return resultCanvas;
  };

  const convertTiffToDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const ifds = UTIF.decode(buffer);
          UTIF.decodeImage(buffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);
          
          let targetWidth = ifds[0].width;
          let targetHeight = ifds[0].height;
          
          // For very large TIFF images, downscale during loading to prevent browser crashes
          // Browser canvas limits are typically around 16384x16384 or ~268M pixels total
          const MAX_PREVIEW_DIM = 6000; // More conservative for preview generation
          const totalPixels = targetWidth * targetHeight;
          const MAX_PIXELS = 36000000; // 36M pixels max (6000x6000)
          
          let scaleFactor = 1;
          if (targetWidth > MAX_PREVIEW_DIM || targetHeight > MAX_PREVIEW_DIM || totalPixels > MAX_PIXELS) {
            const dimScale = MAX_PREVIEW_DIM / Math.max(targetWidth, targetHeight);
            const pixelScale = Math.sqrt(MAX_PIXELS / totalPixels);
            scaleFactor = Math.min(dimScale, pixelScale);
            console.log(`📐 Large TIFF detected: ${targetWidth}x${targetHeight} (${(totalPixels/1000000).toFixed(1)}M pixels), scaling to ${(scaleFactor * 100).toFixed(1)}%`);
          }
          
          // Create source canvas with original dimensions
          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = ifds[0].width;
          sourceCanvas.height = ifds[0].height;
          const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
          
          if (!sourceCtx) {
            throw new Error(`Canvas context creation failed for ${ifds[0].width}x${ifds[0].height} TIFF`);
          }
          
          const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
          sourceCtx.putImageData(imageData, 0, 0);
          
          // If scaling needed, create smaller output canvas
          if (scaleFactor < 1) {
            const scaledWidth = Math.round(ifds[0].width * scaleFactor);
            const scaledHeight = Math.round(ifds[0].height * scaleFactor);
            
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = scaledWidth;
            scaledCanvas.height = scaledHeight;
            const scaledCtx = scaledCanvas.getContext('2d');
            
            if (!scaledCtx) {
              throw new Error(`Scaled canvas context creation failed`);
            }
            
            scaledCtx.drawImage(sourceCanvas, 0, 0, scaledWidth, scaledHeight);
            
            // Free source canvas memory
            sourceCanvas.width = 0;
            sourceCanvas.height = 0;
            
            resolve(scaledCanvas.toDataURL('image/jpeg', 0.92)); // Use JPEG for smaller size
          } else {
            resolve(sourceCanvas.toDataURL());
          }
        } catch (error) {
          console.error('TIFF conversion error:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const createPreviewUrl = async (file: File): Promise<string> => {
    if (isTiffFile(file)) {
      return await convertTiffToDataURL(file);
    }
    
    // For large non-TIFF images, use URL.createObjectURL but we'll handle
    // scaling during the actual processing step
    return URL.createObjectURL(file);
  };

  // Helper function to scale large standard images during loading
  const loadAndScaleImage = async (file: File, url: string): Promise<{ img: HTMLImageElement; scaledUrl: string }> => {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
    
    const MAX_PREVIEW_DIM = 6000;
    const MAX_PIXELS = 36000000;
    const totalPixels = img.width * img.height;
    
    // Check if scaling is needed
    if (img.width <= MAX_PREVIEW_DIM && img.height <= MAX_PREVIEW_DIM && totalPixels <= MAX_PIXELS) {
      return { img, scaledUrl: url };
    }
    
    // Scale down large images
    const dimScale = MAX_PREVIEW_DIM / Math.max(img.width, img.height);
    const pixelScale = Math.sqrt(MAX_PIXELS / totalPixels);
    const scaleFactor = Math.min(dimScale, pixelScale);
    
    const scaledWidth = Math.round(img.width * scaleFactor);
    const scaledHeight = Math.round(img.height * scaleFactor);
    
    console.log(`📐 Large image detected: ${img.width}x${img.height} (${(totalPixels/1000000).toFixed(1)}M pixels), scaling to ${scaledWidth}x${scaledHeight}`);
    
    const canvas = document.createElement('canvas');
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context creation failed for scaling');
    }
    
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
    const scaledUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    // Create new image element with scaled data
    const scaledImg = new Image();
    await new Promise<void>((resolve, reject) => {
      scaledImg.onload = () => resolve();
      scaledImg.onerror = () => reject(new Error('Scaled image load failed'));
      scaledImg.src = scaledUrl;
    });
    
    // Free original URL if it was a blob URL
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    
    return { img: scaledImg, scaledUrl };
  };

  const handleStarlessImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      console.error('Invalid starless image file format');
      if (starlessInputRef.current) starlessInputRef.current.value = '';
      return;
    }

    try {
      // Show upload progress
      setUploadProgress(prev => ({
        ...prev,
        starless: { show: true, progress: 0, fileName: file.name }
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          starless: { 
            ...prev.starless, 
            progress: Math.min(prev.starless.progress + 15, 85) 
          }
        }));
      }, 200);

      setProgressText(t('Loading large image, please wait...', '加载大图像，请稍候...'));
      
      const url = await createPreviewUrl(file);
      
      // Scale if needed (handles very large images)
      const { img, scaledUrl } = await loadAndScaleImage(file, url);

      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        starless: { ...prev.starless, progress: 100 }
      }));

      setStarlessImage(file);
      setStarlessPreview(scaledUrl);
      setStarlessElement(img);
      setResultUrl(null);
      setLeftImageUrl(null);
      setRightImageUrl(null);
      setStarlessDepthMapUrl(null);
      setStarsDepthMapUrl(null);

      // Hide progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          starless: { show: false, progress: 0, fileName: '' }
        }));
        setProgressText('');
      }, 1000);
    } catch (error) {
      console.error('Error processing image file:', error);
      setUploadProgress(prev => ({
        ...prev,
        starless: { show: false, progress: 0, fileName: '' }
      }));
      setProgressText('');
      if (starlessInputRef.current) starlessInputRef.current.value = '';
    }
  };

  const handleStarsImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      console.error('Invalid stars-only image file format');
      if (starsInputRef.current) starsInputRef.current.value = '';
      return;
    }

    try {
      // Show upload progress
      setUploadProgress(prev => ({
        ...prev,
        stars: { show: true, progress: 0, fileName: file.name }
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          stars: { 
            ...prev.stars, 
            progress: Math.min(prev.stars.progress + 15, 85) 
          }
        }));
      }, 200);

      setProgressText(t('Loading large image, please wait...', '加载大图像，请稍候...'));
      
      const url = await createPreviewUrl(file);
      
      // Scale if needed (handles very large images)
      const { img, scaledUrl } = await loadAndScaleImage(file, url);

      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        stars: { ...prev.stars, progress: 100 }
      }));

      setStarsImage(file);
      setStarsPreview(scaledUrl);
      setStarsElement(img);
      setResultUrl(null);
      setLeftImageUrl(null);
      setRightImageUrl(null);
      setStarlessDepthMapUrl(null);
      setStarsDepthMapUrl(null);

      // Hide progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          stars: { show: false, progress: 0, fileName: '' }
        }));
        setProgressText('');
      }, 1000);
    } catch (error) {
      console.error('Error processing image file:', error);
      setUploadProgress(prev => ({
        ...prev,
        stars: { show: false, progress: 0, fileName: '' }
      }));
      setProgressText('');
      if (starsInputRef.current) starsInputRef.current.value = '';
    }
  };

  // Generate astrophysically-informed depth map for stars
  const generateStarDepthMap = useCallback((
    imageData: ImageData,
    width: number,
    height: number
  ): ImageData => {
    const data = imageData.data;
    const depthMap = new ImageData(width, height);
    const threshold = 30; // Lower threshold to catch dim background stars
    const minStarSize = 2; // Allow smaller stars
    const maxStarSize = 800; // Allow larger stars with diffraction spikes
    
    interface DetectedStar {
      x: number;
      y: number;
      brightness: number;
      size: number;
      color: { r: number; g: number; b: number };
      maxLuminance: number;
      avgBrightness: number;
      depthScore: number;
      pixels: { x: number; y: number }[];
    }
    
    const detectedStars: DetectedStar[] = [];
    const visited = new Uint8Array(width * height);
    
    // Scan for stars
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        
        const pixelIdx = idx * 4;
        const luminance = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
        
        if (luminance > threshold) {
          // Grow star region
          const starPixels: {x: number, y: number, lum: number, r: number, g: number, b: number}[] = [];
          const queue: {x: number, y: number}[] = [{x, y}];
          visited[idx] = 1;
          
          let minX = x, maxX = x, minY = y, maxY = y;
          let totalLum = 0, maxLum = 0;
          let totalX = 0, totalY = 0;
          let totalR = 0, totalG = 0, totalB = 0;
          
          while (queue.length > 0 && starPixels.length < maxStarSize) {
            const curr = queue.shift()!;
            const currIdx = curr.y * width + curr.x;
            const currPixelIdx = currIdx * 4;
            const currLum = 0.299 * data[currPixelIdx] + 0.587 * data[currPixelIdx + 1] + 0.114 * data[currPixelIdx + 2];
            
            const r = data[currPixelIdx];
            const g = data[currPixelIdx + 1];
            const b = data[currPixelIdx + 2];
            
            starPixels.push({x: curr.x, y: curr.y, lum: currLum, r, g, b});
            totalLum += currLum;
            if (currLum > maxLum) maxLum = currLum;
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            const weight = currLum * currLum;
            totalX += curr.x * weight;
            totalY += curr.y * weight;
            
            minX = Math.min(minX, curr.x);
            maxX = Math.max(maxX, curr.x);
            minY = Math.min(minY, curr.y);
            maxY = Math.max(maxY, curr.y);
            
            // Check neighbors
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = curr.x + dx;
                const ny = curr.y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = ny * width + nx;
                  if (!visited[nIdx]) {
                    const nPixelIdx = nIdx * 4;
                    const nLum = 0.299 * data[nPixelIdx] + 0.587 * data[nPixelIdx + 1] + 0.114 * data[nPixelIdx + 2];
                    
                    // More aggressive expansion for diffraction spikes and halos
                    if (nLum > threshold * 0.15) {
                      visited[nIdx] = 1;
                      queue.push({x: nx, y: ny});
                    }
                  }
                }
              }
            }
          }
          
          if (starPixels.length >= minStarSize && starPixels.length <= maxStarSize) {
            const starWidth = maxX - minX + 1;
            const starHeight = maxY - minY + 1;
            const actualSize = Math.max(starWidth, starHeight);
            
            const avgR = totalR / starPixels.length;
            const avgG = totalG / starPixels.length;
            const avgB = totalB / starPixels.length;
            const avgBrightness = totalLum / starPixels.length;
            
            // Calculate astrophysical depth score
            const colorMax = Math.max(avgR, avgG, avgB, 1);
            const normalizedR = avgR / colorMax;
            const normalizedG = avgG / colorMax;
            const normalizedB = avgB / colorMax;
            
            const colorTemp = (normalizedB - normalizedR + 1) / 2;
            const intrinsicLuminosity = Math.pow(0.5 + colorTemp * 0.5, 3.5);
            
            const normalizedSize = Math.min(actualSize / 50, 1);
            const normalizedLuminance = maxLum / 255;
            const normalizedBrightness = avgBrightness / 255;
            
            const apparentMagnitude = (
              normalizedBrightness * 0.5 +
              normalizedSize * 0.3 +
              normalizedLuminance * 0.2
            );
            
            const estimatedDistance = Math.sqrt(intrinsicLuminosity / (apparentMagnitude + 0.01));
            const baseDepthScore = 1 / (estimatedDistance + 0.1);
            const randomVariation = 0.95 + Math.random() * 0.1;
            const depthScore = baseDepthScore * randomVariation;
            
            detectedStars.push({
              x: Math.round(totalX / starPixels.reduce((sum, p) => sum + p.lum * p.lum, 0)),
              y: Math.round(totalY / starPixels.reduce((sum, p) => sum + p.lum * p.lum, 0)),
              brightness: maxLum / 255,
              size: actualSize,
              color: { r: avgR, g: avgG, b: avgB },
              maxLuminance: maxLum / 255,
              avgBrightness: avgBrightness / 255,
              depthScore,
              pixels: starPixels.map(p => ({ x: p.x, y: p.y }))
            });
          }
        }
      }
    }
    
    // Normalize depth scores
    if (detectedStars.length > 0) {
      const minDepth = Math.min(...detectedStars.map(s => s.depthScore));
      const maxDepth = Math.max(...detectedStars.map(s => s.depthScore));
      const depthRange = maxDepth - minDepth || 1;
      
      console.log(`Detected ${detectedStars.length} stars with astrophysical depth`);
      console.log(`Depth range: ${minDepth.toFixed(3)} to ${maxDepth.toFixed(3)}`);
      
      // Paint depth map with normalized depth values and feathering
      detectedStars.forEach(star => {
        const normalizedDepth = (star.depthScore - minDepth) / depthRange;
        const depthValue = Math.round(normalizedDepth * 255);
        
        // Calculate star center and radius for feathering
        const centerX = star.x;
        const centerY = star.y;
        const maxRadius = Math.max(star.size, 3);
        
        // Paint all pixels with distance-based feathering
        star.pixels.forEach(p => {
          const idx = (p.y * width + p.x) * 4;
          
          // Calculate distance from center for smooth falloff
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = Math.min(distance / maxRadius, 1);
          
          // Apply feathering: full depth at center, blend to background at edges
          const featherFactor = 1 - (normalizedDistance * 0.3); // Keep 70% minimum
          const featheredDepth = Math.round(depthValue * featherFactor);
          
          depthMap.data[idx] = featheredDepth;
          depthMap.data[idx + 1] = featheredDepth;
          depthMap.data[idx + 2] = featheredDepth;
          depthMap.data[idx + 3] = 255;
        });
      });
      
      // Apply Gaussian smoothing to eliminate blocky artifacts
      const smoothedDepth = new ImageData(width, height);
      const radius = 2;
      const sigma = 1.5;
      const kernelSize = radius * 2 + 1;
      const kernel: number[] = [];
      let kernelSum = 0;
      
      // Generate Gaussian kernel
      for (let i = 0; i < kernelSize; i++) {
        const x = i - radius;
        const value = Math.exp(-(x * x) / (2 * sigma * sigma));
        kernel.push(value);
        kernelSum += value;
      }
      
      // Normalize kernel
      for (let i = 0; i < kernelSize; i++) {
        kernel[i] /= kernelSum;
      }
      
      // Apply horizontal blur
      const tempData = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let i = 0; i < kernelSize; i++) {
            const sampleX = x + i - radius;
            if (sampleX >= 0 && sampleX < width) {
              const idx = (y * width + sampleX) * 4;
              if (depthMap.data[idx + 3] > 0) { // Only blur where we have data
                sum += depthMap.data[idx] * kernel[i];
                weightSum += kernel[i];
              }
            }
          }
          
          const idx = (y * width + x) * 4;
          tempData[idx] = weightSum > 0 ? sum / weightSum : depthMap.data[idx];
          tempData[idx + 1] = tempData[idx];
          tempData[idx + 2] = tempData[idx];
          tempData[idx + 3] = 255;
        }
      }
      
      // Apply vertical blur
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let i = 0; i < kernelSize; i++) {
            const sampleY = y + i - radius;
            if (sampleY >= 0 && sampleY < height) {
              const idx = (sampleY * width + x) * 4;
              if (tempData[idx + 3] > 0) {
                sum += tempData[idx] * kernel[i];
                weightSum += kernel[i];
              }
            }
          }
          
          const idx = (y * width + x) * 4;
          smoothedDepth.data[idx] = weightSum > 0 ? sum / weightSum : tempData[idx];
          smoothedDepth.data[idx + 1] = smoothedDepth.data[idx];
          smoothedDepth.data[idx + 2] = smoothedDepth.data[idx];
          smoothedDepth.data[idx + 3] = 255;
        }
      }
      
      return smoothedDepth;
    }
    
    return depthMap;
  }, []);

  const createStereoViews = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    depthMap: ImageData,
    width: number,
    height: number,
    params: ProcessingParams,
    starMask: Uint8ClampedArray,
    customDisplacement?: number,
    invertDirection?: boolean,
    isStarsLayer?: boolean // New parameter to handle stars specially
  ): { left: ImageData; right: ImageData } => {
    const originalData = ctx.getImageData(0, 0, width, height);
    const leftData = new ImageData(width, height);
    const rightData = new ImageData(width, height);

    // Use custom displacement if provided, otherwise use params.maxShift
    const maxShift = customDisplacement !== undefined ? customDisplacement : params.maxShift;
    const directionMultiplier = invertDirection ? -1 : 1;

    // For stars layer: pre-compute smoothed depth map to prevent star deformation
    // This uses a simple uniform depth approach - all bright pixels get similar displacement
    let smoothedDepth: Float32Array | null = null;
    if (isStarsLayer) {
      smoothedDepth = new Float32Array(width * height);
      
      // For stars, use the brightness of the pixel to determine a uniform shift
      // Bright stars should shift uniformly, not be torn apart by depth variations
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const pixelIdx = idx * 4;
          
          // Get pixel brightness
          const r = originalData.data[pixelIdx];
          const g = originalData.data[pixelIdx + 1];
          const b = originalData.data[pixelIdx + 2];
          const brightness = (r + g + b) / 3;
          
          if (brightness > 10) {
            // For visible star pixels, use a uniform depth based on brightness
            // Brighter stars appear "closer" (more displacement)
            // This prevents depth map variations from tearing stars apart
            const normalizedBrightness = Math.min(brightness / 255, 1);
            // Apply a curve to make the displacement more uniform for bright stars
            smoothedDepth[idx] = Math.pow(normalizedBrightness, 0.3); // Gentle curve
          } else {
            // Dark pixels: use original depth (or minimal displacement)
            smoothedDepth[idx] = depthMap.data[pixelIdx] / 255.0 * 0.5;
          }
        }
      }
    }

    // SIMPLE INVERSE MAPPING - Pull pixels from source (prevents gaps and black lines)
    // For each destination pixel, look back to the source and copy the pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        const idx = y * width + x;
        
        // Get depth value - use smoothed depth for stars layer
        let depthValue: number;
        if (isStarsLayer && smoothedDepth) {
          depthValue = smoothedDepth[idx];
        } else {
          depthValue = depthMap.data[destIdx] / 255.0;
        }
        
        // Check if this is a star
        const isStar = params.preserveStarShapes && starMask[y * width + x] === 255;
        
        // Calculate shift amount based on depth
        // Simple approach: deeper objects shift less, closer objects shift more
        const shift = depthValue * maxShift * directionMultiplier;
        
        // LEFT VIEW: Pull from right (shift source to left)
        // When looking at left eye, objects shift left based on depth
        const leftSourceX = Math.round(x + shift);
        
        if (leftSourceX >= 0 && leftSourceX < width) {
          const leftSrcIdx = (y * width + leftSourceX) * 4;
          leftData.data[destIdx] = originalData.data[leftSrcIdx];
          leftData.data[destIdx + 1] = originalData.data[leftSrcIdx + 1];
          leftData.data[destIdx + 2] = originalData.data[leftSrcIdx + 2];
          leftData.data[destIdx + 3] = 255;
        } else {
          // Fill with black if out of bounds
          leftData.data[destIdx] = 0;
          leftData.data[destIdx + 1] = 0;
          leftData.data[destIdx + 2] = 0;
          leftData.data[destIdx + 3] = 255;
        }
        
        // RIGHT VIEW: Pull from left (shift source to right)
        // When looking at right eye, objects shift right based on depth
        const rightSourceX = Math.round(x - shift);
        
        if (rightSourceX >= 0 && rightSourceX < width) {
          const rightSrcIdx = (y * width + rightSourceX) * 4;
          rightData.data[destIdx] = originalData.data[rightSrcIdx];
          rightData.data[destIdx + 1] = originalData.data[rightSrcIdx + 1];
          rightData.data[destIdx + 2] = originalData.data[rightSrcIdx + 2];
          rightData.data[destIdx + 3] = 255;
        } else {
          // Fill with black if out of bounds
          rightData.data[destIdx] = 0;
          rightData.data[destIdx + 1] = 0;
          rightData.data[destIdx + 2] = 0;
          rightData.data[destIdx + 3] = 255;
        }
      }
    }

    return { left: leftData, right: rightData };
  }, []);

  const processUnifiedMode = async () => {
    if (!starlessImage) {
      console.error('Please select at least one image');
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    
    try {
      setProgressText(t('Loading images...', '加载图像...'));
      setProgress(10);
      
      // Load starless image (required)
      const starlessImg = new Image();
      await new Promise((resolve, reject) => {
        starlessImg.onload = resolve;
        starlessImg.onerror = reject;
        starlessImg.src = starlessPreview!;
      });

      // Load stars image if provided (optional)
      let starsImg: HTMLImageElement | null = null;
      if (starsImage && starsPreview) {
        starsImg = new Image();
        await new Promise((resolve, reject) => {
          starsImg!.onload = resolve;
          starsImg!.onerror = reject;
          starsImg!.src = starsPreview!;
        });
      }

      const originalWidth = starsImg ? Math.max(starlessImg.width, starsImg.width) : starlessImg.width;
      const originalHeight = starsImg ? Math.max(starlessImg.height, starsImg.height) : starlessImg.height;
      
      // Handle very large images with intelligent scaling
      // Max dimension of 8000px should handle most astrophotography while preventing crashes
      const MAX_PROCESSING_DIM = 8000;
      let width = originalWidth;
      let height = originalHeight;
      let scaleFactor = 1;
      
      if (originalWidth > MAX_PROCESSING_DIM || originalHeight > MAX_PROCESSING_DIM) {
        scaleFactor = MAX_PROCESSING_DIM / Math.max(originalWidth, originalHeight);
        width = Math.round(originalWidth * scaleFactor);
        height = Math.round(originalHeight * scaleFactor);
        console.log(`🚀 Scaling large image: ${originalWidth}x${originalHeight} -> ${width}x${height} (${(scaleFactor * 100).toFixed(1)}%)`);
        setProgressText(t(`Scaling ${originalWidth}x${originalHeight} image for processing...`, `缩放 ${originalWidth}x${originalHeight} 图像以供处理...`));
      }
      
      // Create canvases with willReadFrequently for better performance
      const starlessCanvas = document.createElement('canvas');
      const starlessCtx = starlessCanvas.getContext('2d', { willReadFrequently: true })!;
      starlessCanvas.width = width;
      starlessCanvas.height = height;
      starlessCtx.drawImage(starlessImg, 0, 0, width, height);
      
      // Yield to UI to prevent freeze on large images
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Create stars canvas if stars image provided
      let starsCanvas: HTMLCanvasElement | null = null;
      let starsCtx: CanvasRenderingContext2D | null = null;
      if (starsImg) {
        starsCanvas = document.createElement('canvas');
        starsCtx = starsCanvas.getContext('2d', { willReadFrequently: true })!;
        starsCanvas.width = width;
        starsCanvas.height = height;
        starsCtx.drawImage(starsImg, 0, 0, width, height);
      }
      
      // Yield to UI
      await new Promise(resolve => setTimeout(resolve, 0));

      // STEP 1: Generate depth map from starless (Fast Mode approach)
      setProgressText(t('Generating depth map...', '生成深度图...'));
      setProgress(25);
      
      const starlessImageData = starlessCtx.getImageData(0, 0, width, height);
      const simpleParams: SimpleDepthParams = {
        depth: params.maxShift,
        edgeWeight: params.edgeWeight,
        brightnessWeight: 1 - params.edgeWeight
      };
      
      const starlessDepthMap = generateSimpleDepthMap(starlessImageData, simpleParams);
      
      // Save starless depth map
      const starlessDepthCanvas = document.createElement('canvas');
      const starlessDepthCtx = starlessDepthCanvas.getContext('2d')!;
      starlessDepthCanvas.width = width;
      starlessDepthCanvas.height = height;
      starlessDepthCtx.putImageData(starlessDepthMap, 0, 0);
      setStarlessDepthMapUrl(starlessDepthCanvas.toDataURL('image/png'));

      // STEP 2: Generate astrophysical depth map for stars if provided
      let starsDepthMap: ImageData | null = null;
      if (starsCanvas && starsCtx) {
        setProgressText(t('Generating astrophysical stars depth map...', '生成天体物理恒星深度图...'));
        setProgress(35);
        
        const starsImageData = starsCtx.getImageData(0, 0, width, height);
        starsDepthMap = generateStarDepthMap(starsImageData, width, height);
        
        // Save stars depth map
        const starsDepthCanvas = document.createElement('canvas');
        const starsDepthCtx = starsDepthCanvas.getContext('2d')!;
        starsDepthCanvas.width = width;
        starsDepthCanvas.height = height;
        starsDepthCtx.putImageData(starsDepthMap, 0, 0);
        setStarsDepthMapUrl(starsDepthCanvas.toDataURL('image/png'));
      }

      // STEP 3: Process starless with its own depth map
      setProgressText(t('Processing displacement...', '处理位移...'));
      setProgress(50);
      
      const starMask = detectStars(starlessImageData.data, width, height, params.starThreshold);
      const invertDisplacement = displacementDirection === 'left';
      
      const { left: starlessLeft, right: starlessRight } = createStereoViews(
        starlessCanvas, 
        starlessCtx, 
        starlessDepthMap, 
        width, 
        height, 
        params, 
        starMask,
        displacementAmount, // Use custom displacement amount
        invertDisplacement  // Apply displacement direction
      );

      // STEP 4: Process stars if provided
      let compositeLeft: ImageData;
      let compositeRight: ImageData;
      
      if (starsCanvas && starsCtx && starsDepthMap) {
        setProgressText(t('Processing astrophysical stars displacement...', '处理天体物理恒星位移...'));
        setProgress(70);
        
        const invertStarsDisplacement = starsDisplacementDirection === 'left';
        const { left: starsLeft, right: starsRight } = createStereoViews(
          starsCanvas, 
          starsCtx, 
          starsDepthMap, // Use astrophysical star depth map
          width, 
          height, 
          params, 
          new Uint8ClampedArray(width * height), // No star masking for stars layer
          starsDisplacementAmount, // Use custom stars displacement amount
          invertStarsDisplacement, // Use stars-specific direction
          true // isStarsLayer - use brightness-based uniform displacement
        );

        // STEP 5: Composite starless + stars for each eye
        setProgressText(t('Compositing layers...', '合成图层...'));
        setProgress(85);
        
        compositeLeft = new ImageData(width, height);
        compositeRight = new ImageData(width, height);
        
        for (let i = 0; i < starlessLeft.data.length; i += 4) {
          // Composite left eye: starless + stars
          compositeLeft.data[i] = Math.min(255, starlessLeft.data[i] + starsLeft.data[i]);
          compositeLeft.data[i + 1] = Math.min(255, starlessLeft.data[i + 1] + starsLeft.data[i + 1]);
          compositeLeft.data[i + 2] = Math.min(255, starlessLeft.data[i + 2] + starsLeft.data[i + 2]);
          compositeLeft.data[i + 3] = 255;
          
          // Composite right eye: starless + stars
          compositeRight.data[i] = Math.min(255, starlessRight.data[i] + starsRight.data[i]);
          compositeRight.data[i + 1] = Math.min(255, starlessRight.data[i + 1] + starsRight.data[i + 1]);
          compositeRight.data[i + 2] = Math.min(255, starlessRight.data[i + 2] + starsRight.data[i + 2]);
          compositeRight.data[i + 3] = 255;
        }
      } else {
        // No stars layer - use starless views as-is
        setProgressText(t('Finalizing stereo views...', '完成立体视图...'));
        setProgress(85);
        compositeLeft = starlessLeft;
        compositeRight = starlessRight;
      }

      // STEP 6: Save individual left and right images
      setProgressText(t('Saving individual images...', '保存单独图像...'));
      setProgress(92);
      
      const leftCanvas = document.createElement('canvas');
      const leftCtx = leftCanvas.getContext('2d')!;
      leftCanvas.width = width;
      leftCanvas.height = height;
      leftCtx.putImageData(compositeLeft, 0, 0);
      setLeftImageUrl(leftCanvas.toDataURL('image/png'));
      
      const rightCanvas = document.createElement('canvas');
      const rightCtx = rightCanvas.getContext('2d')!;
      rightCanvas.width = width;
      rightCanvas.height = height;
      rightCtx.putImageData(compositeRight, 0, 0);
      setRightImageUrl(rightCanvas.toDataURL('image/png'));

      // STEP 7: Generate anaglyph if requested
      if (outputFormat === 'anaglyph' || outputFormat === 'both') {
        setProgressText(t('Generating anaglyph image...', '生成红蓝立体图像...'));
        setProgress(92);
        
        const anaglyphData = generateAnaglyphImage(compositeLeft, compositeRight);
        const anaglyphCanvas = document.createElement('canvas');
        const anaglyphCtx = anaglyphCanvas.getContext('2d')!;
        anaglyphCanvas.width = width;
        anaglyphCanvas.height = height;
        anaglyphCtx.putImageData(anaglyphData, 0, 0);
        setAnaglyphImageUrl(anaglyphCanvas.toDataURL('image/png'));
      }

      // STEP 8: Generate lenticular if requested
      if (outputFormat === 'lenticular' || outputFormat === 'both') {
        setProgressText(t('Generating lenticular image...', '生成光栅立体图像...'));
        setProgress(93);
        
        const lenticularData = generateLenticularImage(compositeLeft, compositeRight, lenticularLPI);
        const lenticularCanvas = document.createElement('canvas');
        const lenticularCtx = lenticularCanvas.getContext('2d')!;
        lenticularCanvas.width = width;
        lenticularCanvas.height = height;
        lenticularCtx.putImageData(lenticularData, 0, 0);
        setLenticularImageUrl(lenticularCanvas.toDataURL('image/png'));
      }

      // STEP 9: Generate RealD 3D (SBS Half) if requested
      if (outputFormat === 'reald3d' || outputFormat === 'both') {
        setProgressText(t('Generating RealD 3D image...', '生成RealD 3D图像...'));
        setProgress(94);
        
        const leftCanvasTemp = document.createElement('canvas');
        leftCanvasTemp.width = width;
        leftCanvasTemp.height = height;
        leftCanvasTemp.getContext('2d')!.putImageData(compositeLeft, 0, 0);
        
        const rightCanvasTemp = document.createElement('canvas');
        rightCanvasTemp.width = width;
        rightCanvasTemp.height = height;
        rightCanvasTemp.getContext('2d')!.putImageData(compositeRight, 0, 0);
        
        const reald3dCanvas = generateRealD3DImage(leftCanvasTemp, rightCanvasTemp);
        setReald3dImageUrl(reald3dCanvas.toDataURL('image/png'));
      }

      // STEP 10: Create final stereo pair if requested
      if (outputFormat === 'stereo' || outputFormat === 'both') {
        setProgressText(t('Creating final stereo pair...', '创建最终立体对...'));
        setProgress(95);

      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d')!;
      
      if (borderSize > 0) {
        const totalWidth = width * 2 + stereoSpacing + (borderSize * 2);
        const totalHeight = height + (borderSize * 2);
        
        resultCanvas.width = totalWidth;
        resultCanvas.height = totalHeight;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(compositeLeft, borderSize, borderSize);
        resultCtx.putImageData(compositeRight, borderSize + width + stereoSpacing, borderSize);
        
        // Add watermark in stereo spacing
        if (stereoSpacing > 20) {
          resultCtx.save();
          resultCtx.fillStyle = '#ffffff';
          resultCtx.font = '18px Georgia, serif';
          resultCtx.textAlign = 'center';
          resultCtx.textBaseline = 'middle';
          const watermarkX = borderSize + width + (stereoSpacing / 2);
          const watermarkY = borderSize + (height / 2);
          resultCtx.translate(watermarkX, watermarkY);
          resultCtx.rotate(-Math.PI / 2);
          resultCtx.fillText("generated by zed_czegh's algorithm", 0, 0);
          resultCtx.restore();
        }
      } else {
        resultCanvas.width = width * 2 + stereoSpacing;
        resultCanvas.height = height;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(compositeLeft, 0, 0);
        resultCtx.putImageData(compositeRight, width + stereoSpacing, 0);
        
        // Add watermark in stereo spacing
        if (stereoSpacing > 20) {
          resultCtx.save();
          resultCtx.fillStyle = '#ffffff';
          resultCtx.font = '18px Georgia, serif';
          resultCtx.textAlign = 'center';
          resultCtx.textBaseline = 'middle';
          const watermarkX = width + (stereoSpacing / 2);
          const watermarkY = height / 2;
          resultCtx.translate(watermarkX, watermarkY);
          resultCtx.rotate(-Math.PI / 2);
          resultCtx.fillText("generated by zed_czegh's algorithm", 0, 0);
          resultCtx.restore();
        }
      }

      setResultUrl(resultCanvas.toDataURL('image/png'));
      } else if (outputFormat === 'anaglyph' || outputFormat === 'lenticular' || outputFormat === 'reald3d') {
        // For non-stereo modes, clear stereo pair
        setResultUrl(null);
      }
      
      setProgress(100);
      setProgressText(t('Processing complete!', '处理完成！'));
      
      // Wait before loading preview to separate the steps
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProgressText(t('Loading preview...', '加载预览...'));
      setProgress(0); // Reset progress for preview loading
      
      // Simulate preview loading progress
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setProgress(100);
      setProgressText(t('Preview ready!', '预览就绪！'));

      // Clear message after a moment
      setTimeout(() => {
        setProgressText('');
      }, 1000);
    } catch (error) {
      console.error('Error processing images:', error);
      setProgressText(t('Error processing images', '处理图像时出错'));
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 3000);
    }
  };

  // Helper to generate descriptive filename with parameters
  const getBaseFilename = () => {
    const starlessName = starlessImage?.name?.replace(/\.[^/.]+$/, '') || 'image';
    const direction = displacementDirection === 'left' ? 'L' : 'R';
    return `${starlessName}_d${displacementAmount}_${direction}`;
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${getBaseFilename()}_stereo-pair.png`;
    link.click();
  };

  const downloadLeftImage = () => {
    if (!leftImageUrl) return;
    
    const link = document.createElement('a');
    link.href = leftImageUrl;
    link.download = `${getBaseFilename()}_left.png`;
    link.click();
  };

  const downloadRightImage = () => {
    if (!rightImageUrl) return;
    
    const link = document.createElement('a');
    link.href = rightImageUrl;
    link.download = `${getBaseFilename()}_right.png`;
    link.click();
  };

  const downloadStarlessDepthMap = () => {
    if (!starlessDepthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = starlessDepthMapUrl;
    link.download = `${getBaseFilename()}_depth-starless.png`;
    link.click();
  };

  const downloadStarsDepthMap = () => {
    if (!starsDepthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = starsDepthMapUrl;
    link.download = `${getBaseFilename()}_depth-stars.png`;
    link.click();
  };

  const downloadAnaglyphImage = () => {
    if (!anaglyphImageUrl) return;
    
    const link = document.createElement('a');
    link.href = anaglyphImageUrl;
    link.download = `${getBaseFilename()}_anaglyph.png`;
    link.click();
  };

  const downloadLenticularImage = () => {
    if (!lenticularImageUrl) return;
    
    const link = document.createElement('a');
    link.href = lenticularImageUrl;
    link.download = `${getBaseFilename()}_lenticular_${lenticularLPI}lpi.png`;
    link.click();
  };

  const downloadRealD3DImage = () => {
    if (!reald3dImageUrl) return;
    
    const link = document.createElement('a');
    link.href = reald3dImageUrl;
    link.download = `${getBaseFilename()}_reald3d_sbs-half.png`;
    link.click();
  };

  const downloadAllFiles = async () => {
    const zip = new JSZip();
    const baseName = getBaseFilename();
    
    // Helper function to convert data URL to blob
    const dataURLtoBlob = (dataurl: string): Blob => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };
    
    // Add stereo pair
    if (resultUrl) {
      zip.file(`${baseName}_stereo-pair.png`, dataURLtoBlob(resultUrl));
    }
    
    // Add left image
    if (leftImageUrl) {
      zip.file(`${baseName}_left.png`, dataURLtoBlob(leftImageUrl));
    }
    
    // Add right image
    if (rightImageUrl) {
      zip.file(`${baseName}_right.png`, dataURLtoBlob(rightImageUrl));
    }
    
    // Add depth maps
    if (starlessDepthMapUrl) {
      zip.file(`${baseName}_depth-starless.png`, dataURLtoBlob(starlessDepthMapUrl));
    }
    
    if (starsDepthMapUrl) {
      zip.file(`${baseName}_depth-stars.png`, dataURLtoBlob(starsDepthMapUrl));
    }
    
    // Add anaglyph image
    if (anaglyphImageUrl) {
      zip.file(`${baseName}_anaglyph.png`, dataURLtoBlob(anaglyphImageUrl));
    }
    
    // Add lenticular image
    if (lenticularImageUrl) {
      zip.file(`${baseName}_lenticular_${lenticularLPI}lpi.png`, dataURLtoBlob(lenticularImageUrl));
    }
    
    // Add RealD 3D image
    if (reald3dImageUrl) {
      zip.file(`${baseName}_reald3d_sbs-half.png`, dataURLtoBlob(reald3dImageUrl));
    }
    
    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}_all-results.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
          <Layers className="h-6 w-6 text-purple-400" />
          <span className="text-xl font-semibold text-white">
            {t('Stereoscope Processor', '立体镜处理器')}
          </span>
        </div>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t('Convert 2D astronomy images into 3D stereo pairs for stereoscopic viewing', '将2D天文图像转换为3D立体对用于立体观看')}
        </p>
      </div>

      {/* Unified Input Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {t('Input Images', '输入图像')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Upload a single image or separate starless and stars-only images', '上传单张图像或分别上传无星和纯星图像')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('Stars Only Image (Optional)', '星点图像（可选）')}
                </Label>
                <input
                  ref={starsInputRef}
                  type="file"
                  accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                  onChange={handleStarsImageSelect}
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
                    disabled={uploadProgress.stars.show || processing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-cosmic-400 group-hover:text-orange-400 transition-colors" />
                      <span className="text-sm text-cosmic-300 group-hover:hidden">
                        {t('Click to upload', '点击上传')}
                      </span>
                      <span className="text-sm text-orange-400 hidden group-hover:block">
                        {t('Stars Only', '星点图像')}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => starsInputRef.current?.click()}>
                    <img
                      src={starsPreview!}
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
                  accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                  onChange={handleStarlessImageSelect}
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
                    disabled={uploadProgress.starless.show || processing}
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
                      src={starlessPreview!}
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
                  {t('Processing Parameters', '处理参数')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Configure stereo spacing and borders', '配置立体间距和边框')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="flex items-center justify-between">
                  <span>{t('Stereo Spacing', '立体间距')}</span>
                  <span className="text-blue-400 font-mono text-lg">({stereoSpacing}px)</span>
                </Label>
                <Slider
                  value={[stereoSpacing]}
                  onValueChange={([value]) => setStereoSpacing(value)}
                  min={0}
                  max={600}
                  step={10}
                  className="mt-2"
                />
                <p className="text-xs text-cosmic-400 mt-1">
                  {t('Gap between left and right stereo images', '左右立体图像之间的间隔')}
                </p>
              </div>

              <div>
                <Label className="flex items-center justify-between">
                  <span>{t('Border Size', '边框大小')}</span>
                  <span className="text-blue-400 font-mono text-lg">({borderSize}px)</span>
                </Label>
                <Slider
                  value={[borderSize]}
                  onValueChange={([value]) => setBorderSize(value)}
                  min={0}
                  max={600}
                  step={25}
                  className="mt-2"
                />
                <p className="text-xs text-cosmic-400 mt-1">
                  {t('Size of black borders around stereo pair', '立体对周围黑色边框的大小')}
                </p>
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-cosmic-900/40 border border-cosmic-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">{t('Displacement Control', '位移控制')}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDisplacementAmount(25);
                      setStarsDisplacementAmount(15);
                      setDisplacementDirection('right');
                      setStarsDisplacementDirection('left');
                    }}
                    className="h-8 gap-2 text-xs bg-cosmic-800/50 hover:bg-cosmic-700/50 border-cosmic-600"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('Reset', '重置')}
                  </Button>
                </div>
                
                {/* Starless Controls - Amber */}
                <div className="space-y-3 p-3 rounded-md bg-amber-950/20 border border-amber-700/30">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                    <span>{t('Starless Layer', '无星图层')}</span>
                  </div>
                  <div>
                    <Label className="flex items-center justify-between">
                      <span className="text-amber-300">{t('Displacement', '位移')}</span>
                      <span className="text-amber-400 font-mono text-lg">({displacementAmount}px)</span>
                    </Label>
                    <Slider
                      value={[displacementAmount]}
                      onValueChange={([value]) => setDisplacementAmount(value)}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-300 mb-2 block text-sm">
                      {t('Direction', '方向')}
                    </Label>
                    <Select
                      value={displacementDirection}
                      onValueChange={(value: 'left' | 'right') => setDisplacementDirection(value)}
                    >
                      <SelectTrigger className="bg-cosmic-800/50 border-amber-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">
                          {t('Right (Standard)', '右（标准）')}
                        </SelectItem>
                        <SelectItem value="left">
                          {t('Left (Inverted)', '左（反转）')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stars Controls - Cyan */}
                <div className="space-y-3 p-3 rounded-md bg-cyan-950/20 border border-cyan-700/30">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium">
                    <span>{t('Stars Layer', '恒星图层')}</span>
                  </div>
                  <div>
                    <Label className="flex items-center justify-between">
                      <span className="text-cyan-300">{t('Displacement', '位移')}</span>
                      <span className="text-cyan-400 font-mono text-lg">({starsDisplacementAmount}px)</span>
                    </Label>
                    <Slider
                      value={[starsDisplacementAmount]}
                      onValueChange={([value]) => setStarsDisplacementAmount(value)}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-cyan-300 mb-2 block text-sm">
                      {t('Direction', '方向')}
                    </Label>
                    <Select
                      value={starsDisplacementDirection}
                      onValueChange={(value: 'left' | 'right') => setStarsDisplacementDirection(value)}
                    >
                      <SelectTrigger className="bg-cosmic-800/50 border-cyan-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">
                          {t('Left (Standard)', '左（标准）')}
                        </SelectItem>
                        <SelectItem value="right">
                          {t('Right (Inverted)', '右（反转）')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Distance-based displacement suggestions - Collapsible */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-auto py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-400">
                          {t('Parallax Reference Guide', '视差参考指南')}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-blue-400 transition-transform group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 mt-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-start gap-2">
                        <div className="text-xs text-cosmic-300 space-y-1 w-full">
                          <p className="font-semibold text-blue-400">
                            {t('Deep Sky Objects:', '深空天体：')}
                          </p>
                          <p>• <span className="text-amber-300">40-50px</span>: {t('Very close nebulae (100-500 ly) - Pleiades, Hyades', '极近星云（100-500光年）- 昴星团、毕星团')}</p>
                          <p>• <span className="text-amber-300">25-40px</span>: {t('Close nebulae (500-1500 ly) - Orion Nebula, Rosette', '近距星云（500-1500光年）- 猎户座星云、玫瑰星云')}</p>
                          <p>• <span className="text-amber-300">15-25px</span>: {t('Mid-range (1500-3000 ly) - Eagle Nebula, Lagoon', '中距（1500-3000光年）- 鹰状星云、礁湖星云')}</p>
                          <p>• <span className="text-amber-300">10-15px</span>: {t('Distant (3000-5000 ly) - Carina Nebula, North America', '远距（3000-5000光年）- 船底座星云、北美洲星云')}</p>
                          <p>• <span className="text-amber-300">5-10px</span>: {t('Very distant (5000+ ly) - Most galaxies, distant clusters', '极远（5000+光年）- 大多数星系、遥远星团')}</p>
                          
                          {/* Planetary distances */}
                          <div className="mt-3 pt-3 border-t border-blue-500/20">
                            <p className="font-semibold text-green-400 mb-1">
                              {t('Solar System (AU):', '太阳系（天文单位）：')}
                            </p>
                            <p className="text-[10px] leading-relaxed">
                              • <span className="text-green-300">Moon: 0.0026 AU</span> • <span className="text-green-300">Mars: 0.5-2.5 AU</span> • <span className="text-green-300">Jupiter: 4-6 AU</span> • <span className="text-green-300">Saturn: 8-11 AU</span> • <span className="text-green-300">Uranus: 18-20 AU</span> • <span className="text-green-300">Neptune: 29-31 AU</span>
                            </p>
                            <p className="text-[10px] text-cosmic-400 mt-1 italic">
                              {t('Note: Please process planetary/solar/lunar images on default settings.', '注：请使用默认设置处理行星/太阳/月球图像。')}
                            </p>
                          </div>
                          
                          {/* Light Years to Pixels Converter */}
                          <div className="mt-3 pt-3 border-t border-blue-500/20">
                            <p className="font-semibold text-blue-400 mb-2">
                              {t('Distance to Parallax Converter:', '距离视差转换器：')}
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="50"
                                max="10000"
                                placeholder={t('Light years', '光年')}
                                className="flex-1 px-2 py-1 bg-cosmic-800/50 border border-cosmic-700/50 rounded text-xs text-cosmic-200 focus:outline-none focus:border-blue-500/50"
                                onChange={(e) => {
                                  const ly = parseFloat(e.target.value);
                                  if (!isNaN(ly) && ly > 0) {
                                    // Scientifically accurate inverse relationship: closer = more parallax
                                    // Using logarithmic scale for better depth distribution
                                    let suggestedPx: number;
                                    if (ly <= 500) {
                                      // Very close: 40-50px (max foreground displacement)
                                      suggestedPx = 50 - ((ly - 100) / 400) * 10;
                                    } else if (ly <= 1500) {
                                      // Close: 25-40px (foreground to mid)
                                      suggestedPx = 40 - ((ly - 500) / 1000) * 15;
                                    } else if (ly <= 3000) {
                                      // Mid-range: 15-25px (middle ground)
                                      suggestedPx = 25 - ((ly - 1500) / 1500) * 10;
                                    } else if (ly <= 5000) {
                                      // Distant: 10-15px (background)
                                      suggestedPx = 15 - ((ly - 3000) / 2000) * 5;
                                    } else {
                                      // Very distant: 5-10px (far background, logarithmic falloff)
                                      const logFactor = Math.log10(ly / 5000);
                                      suggestedPx = Math.max(5, 10 - logFactor * 5);
                                    }
                                    const resultElement = e.target.nextElementSibling;
                                    if (resultElement) {
                                      resultElement.textContent = `≈ ${Math.round(suggestedPx)}px`;
                                    }
                                  }
                                }}
                              />
                              <span className="text-amber-300 font-mono min-w-[60px]">≈ 0px</span>
                            </div>
                            <p className="text-[10px] text-cosmic-400 mt-1 italic">
                              {t('Based on inverse distance-parallax relationship', '基于距离-视差反比关系')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Target Search (SIMBAD) */}
                <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-sky-950/30 to-blue-950/30 border border-sky-500/30">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-sky-400">
                      {t('Target Search (SIMBAD)', '目标搜索 (SIMBAD)')}
                    </span>
                  </div>
                  
                  <p className="text-xs text-cosmic-400">
                    {t('Search by name (M42, NGC 7000, Orion Nebula, etc.)', '按名称搜索（M42、NGC 7000、猎户座星云等）')}
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      value={targetSearchQuery}
                      onChange={(e) => setTargetSearchQuery(e.target.value)}
                      placeholder={t('Enter target name...', '输入目标名称...')}
                      className="flex-1 bg-cosmic-800/50 border-sky-700/50 text-cosmic-100 placeholder:text-cosmic-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTargetSearch();
                        }
                      }}
                    />
                    <Button
                      onClick={handleTargetSearch}
                      disabled={targetSearching || !targetSearchQuery.trim()}
                      size="sm"
                      className="bg-sky-600/80 hover:bg-sky-500/80 text-white"
                    >
                      {targetSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {targetSearchResult && (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-cosmic-800/50 border border-sky-500/20">
                        <p className="text-sm font-medium text-sky-300">
                          {targetSearchResult.name}
                        </p>
                        {targetSearchResult.objectType && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {targetSearchResult.objectType}
                          </span>
                        )}
                        <div className="text-xs text-cosmic-400 mt-2 space-y-1">
                          <p>
                            <span className="text-sky-400">RA:</span>{' '}
                            {formatRA(targetSearchResult.ra)}
                          </p>
                          <p>
                            <span className="text-sky-400">Dec:</span>{' '}
                            {formatDec(targetSearchResult.dec)}
                          </p>
                          {targetSearchResult.distance && (
                            <p className="text-teal-300">
                              <span className="text-sky-400">{t('Distance:', '距离：')}</span>{' '}
                              {targetSearchResult.distance.value.toLocaleString()} {targetSearchResult.distance.unit}
                              <span className="text-cosmic-500 ml-1">({targetSearchResult.distance.source})</span>
                            </p>
                          )}
                        </div>
                        {targetSearchResult.aliases && targetSearchResult.aliases.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {targetSearchResult.aliases.slice(0, 4).map((alias, i) => (
                              <span 
                                key={i}
                                className="px-1.5 py-0.5 text-[9px] rounded bg-cosmic-700/30 text-cosmic-400 border border-cosmic-600/30"
                              >
                                {alias}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* AI Analysis Results */}
                      {aiAnalysisResult && useAiParams && (
                        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400">
                              {t('AI Parameters Applied', 'AI参数已应用')}
                            </span>
                          </div>
                          <div className="text-xs text-cosmic-300 space-y-1">
                            <p>{t('Starless:', '无星：')} <span className="text-amber-400">{displacementAmount}px</span></p>
                            <p>{t('Stars:', '恒星：')} <span className="text-cyan-400">{starsDisplacementAmount}px</span></p>
                            <p>{t('Type:', '类型：')} <span className="text-violet-400 capitalize">{params.objectType}</span></p>
                          </div>
                        </div>
                      )}
                      
                      {!aiAnalysisResult ? (
                        <Button
                          onClick={handleAiAnalysisWithTargetData}
                          disabled={aiAnalyzing || (!starlessPreview && !starsPreview)}
                          className="w-full bg-violet-600/80 hover:bg-violet-500/80 text-white"
                          size="sm"
                        >
                          {aiAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('Analyzing...', '分析中...')}
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              {t('Analyze with AI', '使用AI分析')}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setAiAnalysisResult(null);
                            setUseAiParams(false);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-2" />
                          {t('Re-analyze', '重新分析')}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          setTargetSearchResult(null);
                          setTargetSearchQuery('');
                          setAiAnalysisResult(null);
                          setUseAiParams(false);
                          setIdentifiedObject(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-2" />
                        {t('Search Another', '搜索其他')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Plate Solve Section */}
                <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-orange-950/30 to-amber-950/30 border border-orange-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-orange-400">
                        {t('Plate Solve (Astrometry.net)', '星图解析 (Astrometry.net)')}
                      </span>
                    </div>
                    <Switch
                      checked={plateSolveEnabled}
                      onCheckedChange={(checked) => {
                        setPlateSolveEnabled(checked);
                        if (!checked) {
                          setPlateSolveResult(null);
                          setIdentifiedObject(null);
                          setAiAnalysisResult(null);
                          setAiAnalysisEnabled(false);
                          setUseAiParams(false);
                        }
                      }}
                    />
                  </div>
                  
                  {plateSolveEnabled && (
                    <div className="space-y-3">
                      <p className="text-xs text-cosmic-400">
                        {t('Precisely identify celestial objects using star pattern matching (10-60s).', '使用星点模式匹配精确识别天体（10-60秒）。')}
                      </p>
                      
                      {!plateSolveResult && (
                        <Button
                          onClick={handlePlateSolve}
                          disabled={plateSolving || (!starlessPreview && !starsPreview)}
                          className="w-full bg-orange-600/80 hover:bg-orange-500/80 text-white"
                          size="sm"
                        >
                          {plateSolving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('Solving...', '解析中...')}
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              {t('Plate Solve', '星图解析')}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {plateSolving && (
                        <p className="text-[10px] text-orange-400 italic">
                          {t('Matching star patterns against Tycho-2 catalog...', '正在与Tycho-2星表进行星点模式匹配...')}
                        </p>
                      )}
                      
                      {plateSolveResult && (
                        <div className="space-y-3">
                          {plateSolveResult.success ? (
                            <>
                              {/* Identified Object - Prominent Display */}
                              {identifiedObject && (
                                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-500/40">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <span className="text-lg font-bold text-emerald-300">
                                      {identifiedObject.commonName || identifiedObject.name}
                                    </span>
                                  </div>
                                  {identifiedObject.commonName && (
                                    <p className="text-xs text-cosmic-400 mb-1">
                                      {t('Catalog:', '目录名：')} {identifiedObject.name}
                                    </p>
                                  )}
                                  {identifiedObject.distanceLY && (
                                    <p className="text-sm text-teal-300">
                                      {t('Distance:', '距离：')} {identifiedObject.distanceLY.toLocaleString()} {t('light years', '光年')}
                                    </p>
                                  )}
                                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 capitalize">
                                    {identifiedObject.type.replace('_', ' ')}
                                  </span>
                                </div>
                              )}

                              {/* Coordinates */}
                              <div className="p-2 rounded bg-cosmic-800/50 border border-orange-500/20">
                                {plateSolveResult.calibration && (
                                  <div className="text-xs text-cosmic-200 space-y-1">
                                    <p>
                                      <span className="text-orange-400 font-medium">RA:</span>{' '}
                                      {formatRA(plateSolveResult.calibration.ra)}
                                    </p>
                                    <p>
                                      <span className="text-orange-400 font-medium">Dec:</span>{' '}
                                      {formatDec(plateSolveResult.calibration.dec)}
                                    </p>
                                    <p>
                                      <span className="text-orange-400 font-medium">{t('Field Radius:', '视场半径：')}</span>{' '}
                                      {plateSolveResult.calibration.radius.toFixed(2)}°
                                    </p>
                                    <p>
                                      <span className="text-orange-400 font-medium">{t('Pixel Scale:', '像素比例：')}</span>{' '}
                                      {plateSolveResult.calibration.pixscale.toFixed(2)} arcsec/px
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Apply Distance-Based Displacement Button */}
                              {identifiedObject?.distanceLY && (
                                <Button
                                  onClick={applyPlateSolveDisplacement}
                                  className="w-full bg-emerald-600/80 hover:bg-emerald-500/80 text-white"
                                  size="sm"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  {t('Apply Distance-Based Displacement', '应用基于距离的位移')}
                                </Button>
                              )}
                              
                              {plateSolveResult.objectsInField.length > 0 && (
                                <div className="p-2 rounded bg-cosmic-800/30 border border-cosmic-700/30">
                                  <p className="text-xs text-cosmic-400 font-medium mb-2">
                                    {t('Additional Objects:', '其他天体：')}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {plateSolveResult.objectsInField.slice(0, 8).map((obj, i) => (
                                      <span 
                                        key={i}
                                        className="px-2 py-0.5 text-[10px] rounded-full bg-cosmic-700/30 text-cosmic-300 border border-cosmic-600/30"
                                      >
                                        {obj}
                                      </span>
                                    ))}
                                    {plateSolveResult.objectsInField.length > 8 && (
                                      <span className="px-2 py-0.5 text-[10px] text-cosmic-400">
                                        +{plateSolveResult.objectsInField.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* AI Star Analysis - Only shown after plate solve success */}
                              <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-violet-950/30 to-purple-950/30 border border-violet-500/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-violet-400" />
                                    <span className="text-sm font-semibold text-violet-400">
                                      {t('AI Analysis (Enhanced)', 'AI分析（增强）')}
                                    </span>
                                  </div>
                                  <Switch
                                    checked={aiAnalysisEnabled}
                                    onCheckedChange={(checked) => {
                                      setAiAnalysisEnabled(checked);
                                      if (!checked) {
                                        setAiAnalysisResult(null);
                                        setUseAiParams(false);
                                      }
                                    }}
                                  />
                                </div>
                                
                                {aiAnalysisEnabled && (
                                  <div className="space-y-3">
                                    <p className="text-xs text-cosmic-400">
                                      {t('AI will use plate solve data to calculate optimal displacement parameters.', 'AI将使用星图解析数据计算最佳位移参数。')}
                                    </p>
                                    
                                    {!aiAnalysisResult && (
                                      <Button
                                        onClick={handleAiAnalysis}
                                        disabled={aiAnalyzing || (!starlessPreview && !starsPreview)}
                                        className="w-full bg-violet-600/80 hover:bg-violet-500/80 text-white"
                                        size="sm"
                                      >
                                        {aiAnalyzing ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t('Analyzing with plate data...', '使用星图数据分析中...')}
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {t('Analyze with Plate Data', '使用星图数据分析')}
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    
                                    {aiAnalysisResult && (
                                      <div className="space-y-3">
                                        <div className="p-2 rounded bg-cosmic-800/50 border border-violet-500/20">
                                          <p className="text-xs text-cosmic-200 mb-2">
                                            <span className="text-violet-400 font-medium">{t('Analysis:', '分析：')}</span>{' '}
                                            {aiAnalysisResult.summary.slice(0, 100)}...
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {aiAnalysisResult.objectClassification.hasNebula && (
                                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                                {t('Nebula', '星云')}
                                              </span>
                                            )}
                                            {aiAnalysisResult.objectClassification.hasGalaxy && (
                                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                {t('Galaxy', '星系')}
                                              </span>
                                            )}
                                            {aiAnalysisResult.objectClassification.hasStarCluster && (
                                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                {t('Star Cluster', '星团')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Apply AI Params Toggle */}
                                        <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-500/30">
                                          <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-medium text-emerald-400">
                                              {t('Use AI Parameters', '使用AI参数')}
                                            </span>
                                          </div>
                                          <Switch
                                            checked={useAiParams}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                applyAiRecommendations();
                                              } else {
                                                setUseAiParams(false);
                                              }
                                            }}
                                          />
                                        </div>
                                        
                                        {useAiParams && (
                                          <p className="text-[10px] text-emerald-400 italic">
                                            {t('AI-recommended displacement values applied. Suggested max shift:', 'AI推荐的位移值已应用。建议最大位移：')}{' '}
                                            {aiAnalysisResult.stereoscopicRecommendations.suggestedMaxShift}px
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                onClick={() => {
                                  setPlateSolveResult(null);
                                  setIdentifiedObject(null);
                                  setAiAnalysisResult(null);
                                  setUseAiParams(false);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-2" />
                                {t('Solve Again', '重新解析')}
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-2 rounded bg-red-950/30 border border-red-500/20">
                                <p className="text-xs text-red-400">
                                  {plateSolveResult.error || t('Plate solve failed', '星图解析失败')}
                                </p>
                              </div>
                              
                              {/* AI Analysis Fallback when plate solve fails */}
                              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-950/30 to-purple-950/30 border border-violet-500/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <Wand2 className="w-4 h-4 text-violet-400" />
                                  <span className="text-sm font-semibold text-violet-400">
                                    {t('AI Analysis (Fallback)', 'AI分析（备选）')}
                                  </span>
                                </div>
                                <p className="text-xs text-cosmic-400 mb-3">
                                  {t('Use AI to estimate displacement parameters from the image directly.', '使用AI直接从图像估算位移参数。')}
                                </p>
                                
                                {!aiAnalysisResult && (
                                  <Button
                                    onClick={handleAiAnalysis}
                                    disabled={aiAnalyzing || (!starlessPreview && !starsPreview)}
                                    className="w-full bg-violet-600/80 hover:bg-violet-500/80 text-white"
                                    size="sm"
                                  >
                                    {aiAnalyzing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('Analyzing...', '分析中...')}
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {t('Analyze with AI', '使用AI分析')}
                                      </>
                                    )}
                                  </Button>
                                )}
                                
                                {aiAnalysisResult && (
                                  <div className="space-y-3">
                                    <div className="p-2 rounded bg-cosmic-800/50 border border-violet-500/20">
                                      <p className="text-xs text-cosmic-200 mb-2">
                                        <span className="text-violet-400 font-medium">{t('Analysis:', '分析：')}</span>{' '}
                                        {aiAnalysisResult.summary.slice(0, 100)}...
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {aiAnalysisResult.objectClassification.hasNebula && (
                                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                            {t('Nebula', '星云')}
                                          </span>
                                        )}
                                        {aiAnalysisResult.objectClassification.hasGalaxy && (
                                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            {t('Galaxy', '星系')}
                                          </span>
                                        )}
                                        {aiAnalysisResult.objectClassification.hasStarCluster && (
                                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                            {t('Star Cluster', '星团')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <Button
                                      onClick={applyAiRecommendations}
                                      className="w-full bg-emerald-600/80 hover:bg-emerald-500/80 text-white"
                                      size="sm"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      {t('Apply AI Recommendations', '应用AI推荐参数')}
                                      <span className="ml-2 text-xs opacity-75">
                                        ({aiAnalysisResult.stereoscopicRecommendations.suggestedMaxShift}px)
                                      </span>
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                onClick={() => {
                                  setPlateSolveResult(null);
                                  setIdentifiedObject(null);
                                  setAiAnalysisResult(null);
                                  setUseAiParams(false);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-2" />
                                {t('Try Plate Solve Again', '重试星图解析')}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-cosmic-300">
                    <span>{progressText}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}

              {/* Output Format Selection */}
              <div className="space-y-2">
                <Label className="text-cosmic-100">
                  {t('Output Format', '输出格式')}
                </Label>
                <Select value={outputFormat} onValueChange={(value: 'stereo' | 'anaglyph' | 'lenticular' | 'reald3d' | 'both') => setOutputFormat(value)}>
                  <SelectTrigger className="w-full bg-cosmic-800/50 border-cosmic-700 text-cosmic-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-800 border-cosmic-700">
                    <SelectItem value="stereo" className="text-cosmic-100">
                      {t('Stereo Pairs', '立体对')}
                    </SelectItem>
                    <SelectItem value="anaglyph" className="text-cosmic-100">
                      {t('Red-Blue Anaglyph', '红蓝立体')}
                    </SelectItem>
                    <SelectItem value="lenticular" className="text-cosmic-100">
                      {t('Lenticular Print', '光栅立体打印')}
                    </SelectItem>
                    <SelectItem value="reald3d" className="text-cosmic-100">
                      {t('RealD 3D (SBS Half)', 'RealD 3D (半宽并排)')}
                    </SelectItem>
                    <SelectItem value="both" className="text-cosmic-100">
                      {t('All Formats', '全部格式')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lenticular LPI Setting */}
              {(outputFormat === 'lenticular' || outputFormat === 'both') && (
                <div className="space-y-2">
                  <Label className="flex items-center justify-between text-cosmic-100">
                    <span>{t('Lenticular LPI', '光栅线密度')}</span>
                    <span className="text-amber-400 font-mono">{lenticularLPI} LPI</span>
                  </Label>
                  <Slider
                    value={[lenticularLPI]}
                    onValueChange={([value]) => setLenticularLPI(value)}
                    min={20}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Lines Per Inch - match your lenticular lens sheet', '每英寸线数 - 匹配您的光栅镜片')}
                  </p>
                </div>
              )}

              <Button
                onClick={processUnifiedMode}
                disabled={!starlessImage || processing}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/20"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {processing ? t('Processing...', '处理中...') : t('Generate 3D Image(s)', '生成3D图像')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {resultUrl && (
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Eye className="h-6 w-6 text-green-400" />
              {t('Stereo Result', '立体结果')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('View your 3D stereoscopic pair. Use cross-eye or parallel viewing technique.', '查看您的3D立体对。使用交叉眼或平行观看技术。')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={resultUrl}
                alt="Stereo Result"
                className="w-full rounded-lg border border-cosmic-700"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Download className="h-4 w-4 mr-2" />
                    {t('Download', '下载')}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-xl z-50">
                  <DropdownMenuItem 
                    onClick={downloadResult}
                    className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    {t('Stereo Pair', '立体对')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={downloadLeftImage}
                    className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Left Image', '左图')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={downloadRightImage}
                    className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Right Image', '右图')}
                  </DropdownMenuItem>
                  {starlessDepthMapUrl && (
                    <DropdownMenuItem 
                      onClick={downloadStarlessDepthMap}
                      className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('Depth Map', '深度图')}
                    </DropdownMenuItem>
                  )}
                  {starsDepthMapUrl && (
                    <DropdownMenuItem 
                      onClick={downloadStarsDepthMap}
                      className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('Stars Depth Map', '恒星深度图')}
                    </DropdownMenuItem>
                  )}
                  {anaglyphImageUrl && (
                    <DropdownMenuItem 
                      onClick={downloadAnaglyphImage}
                      className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                    >
                      <Eye className="h-4 w-4 mr-2 text-red-400" />
                      {t('Anaglyph', '红蓝立体')}
                    </DropdownMenuItem>
                  )}
                  {lenticularImageUrl && (
                    <DropdownMenuItem 
                      onClick={downloadLenticularImage}
                      className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                    >
                      <Layers className="h-4 w-4 mr-2 text-emerald-400" />
                      {t('Lenticular', '光栅立体')}
                    </DropdownMenuItem>
                  )}
                  {reald3dImageUrl && (
                    <DropdownMenuItem 
                      onClick={downloadRealD3DImage}
                      className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-cosmic-100"
                    >
                      <Eye className="h-4 w-4 mr-2 text-blue-400" />
                      {t('RealD 3D', 'RealD 3D')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-cosmic-700" />
                  <DropdownMenuItem 
                    onClick={downloadAllFiles}
                    className="cursor-pointer hover:bg-cosmic-800 focus:bg-cosmic-800 text-emerald-400 font-semibold"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {t('All Files (ZIP)', '所有文件 (ZIP)')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anaglyph Result */}
      {anaglyphImageUrl && (
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Eye className="h-6 w-6 text-red-400" />
              {t('Red-Blue Anaglyph', '红蓝立体图像')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('View with red-cyan 3D glasses for stereoscopic effect.', '使用红蓝3D眼镜观看以获得立体效果。')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={anaglyphImageUrl}
                alt="Red-Blue Anaglyph"
                className="w-full rounded-lg border border-cosmic-700"
              />
              <Button 
                onClick={downloadAnaglyphImage}
                className="w-full bg-gradient-to-r from-red-500 to-cyan-500 hover:from-red-600 hover:to-cyan-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Download Anaglyph', '下载红蓝立体图')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lenticular Result */}
      {lenticularImageUrl && (
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Layers className="h-6 w-6 text-emerald-400" />
              {t('Lenticular Print', '光栅立体打印')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('Print with lenticular lens sheet for glasses-free 3D effect.', '使用光栅镜片打印，无需眼镜即可观看3D效果。')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={lenticularImageUrl}
                alt="Lenticular Print"
                className="w-full rounded-lg border border-cosmic-700"
              />
              <Button 
                onClick={downloadLenticularImage}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Download Lenticular', '下载光栅立体图')} ({lenticularLPI} LPI)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RealD 3D Result */}
      {reald3dImageUrl && (
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Eye className="h-6 w-6 text-blue-400" />
              {t('RealD 3D (SBS Half)', 'RealD 3D（半宽并排）')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('Side-by-side half format for 3D TVs and VR headsets with circular polarization.', '适用于3D电视和VR头显的半宽并排格式。')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={reald3dImageUrl}
                alt="RealD 3D"
                className="w-full rounded-lg border border-cosmic-700"
              />
              <Button 
                onClick={downloadRealD3DImage}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Download RealD 3D', '下载RealD 3D')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StereoscopeProcessor;