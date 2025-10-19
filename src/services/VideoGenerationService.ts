/**
 * Internal API Service for 3D Star Field Video Generation
 * Handles the core logic for generating 3D star field animations and video encoding
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { captureFrames, encodeFramesToWebM, calculateRecordingDimensions } from '@/utils/videoEncodingUtils';

export interface VideoGenerationParams {
  sourceCanvas: HTMLCanvasElement;
  duration: number; // in seconds
  fps: number;
  width: number;
  height: number;
  format: 'webm' | 'mp4';
  onProgress?: (progress: { stage: string; percent: number }) => void;
}

export interface MotionSettings {
  motionType: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right';
  speed: number;
  duration: number;
  fieldOfView: number;
  amplification: number;
  spin: number;
  spinDirection: 'clockwise' | 'counterclockwise';
}

export class VideoGenerationService {
  private static ffmpegInstance: FFmpeg | null = null;
  private static ffmpegLoaded: boolean = false;

  /**
   * Initialize FFmpeg instance (lazy loading)
   */
  static async initializeFFmpeg(): Promise<FFmpeg> {
    if (!this.ffmpegInstance) {
      this.ffmpegInstance = new FFmpeg();
      
      this.ffmpegInstance.on('log', ({ message }) => {
        console.log('[FFmpeg]:', message);
      });
    }

    if (!this.ffmpegLoaded) {
      console.log('Loading FFmpeg...');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await this.ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.ffmpegLoaded = true;
      console.log('FFmpeg loaded successfully');
    }

    return this.ffmpegInstance;
  }

  /**
   * Generate video from canvas with frame-by-frame rendering
   */
  static async generateVideo(params: VideoGenerationParams): Promise<Blob> {
    const {
      sourceCanvas,
      duration,
      fps,
      width,
      height,
      format,
      onProgress
    } = params;

    const totalFrames = Math.ceil(duration * fps);

    try {
      // Step 1: Capture frames
      onProgress?.({ stage: 'Capturing frames', percent: 0 });
      
      const frames: ImageData[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const ctx = sourceCanvas.getContext('2d');
        if (ctx) {
          const frame = ctx.getImageData(0, 0, width, height);
          frames.push(frame);
        }
        onProgress?.({ stage: 'Capturing frames', percent: (i / totalFrames) * 40 });
      }

      // Step 2: Encode to WebM
      onProgress?.({ stage: 'Encoding to WebM', percent: 40 });
      
      const webmBlob = await encodeFramesToWebM(
        frames,
        { width, height, fps, duration, bitrate: 8000000 },
        (progress) => {
          onProgress?.({ stage: 'Encoding to WebM', percent: 40 + progress.percent * 0.3 });
        }
      );

      // Step 3: Convert to MP4 if needed
      if (format === 'mp4') {
        onProgress?.({ stage: 'Converting to MP4', percent: 70 });
        const ffmpeg = await this.initializeFFmpeg();
        
        // Set up progress tracking
        ffmpeg.on('progress', ({ progress }) => {
          onProgress?.({ stage: 'Converting to MP4', percent: 70 + progress * 30 });
        });

        // Write WebM to FFmpeg virtual filesystem
        await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

        // Convert to MP4
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          'output.mp4'
        ]);

        // Read the output
        const data = await ffmpeg.readFile('output.mp4');
        const mp4Blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });

        // Clean up
        await ffmpeg.deleteFile('input.webm');
        await ffmpeg.deleteFile('output.mp4');

        onProgress?.({ stage: 'Complete', percent: 100 });
        return mp4Blob;
      }

      onProgress?.({ stage: 'Complete', percent: 100 });
      return webmBlob;

    } catch (error) {
      console.error('Video generation error:', error);
      throw new Error(`Failed to generate video: ${error}`);
    }
  }

  /**
   * Calculate optimal recording dimensions
   */
  static calculateDimensions(
    sourceWidth: number,
    sourceHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number; scale: number } {
    return calculateRecordingDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight);
  }

  /**
   * Download a blob as a file
   */
  static downloadVideo(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
