import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, Eye, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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
  // New: star preservation controls
  starParallaxPx: number; // uniform star shift in pixels to preserve roundness
  preserveStarShapes: boolean; // if true, override per-pixel disparity for stars
}

const StereoscopeProcessor: React.FC = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    starParallaxPx: 3,
    preserveStarShapes: true,
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setResultUrl(null);
        setDepthMapUrl(null);
      } else {
        toast.error(t('Please select a valid image file', '请选择有效的图像文件'));
      }
    }
  };

  const generateAstroDepthMap = useCallback((
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: ProcessingParams
  ): { depthMap: ImageData; starMask: Uint8ClampedArray } => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create weighted grayscale using astrophotography-specific weights
    const grayData = new Uint8ClampedArray(width * height);
    const starMask = new Uint8ClampedArray(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Weighted grayscale for astronomy (emphasize different wavelengths)
      const gray = Math.round(
        params.colorChannelWeights.red * r + 
        params.colorChannelWeights.green * g + 
        params.colorChannelWeights.blue * b
      );
      grayData[i / 4] = gray;
      
      // Detect stars (bright point sources)
      const brightness = Math.max(r, g, b);
      starMask[i / 4] = brightness > params.starThreshold ? 255 : 0;
    }

    // Create base depth map based on object type
    const depthData = new Uint8ClampedArray(width * height);
    
    if (params.objectType === 'nebula') {
      // For nebulae: brighter = closer (gas density), darker = farther
      for (let i = 0; i < grayData.length; i++) {
        if (starMask[i] === 255) {
          // Stars stay at infinity (minimal depth)
          depthData[i] = 50;
        } else {
          // Nebula depth based on brightness with boost
          depthData[i] = Math.min(255, grayData[i] * params.nebulaDepthBoost);
        }
      }
    } else if (params.objectType === 'galaxy') {
      // For galaxies: center brighter = closer, spiral arms = varying depth
      for (let i = 0; i < grayData.length; i++) {
        if (starMask[i] === 255) {
          depthData[i] = 30; // Foreground stars
        } else {
          // Galaxy core closer, arms farther
          const y = Math.floor(i / width);
          const x = i % width;
          const centerX = width / 2;
          const centerY = height / 2;
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const normalizedDist = Math.min(1, distFromCenter / (Math.min(width, height) / 2));
          depthData[i] = Math.min(255, grayData[i] * (1.5 - normalizedDist * 0.5));
        }
      }
    } else if (params.objectType === 'planetary') {
      // For planets: center closer, limb farther (spherical shape)
      for (let i = 0; i < grayData.length; i++) {
        const y = Math.floor(i / width);
        const x = i % width;
        const centerX = width / 2;
        const centerY = height / 2;
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const normalizedDist = Math.min(1, distFromCenter / (Math.min(width, height) / 4));
        
        // Spherical depth model
        const sphereDepth = Math.cos(normalizedDist * Math.PI / 2);
        depthData[i] = Math.min(255, grayData[i] * sphereDepth);
      }
    } else { // mixed
      // Standard inversion with star handling
      for (let i = 0; i < grayData.length; i++) {
        if (starMask[i] === 255) {
          depthData[i] = 50;
        } else {
          depthData[i] = 255 - grayData[i];
        }
      }
    }

    // Enhanced edge detection for astrophotography
    const edgeData = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Skip edge detection on stars to preserve point sources
        if (starMask[idx] === 255) {
          edgeData[idx] = 0;
          continue;
        }
        
        // Enhanced Sobel for nebula structures
        const gx = -grayData[idx - width - 1] + grayData[idx - width + 1] +
                  -2 * grayData[idx - 1] + 2 * grayData[idx + 1] +
                  -grayData[idx + width - 1] + grayData[idx + width + 1];
        const gy = -grayData[idx - width - 1] - 2 * grayData[idx - width] - grayData[idx - width + 1] +
                   grayData[idx + width - 1] + 2 * grayData[idx + width] + grayData[idx + width + 1];
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeData[idx] = Math.min(255, magnitude);
      }
    }

    // Combine depth and edges (avoid edges on stars)
    for (let i = 0; i < depthData.length; i++) {
      if (starMask[i] === 255) {
        continue; // Keep stars as-is
      }
      const combinedDepth = (1 - params.edgeWeight) * depthData[i] + 
                           params.edgeWeight * (255 - edgeData[i]);
      depthData[i] = Math.round(combinedDepth);
    }

    // Apply adaptive Gaussian blur (less blur on stars)
    const blurRadius = Math.round(params.blurSigma * 3);
    if (blurRadius > 0) {
      const blurredData = new Uint8ClampedArray(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          
          // Reduce blur on stars
          const effectiveRadius = starMask[idx] === 255 ? 
            Math.max(1, Math.round(blurRadius * 0.3)) : blurRadius;
          
          let sum = 0;
          let count = 0;
          for (let by = -effectiveRadius; by <= effectiveRadius; by++) {
            for (let bx = -effectiveRadius; bx <= effectiveRadius; bx++) {
              const nx = x + bx;
              const ny = y + by;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += depthData[ny * width + nx];
                count++;
              }
            }
          }
          blurredData[idx] = Math.round(sum / count);
        }
      }
      depthData.set(blurredData);
    }

    // Convert to ImageData format
    const depthImageData = new ImageData(width, height);
    for (let i = 0; i < depthData.length; i++) {
      const value = depthData[i];
      depthImageData.data[i * 4] = value;
      depthImageData.data[i * 4 + 1] = value;
      depthImageData.data[i * 4 + 2] = value;
      depthImageData.data[i * 4 + 3] = 255;
    }

    return { depthMap: depthImageData, starMask };
  }, []);

  const createStereoViews = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    depthMap: ImageData,
    width: number,
    height: number,
    params: ProcessingParams,
    starMask: Uint8ClampedArray
  ): { left: ImageData; right: ImageData } => {
    const originalData = ctx.getImageData(0, 0, width, height);
    const leftData = new ImageData(width, height);
    const rightData = new ImageData(width, height);

    // Initialize with black
    leftData.data.fill(0);
    rightData.data.fill(0);
    for (let i = 3; i < leftData.data.length; i += 4) {
      leftData.data[i] = 255; // Alpha
      rightData.data[i] = 255; // Alpha
    }

    // Apply depth-based shifting
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const baseShift = (depthMap.data[idx * 4] / 255.0) * params.maxShift;
        let shift = Math.round(baseShift);
        if (params.preserveStarShapes && starMask[idx] === 255) {
          shift = Math.round(params.starParallaxPx);
        }
        // Left view: shift left (negative x)
        const xLeft = Math.max(0, x - shift);
        if (xLeft >= 0 && xLeft < width) {
          const srcIdx = idx * 4;
          const leftIdx = (y * width + xLeft) * 4;
          leftData.data[leftIdx] = originalData.data[srcIdx];
          leftData.data[leftIdx + 1] = originalData.data[srcIdx + 1];
          leftData.data[leftIdx + 2] = originalData.data[srcIdx + 2];
          leftData.data[leftIdx + 3] = 255;
        }

        // Right view: shift right (positive x)
        const xRight = Math.min(width - 1, x + shift);
        if (xRight >= 0 && xRight < width) {
          const srcIdx = idx * 4;
          const rightIdx = (y * width + xRight) * 4;
          rightData.data[rightIdx] = originalData.data[srcIdx];
          rightData.data[rightIdx + 1] = originalData.data[srcIdx + 1];
          rightData.data[rightIdx + 2] = originalData.data[srcIdx + 2];
          rightData.data[rightIdx + 3] = 255;
        }
      }
    }

    // Simple gap filling by copying from neighbors
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Fill left view gaps
        if (leftData.data[idx] === 0 && leftData.data[idx + 1] === 0 && leftData.data[idx + 2] === 0) {
          const neighbors = [
            ((y - 1) * width + x) * 4,
            ((y + 1) * width + x) * 4,
            (y * width + (x - 1)) * 4,
            (y * width + (x + 1)) * 4
          ];
          
          let r = 0, g = 0, b = 0, count = 0;
          for (const nIdx of neighbors) {
            if (leftData.data[nIdx] > 0 || leftData.data[nIdx + 1] > 0 || leftData.data[nIdx + 2] > 0) {
              r += leftData.data[nIdx];
              g += leftData.data[nIdx + 1];
              b += leftData.data[nIdx + 2];
              count++;
            }
          }
          
          if (count > 0) {
            leftData.data[idx] = r / count;
            leftData.data[idx + 1] = g / count;
            leftData.data[idx + 2] = b / count;
          }
        }
        
        // Fill right view gaps
        if (rightData.data[idx] === 0 && rightData.data[idx + 1] === 0 && rightData.data[idx + 2] === 0) {
          const neighbors = [
            ((y - 1) * width + x) * 4,
            ((y + 1) * width + x) * 4,
            (y * width + (x - 1)) * 4,
            (y * width + (x + 1)) * 4
          ];
          
          let r = 0, g = 0, b = 0, count = 0;
          for (const nIdx of neighbors) {
            if (rightData.data[nIdx] > 0 || rightData.data[nIdx + 1] > 0 || rightData.data[nIdx + 2] > 0) {
              r += rightData.data[nIdx];
              g += rightData.data[nIdx + 1];
              b += rightData.data[nIdx + 2];
              count++;
            }
          }
          
          if (count > 0) {
            rightData.data[idx] = r / count;
            rightData.data[idx + 1] = g / count;
            rightData.data[idx + 2] = b / count;
          }
        }
      }
    }

    return { left: leftData, right: rightData };
  }, []);

  const processImage = async () => {
    if (!selectedImage) return;

    setProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl!;
      });

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { width, height } = canvas;

      // Generate astrophotography depth map
      const { depthMap, starMask } = generateAstroDepthMap(canvas, ctx, width, height, params);
      
      // Create depth map preview
      const depthCanvas = document.createElement('canvas');
      const depthCtx = depthCanvas.getContext('2d')!;
      depthCanvas.width = width;
      depthCanvas.height = height;
      depthCtx.putImageData(depthMap, 0, 0);
      setDepthMapUrl(depthCanvas.toDataURL());

      // Create stereo views
      const { left, right } = createStereoViews(canvas, ctx, depthMap, width, height, params, starMask);

      // Create side-by-side result
      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d')!;
      resultCanvas.width = width * 2;
      resultCanvas.height = height;

      // Draw left and right views
      resultCtx.putImageData(left, 0, 0);
      resultCtx.putImageData(right, width, 0);

      // Apply contrast adjustment
      if (params.contrastAlpha !== 1.0) {
        const resultData = resultCtx.getImageData(0, 0, width * 2, height);
        for (let i = 0; i < resultData.data.length; i += 4) {
          resultData.data[i] = Math.min(255, resultData.data[i] * params.contrastAlpha);
          resultData.data[i + 1] = Math.min(255, resultData.data[i + 1] * params.contrastAlpha);
          resultData.data[i + 2] = Math.min(255, resultData.data[i + 2] * params.contrastAlpha);
        }
        resultCtx.putImageData(resultData, 0, 0);
      }

      setResultUrl(resultCanvas.toDataURL());
      
      toast.success(t('Stereoscope pair generated successfully!', '立体镜对生成成功！'));
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t('Error processing image', '处理图像时出错'));
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `stereoscope-${selectedImage?.name || 'image'}.png`;
    link.click();
  };

  const downloadDepthMap = () => {
    if (!depthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = depthMapUrl;
    link.download = `depth-map-${selectedImage?.name || 'image'}.png`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cosmic-200 bg-clip-text text-transparent mb-4">
            {t('Stereoscope Processor', '立体镜处理器')}
          </h1>
          <p className="text-cosmic-300 text-lg">
            {t('Convert 2D astronomy images into 3D stereo pairs for stereoscopic viewing', '将2D天文图像转换为3D立体对用于立体观看')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('Image Input', '图像输入')}
              </CardTitle>
              <CardDescription>
                {t('Upload a nebula or deep space image to create a stereoscopic pair', '上传星云或深空图像以创建立体对')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('Select Image', '选择图像')}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {previewUrl && (
                  <div className="space-y-2">
                    <Label>{t('Preview', '预览')}</Label>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-cosmic-700"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parameters Section */}
          <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary">
                {t('Processing Parameters', '处理参数')}
              </CardTitle>
              <CardDescription>
                {t('Adjust parameters for optimal stereoscopic effect', '调整参数以获得最佳立体效果')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>{t('Object Type', '天体类型')}</Label>
                  <Select 
                    value={params.objectType} 
                    onValueChange={(value: 'nebula' | 'galaxy' | 'planetary' | 'mixed') => 
                      setParams(prev => ({ ...prev, objectType: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nebula">{t('Nebula', '星云')}</SelectItem>
                      <SelectItem value="galaxy">{t('Galaxy', '星系')}</SelectItem>
                      <SelectItem value="planetary">{t('Planetary', '行星')}</SelectItem>
                      <SelectItem value="mixed">{t('Mixed/Other', '混合/其他')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Optimizes depth mapping for different astronomical objects', '为不同天体优化深度映射')}
                  </p>
                </div>

                <div>
                  <Label>{t('Star Threshold', '恒星阈值')} ({params.starThreshold})</Label>
                  <Slider
                    value={[params.starThreshold]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, starThreshold: value }))}
                    min={150}
                    max={250}
                    step={10}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Brightness threshold for star detection (keeps stars at infinity)', '恒星检测的亮度阈值（保持恒星在无限远处）')}
                  </p>
                </div>

                <div>
                  <Label>{t('Nebula Depth Boost', '星云深度增强')} ({params.nebulaDepthBoost.toFixed(1)})</Label>
                  <Slider
                    value={[params.nebulaDepthBoost * 10]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, nebulaDepthBoost: value / 10 }))}
                    min={10}
                    max={25}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Enhances depth perception in nebula structures', '增强星云结构的深度感知')}
                  </p>
                </div>

                <div>
                  <Label>{t('Color Channel Weights', '颜色通道权重')}</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-xs w-12">R:</span>
                      <Slider
                        value={[params.colorChannelWeights.red * 100]}
                        onValueChange={([value]) => setParams(prev => ({ 
                          ...prev, 
                          colorChannelWeights: { ...prev.colorChannelWeights, red: value / 100 }
                        }))}
                        min={10}
                        max={50}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">{(params.colorChannelWeights.red * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs w-12">G:</span>
                      <Slider
                        value={[params.colorChannelWeights.green * 100]}
                        onValueChange={([value]) => setParams(prev => ({ 
                          ...prev, 
                          colorChannelWeights: { ...prev.colorChannelWeights, green: value / 100 }
                        }))}
                        min={30}
                        max={70}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">{(params.colorChannelWeights.green * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 text-xs w-12">B:</span>
                      <Slider
                        value={[params.colorChannelWeights.blue * 100]}
                        onValueChange={([value]) => setParams(prev => ({ 
                          ...prev, 
                          colorChannelWeights: { ...prev.colorChannelWeights, blue: value / 100 }
                        }))}
                        min={5}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs w-8">{(params.colorChannelWeights.blue * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Weight each color channel for depth calculation (useful for narrowband images)', '为深度计算加权每个颜色通道（对窄带图像有用）')}
                  </p>
                </div>

                <div>
                  <Label>{t('Maximum Shift', '最大偏移')} ({params.maxShift}px)</Label>
                  <Slider
                    value={[params.maxShift]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, maxShift: value }))}
                    min={10}
                    max={60}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Controls the depth separation between left and right views', '控制左右视图之间的深度分离')}
                  </p>
                </div>

                <div>
                  <Label>{t('Edge Weight', '边缘权重')} ({params.edgeWeight.toFixed(1)})</Label>
                  <Slider
                    value={[params.edgeWeight * 10]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, edgeWeight: value / 10 }))}
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Balance between brightness and edge-based depth', '亮度与基于边缘的深度之间的平衡')}
                  </p>
                </div>

                <div>
                  <Label>{t('Blur Sigma', '模糊程度')} ({params.blurSigma.toFixed(1)})</Label>
                  <Slider
                    value={[params.blurSigma * 10]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, blurSigma: value / 10 }))}
                    min={5}
                    max={30}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Smoothness of depth transitions (stars get less blur)', '深度过渡的平滑度（恒星模糊较少）')}
                  </p>
                </div>

                <div>
                  <Label>{t('Contrast', '对比度')} ({params.contrastAlpha.toFixed(1)})</Label>
                  <Slider
                    value={[params.contrastAlpha * 10]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, contrastAlpha: value / 10 }))}
                    min={8}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400 mt-1">
                    {t('Final image contrast adjustment', '最终图像对比度调整')}
                  </p>
                </div>

                <Button
                  onClick={processImage}
                  disabled={!selectedImage || processing}
                  className="w-full"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {processing ? t('Processing...', '处理中...') : t('Generate Stereo Pair', '生成立体对')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {(depthMapUrl || resultUrl) && (
          <div className="mt-8 space-y-6">
            {depthMapUrl && (
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center justify-between">
                    {t('Generated Depth Map', '生成的深度图')}
                    <Button onClick={downloadDepthMap} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('Download', '下载')}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {t('Brighter areas appear closer, darker areas further away. Stars are kept at background depth.', '较亮区域显示更近，较暗区域更远。恒星保持在背景深度。')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <img
                    src={depthMapUrl}
                    alt="Depth Map"
                    className="w-full max-w-2xl mx-auto rounded-lg border border-cosmic-700"
                  />
                </CardContent>
              </Card>
            )}

            {resultUrl && (
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center justify-between">
                    {t('Stereoscopic Result', '立体效果结果')}
                    <Button onClick={downloadResult} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('Download', '下载')}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {t('Side-by-side stereo pair. Use cross-eye viewing or stereo goggles to see the 3D effect', '并排立体对。使用交叉眼观看或立体眼镜查看3D效果')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <img
                    src={resultUrl}
                    alt="Stereoscopic Result"
                    className="w-full rounded-lg border border-cosmic-700"
                  />
                  <div className="mt-4 text-sm text-cosmic-400 bg-cosmic-800/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('Viewing Instructions:', '观看说明：')}</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>{t('Cross-eye method: Cross your eyes until the two images merge into one 3D image', '交叉眼方法：交叉眼睛直到两个图像合并成一个3D图像')}</li>
                      <li>{t('Parallel method: Look "through" the screen as if focusing on something far behind it', '平行方法：看"穿过"屏幕，好像聚焦在屏幕后面的某个东西')}</li>
                      <li>{t('Print on 7×4 inch card with images 65-75mm apart for stereo viewers', '打印在7×4英寸卡片上，图像间距65-75毫米，用于立体观看器')}</li>
                    </ul>
                    <div className="mt-3 p-3 bg-cosmic-700/30 rounded border-l-4 border-primary/50">
                      <p className="font-medium text-cosmic-200 mb-1">{t('About Star Appearance:', '关于恒星外观：')}</p>
                      <p className="text-xs">
                        {t('Stars may look "doubled" or shifted in individual left/right images - this is normal! The 3D effect and proper star alignment only appear when viewed as a stereo pair using the methods above. Stars are intentionally kept at background depth to maintain astronomical realism.', '恒星在单独的左右图像中可能看起来"重影"或偏移 - 这是正常的！3D效果和正确的恒星对齐只有在使用上述方法作为立体对观看时才会出现。恒星被有意保持在背景深度以保持天文真实性。')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StereoscopeProcessor;