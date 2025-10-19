/**
 * Video Encoding Utilities
 * Handles WebM and MP4 video encoding from canvas frames
 */
import { CanvasPool } from '@/lib/performance/CanvasPool';

export interface VideoEncodingOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  bitrate?: number;
  maxResolution?: { width: number; height: number };
}

export interface EncodingProgress {
  stage: string;
  percent: number;
  currentFrame?: number;
  totalFrames?: number;
}

/**
 * Calculate optimal recording dimensions
 */
export function calculateRecordingDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): { width: number; height: number; scale: number } {
  let width = sourceWidth;
  let height = sourceHeight;
  let scale = 1;
  
  if (width > maxWidth || height > maxHeight) {
    scale = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  
  return { width, height, scale };
}

/**
 * Capture frames from canvas with controlled progress
 */
export async function captureFrames(
  sourceCanvas: HTMLCanvasElement,
  options: VideoEncodingOptions,
  onFrameRendered: (frameIndex: number, totalFrames: number) => void,
  onProgressUpdate: (progress: number) => void
): Promise<ImageData[]> {
  const { width, height, fps, duration } = options;
  const totalFrames = Math.ceil(duration * fps);
  const frames: ImageData[] = [];
  
  const canvasPool = CanvasPool.getInstance();
  const renderCanvas = canvasPool.acquire(width, height);
  const renderCtx = renderCanvas.getContext('2d', {
    alpha: false,
    willReadFrequently: false
  })!;
  
  renderCtx.imageSmoothingEnabled = false;
  
  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      // Calculate exact progress for this frame
      const frameProgress = (frameIndex / (totalFrames - 1)) * 100;
      
      // Notify caller to update animation progress
      onProgressUpdate(frameProgress);
      
      // Trigger frame render callback
      onFrameRendered(frameIndex, totalFrames);
      
      // Wait for rendering to complete
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Capture frame from source canvas
      renderCtx.fillStyle = '#000000';
      renderCtx.fillRect(0, 0, width, height);
      renderCtx.drawImage(sourceCanvas, 0, 0, width, height);
      
      // Store frame data
      const frameData = renderCtx.getImageData(0, 0, width, height);
      frames.push(frameData);
      
      if ((frameIndex + 1) % 30 === 0) {
        console.log(`Captured ${frameIndex + 1}/${totalFrames} frames`);
      }
    }
    
    return frames;
  } finally {
    canvasPool.release(renderCanvas);
  }
}

/**
 * Encode frames to WebM using MediaRecorder
 */
export async function encodeFramesToWebM(
  frames: ImageData[],
  options: VideoEncodingOptions,
  onProgress: (progress: EncodingProgress) => void
): Promise<Blob> {
  const { width, height, fps, bitrate = 25000000 } = options;
  
  const canvasPool = CanvasPool.getInstance();
  const encodingCanvas = canvasPool.acquire(width, height);
  const encodingCtx = encodingCanvas.getContext('2d')!;
  
  try {
    // Set up MediaRecorder
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
    
    // Play back pre-rendered frames
    const frameInterval = 1000 / fps;
    let currentFrame = 0;
    
    await new Promise<void>((resolve) => {
      const playFrame = () => {
        if (currentFrame >= frames.length) {
          mediaRecorder.stop();
          resolve();
          return;
        }
        
        // Draw frame
        encodingCtx.putImageData(frames[currentFrame], 0, 0);
        currentFrame++;
        
        // Update progress
        onProgress({
          stage: 'Encoding',
          percent: 50 + ((currentFrame / frames.length) * 50),
          currentFrame,
          totalFrames: frames.length
        });
        
        setTimeout(playFrame, frameInterval);
      };
      
      playFrame();
    });
    
    // Wait for final chunks
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create final blob
    const blob = new Blob(chunks, { type: mimeType });
    console.log(`✓ WebM encoded: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    
    return blob;
  } finally {
    canvasPool.release(encodingCanvas);
  }
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get best supported MIME type for MediaRecorder
 */
export function getBestMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'video/webm';
}
