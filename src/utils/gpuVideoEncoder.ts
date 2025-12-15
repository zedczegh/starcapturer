/**
 * GPU-Accelerated Video Encoder
 * Provides WebGL-based rendering and hardware-accelerated encoding
 */

export interface GPUEncoderOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  bitrate?: number;
  preferredGPU?: 'default' | 'high-performance' | 'low-power';
}

export interface GPUCapabilities {
  webgl2: boolean;
  offscreenCanvas: boolean;
  hardwareAcceleration: boolean;
  maxTextureSize: number;
  preferredGPU: string;
  renderer: string;
  vendor: string;
}

/**
 * Detect GPU capabilities for optimal rendering
 */
export function detectGPUCapabilities(): GPUCapabilities {
  const capabilities: GPUCapabilities = {
    webgl2: false,
    offscreenCanvas: false,
    hardwareAcceleration: false,
    maxTextureSize: 4096,
    preferredGPU: 'unknown',
    renderer: 'unknown',
    vendor: 'unknown'
  };

  // Test WebGL2 support
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') as WebGL2RenderingContext | null;
  
  if (gl) {
    capabilities.webgl2 = true;
    capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    // Get GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      capabilities.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      capabilities.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      
      // Detect GPU type
      const renderer = capabilities.renderer.toLowerCase();
      if (renderer.includes('nvidia') || renderer.includes('geforce') || renderer.includes('rtx') || renderer.includes('gtx')) {
        capabilities.preferredGPU = 'NVIDIA';
        capabilities.hardwareAcceleration = true;
      } else if (renderer.includes('amd') || renderer.includes('radeon')) {
        capabilities.preferredGPU = 'AMD';
        capabilities.hardwareAcceleration = true;
      } else if (renderer.includes('intel')) {
        capabilities.preferredGPU = 'Intel';
        capabilities.hardwareAcceleration = true;
      } else if (renderer.includes('apple') || renderer.includes('m1') || renderer.includes('m2') || renderer.includes('m3')) {
        capabilities.preferredGPU = 'Apple Silicon';
        capabilities.hardwareAcceleration = true;
      }
    }
  }

  // Test OffscreenCanvas support
  capabilities.offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  return capabilities;
}

/**
 * Create optimized canvas context with GPU preferences
 */
export function createOptimizedContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  preferredGPU: 'default' | 'high-performance' | 'low-power' = 'high-performance'
): CanvasRenderingContext2D | null {
  const contextOptions: CanvasRenderingContext2DSettings = {
    alpha: false,
    desynchronized: true, // Enable GPU-accelerated rendering
    willReadFrequently: false
  };

  // For WebGL power preference
  if ('getContext' in canvas) {
    const ctx = canvas.getContext('2d', contextOptions) as CanvasRenderingContext2D | null;
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    return ctx;
  }

  return null;
}

/**
 * Create WebGL2 context with hardware acceleration
 */
export function createWebGL2Context(
  canvas: HTMLCanvasElement,
  preferredGPU: 'default' | 'high-performance' | 'low-power' = 'high-performance'
): WebGL2RenderingContext | null {
  const contextOptions: WebGLContextAttributes = {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    powerPreference: preferredGPU,
    failIfMajorPerformanceCaveat: false
  };

  return canvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext | null;
}

/**
 * Optimized frame capture using ImageBitmap for GPU-accelerated transfer
 */
export async function captureFrameGPU(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): Promise<ImageBitmap> {
  return createImageBitmap(sourceCanvas, {
    resizeWidth: targetWidth,
    resizeHeight: targetHeight,
    resizeQuality: 'high',
    premultiplyAlpha: 'premultiply',
    colorSpaceConversion: 'none'
  });
}

/**
 * Batch capture frames using GPU for better performance
 */
export async function batchCaptureFramesGPU(
  sourceCanvas: HTMLCanvasElement,
  options: GPUEncoderOptions,
  onFrameRendered: (frameIndex: number, totalFrames: number) => void,
  onProgressUpdate: (progress: number) => void
): Promise<ImageBitmap[]> {
  const { width, height, fps, duration } = options;
  const totalFrames = Math.ceil(duration * fps);
  const frames: ImageBitmap[] = [];

  // Use high-performance context
  const capabilities = detectGPUCapabilities();
  console.log(`GPU Encoder: Using ${capabilities.preferredGPU} (${capabilities.renderer})`);
  console.log(`Max texture size: ${capabilities.maxTextureSize}px`);

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const frameProgress = (frameIndex / (totalFrames - 1)) * 100;
    onProgressUpdate(frameProgress);
    onFrameRendered(frameIndex, totalFrames);

    // Wait for render
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Capture using GPU-accelerated ImageBitmap
    const bitmap = await captureFrameGPU(sourceCanvas, width, height);
    frames.push(bitmap);

    // Yield to prevent UI blocking
    if (frameIndex % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return frames;
}

/**
 * Encode frames using optimized WebM encoder with hardware acceleration hints
 */
export async function encodeFramesGPU(
  frames: ImageBitmap[],
  options: GPUEncoderOptions,
  onProgress: (stage: string, percent: number) => void
): Promise<Blob> {
  const { width, height, fps, bitrate = 50000000 } = options;

  // Create encoding canvas with GPU optimization
  const encodingCanvas = document.createElement('canvas');
  encodingCanvas.width = width;
  encodingCanvas.height = height;
  
  const ctx = createOptimizedContext(encodingCanvas, options.preferredGPU);
  if (!ctx) throw new Error('Failed to create encoding context');

  // Set up MediaRecorder with best available codec
  const stream = encodingCanvas.captureStream(fps);
  
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Start recording
  mediaRecorder.start();

  // Play back frames
  const frameInterval = 1000 / fps;
  
  for (let i = 0; i < frames.length; i++) {
    ctx.drawImage(frames[i], 0, 0, width, height);
    
    onProgress('Encoding', 50 + (i / frames.length) * 50);
    
    await new Promise(resolve => setTimeout(resolve, frameInterval));
  }

  // Stop and finalize
  mediaRecorder.stop();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Cleanup bitmaps
  frames.forEach(bitmap => bitmap.close());

  return new Blob(chunks, { type: mimeType });
}

/**
 * Calculate optimal resolution based on GPU capabilities
 */
export function calculateOptimalResolution(
  sourceWidth: number,
  sourceHeight: number,
  gpuCapabilities: GPUCapabilities,
  targetQuality: 'preview' | '720p' | '1080p' | '4k' = '1080p'
): { width: number; height: number } {
  const maxResolutions = {
    preview: { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };

  const target = maxResolutions[targetQuality];
  
  // Limit by GPU max texture size
  const gpuLimit = Math.min(gpuCapabilities.maxTextureSize, target.width);
  
  // Calculate scaled dimensions
  const aspectRatio = sourceWidth / sourceHeight;
  let width = Math.min(sourceWidth, gpuLimit, target.width);
  let height = Math.round(width / aspectRatio);
  
  if (height > target.height) {
    height = target.height;
    width = Math.round(height * aspectRatio);
  }

  // Ensure even dimensions for video encoding
  width = Math.floor(width / 2) * 2;
  height = Math.floor(height / 2) * 2;

  return { width, height };
}
