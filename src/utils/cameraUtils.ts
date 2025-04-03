
/**
 * Camera utility functions for capturing and processing images
 */

/**
 * Initialize camera with environment facing mode
 * @returns MediaStream or null if error
 */
export const initializeCamera = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment', 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      }
    });
    
    return stream;
  } catch (err) {
    console.error('Error accessing camera:', err);
    return null;
  }
};

/**
 * Calculate average brightness from image data
 * @param data Raw image data
 * @returns Average brightness value (0-255)
 */
export const calculateAverageBrightness = (data: Uint8ClampedArray): number => {
  let totalBrightness = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Use luminance formula to calculate brightness
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
  }
  
  return totalBrightness / (data.length / 4);
};

/**
 * Draw video frame to canvas
 * @param video Video element
 * @param canvas Canvas element
 * @returns ImageData or null if error
 */
export const captureVideoFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): ImageData | null => {
  try {
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    // Match canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for analysis
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.error('Error capturing video frame:', err);
    return null;
  }
};

/**
 * Stop all tracks in a media stream
 * @param stream MediaStream to stop
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};
