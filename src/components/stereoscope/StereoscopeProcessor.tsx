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
import { Upload, Eye, Download, Loader2, Layers, Settings2, Sparkles, ChevronDown, Package, RotateCcw, Info } from 'lucide-react';
import { UploadProgress } from '@/components/ui/upload-progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateSimpleDepthMap, detectStars, type SimpleDepthParams } from '@/lib/simpleDepthMap';
import { TraditionalMorphProcessor, type TraditionalInputs, type TraditionalMorphParams } from '@/lib/traditionalMorphMode';
import { NobelPrizeStereoscopeEngine } from '@/lib/advanced/NobelPrizeStereoscopeEngine';
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
  const [outputFormat, setOutputFormat] = useState<'stereo' | 'anaglyph' | 'both'>('stereo');
  
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
  
  // Traditional mode parameters - enhanced for better 3D effect
  const [traditionalParams, setTraditionalParams] = useState<TraditionalMorphParams>({
    horizontalDisplace: 25, // Increased for more nebula depth
    starShiftAmount: 6, // Increased for more dramatic star 3D effect
    luminanceBlur: 1.5,
    contrastBoost: 1.2
  });

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

  const convertTiffToDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const ifds = UTIF.decode(buffer);
          UTIF.decodeImage(buffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);
          
          // Create canvas and draw the TIFF image
          const canvas = document.createElement('canvas');
          canvas.width = ifds[0].width;
          canvas.height = ifds[0].height;
          const ctx = canvas.getContext('2d')!;
          
          const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
          ctx.putImageData(imageData, 0, 0);
          
          resolve(canvas.toDataURL());
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const createPreviewUrl = async (file: File): Promise<string> => {
    if (isTiffFile(file)) {
      return await convertTiffToDataURL(file);
    }
    return URL.createObjectURL(file);
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
            progress: Math.min(prev.starless.progress + 20, 90) 
          }
        }));
      }, 100);

      const url = await createPreviewUrl(file);
      
      // Create image element
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        starless: { ...prev.starless, progress: 100 }
      }));

      setStarlessImage(file);
      setStarlessPreview(url);
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
      }, 1000);
    } catch (error) {
      console.error('Error processing TIFF file:', error);
      setUploadProgress(prev => ({
        ...prev,
        starless: { show: false, progress: 0, fileName: '' }
      }));
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
            progress: Math.min(prev.stars.progress + 20, 90) 
          }
        }));
      }, 100);

      const url = await createPreviewUrl(file);
      
      // Create image element
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        stars: { ...prev.stars, progress: 100 }
      }));

      setStarsImage(file);
      setStarsPreview(url);
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
      }, 1000);
    } catch (error) {
      console.error('Error processing TIFF file:', error);
      setUploadProgress(prev => ({
        ...prev,
        stars: { show: false, progress: 0, fileName: '' }
      }));
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
    invertDirection?: boolean
  ): { left: ImageData; right: ImageData } => {
    const originalData = ctx.getImageData(0, 0, width, height);
    const leftData = new ImageData(width, height);
    const rightData = new ImageData(width, height);

    // Use custom displacement if provided, otherwise use params.maxShift
    const maxShift = customDisplacement !== undefined ? customDisplacement : params.maxShift;
    const directionMultiplier = invertDirection ? -1 : 1;

    // Process in chunks for large images to prevent UI freeze
    const CHUNK_HEIGHT = 256; // Process 256 rows at a time
    const totalPixels = width * height;
    
    // SIMPLE INVERSE MAPPING - Pull pixels from source (prevents gaps and black lines)
    // For each destination pixel, look back to the source and copy the pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        
        // Get depth value at current position
        const depthValue = depthMap.data[destIdx] / 255.0;
        
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
        
        const { left: starsLeft, right: starsRight } = createStereoViews(
          starsCanvas, 
          starsCtx, 
          starsDepthMap, // Use astrophysical star depth map
          width, 
          height, 
          params, 
          new Uint8ClampedArray(width * height), // No star masking for stars layer
          params.starParallaxPx, // Use star parallax displacement
          invertDisplacement // Apply same direction as starless layer
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
        setProgress(94);
        
        const anaglyphData = generateAnaglyphImage(compositeLeft, compositeRight);
        const anaglyphCanvas = document.createElement('canvas');
        const anaglyphCtx = anaglyphCanvas.getContext('2d')!;
        anaglyphCanvas.width = width;
        anaglyphCanvas.height = height;
        anaglyphCtx.putImageData(anaglyphData, 0, 0);
        setAnaglyphImageUrl(anaglyphCanvas.toDataURL('image/png'));
      }

      // STEP 8: Create final stereo pair if requested
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
      } else {
        resultCanvas.width = width * 2 + stereoSpacing;
        resultCanvas.height = height;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(compositeLeft, 0, 0);
        resultCtx.putImageData(compositeRight, width + stereoSpacing, 0);
      }

      setResultUrl(resultCanvas.toDataURL('image/png'));
      } else if (outputFormat === 'anaglyph') {
        // For anaglyph-only mode, clear stereo pair
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
                  <div className="flex items-center gap-2 text-amber-400">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">{t('Starless Displacement Control', '无星图位移控制')}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDisplacementAmount(25);
                      setDisplacementDirection('right');
                    }}
                    className="h-8 gap-2 text-xs bg-cosmic-800/50 hover:bg-cosmic-700/50 border-cosmic-600"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('Reset', '重置')}
                  </Button>
                </div>
                
                <div>
                  <Label className="flex items-center justify-between">
                    <span>{t('Displacement Amount', '位移量')}</span>
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
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Amount of horizontal displacement for starless/nebula image', '无星/星云图像的水平位移量')}
                  </p>
                </div>

                <div>
                  <Label className="text-cosmic-200 mb-2 block">
                    {t('Displacement Direction', '位移方向')}
                  </Label>
                  <Select
                    value={displacementDirection}
                    onValueChange={(value: 'left' | 'right') => setDisplacementDirection(value)}
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
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
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Direction to displace the starless image for 3D effect', '无星图像的位移方向以产生3D效果')}
                  </p>
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
                <Select value={outputFormat} onValueChange={(value: 'stereo' | 'anaglyph' | 'both') => setOutputFormat(value)}>
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
                    <SelectItem value="both" className="text-cosmic-100">
                      {t('Both', '两者都要')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
    </div>
  );
};

export default StereoscopeProcessor;