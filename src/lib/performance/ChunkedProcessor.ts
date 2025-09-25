/**
 * Chunked Processing for Large Image Data
 * Handles memory-intensive operations by processing data in smaller chunks
 */
export class ChunkedProcessor {
  private static readonly DEFAULT_CHUNK_SIZE = 256 * 256; // 256x256 pixels per chunk
  private static readonly MAX_MEMORY_USAGE = 500 * 1024 * 1024; // 500MB limit

  /**
   * Process image data in chunks to avoid memory issues
   */
  static async processImageInChunks<T>(
    imageData: ImageData,
    processor: (chunk: ImageData, x: number, y: number) => T,
    chunkSize: number = ChunkedProcessor.DEFAULT_CHUNK_SIZE,
    onProgress?: (progress: number) => void
  ): Promise<T[]> {
    const { width, height } = imageData;
    const chunkWidth = Math.min(width, Math.floor(Math.sqrt(chunkSize)));
    const chunkHeight = Math.min(height, Math.floor(chunkSize / chunkWidth));
    
    const results: T[] = [];
    const totalChunks = Math.ceil(width / chunkWidth) * Math.ceil(height / chunkHeight);
    let processedChunks = 0;

    for (let y = 0; y < height; y += chunkHeight) {
      for (let x = 0; x < width; x += chunkWidth) {
        const actualWidth = Math.min(chunkWidth, width - x);
        const actualHeight = Math.min(chunkHeight, height - y);
        
        // Create chunk
        const chunkData = new ImageData(actualWidth, actualHeight);
        
        // Copy data to chunk
        for (let cy = 0; cy < actualHeight; cy++) {
          for (let cx = 0; cx < actualWidth; cx++) {
            const sourceIdx = ((y + cy) * width + (x + cx)) * 4;
            const destIdx = (cy * actualWidth + cx) * 4;
            
            chunkData.data[destIdx] = imageData.data[sourceIdx];
            chunkData.data[destIdx + 1] = imageData.data[sourceIdx + 1];
            chunkData.data[destIdx + 2] = imageData.data[sourceIdx + 2];
            chunkData.data[destIdx + 3] = imageData.data[sourceIdx + 3];
          }
        }
        
        // Process chunk
        const result = processor(chunkData, x, y);
        results.push(result);
        
        processedChunks++;
        if (onProgress) {
          onProgress((processedChunks / totalChunks) * 100);
        }
        
        // Yield control occasionally for UI responsiveness
        if (processedChunks % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
    }

    return results;
  }

  /**
   * Process displacement in chunks to handle large images
   */
  static async processDisplacementChunked(
    source: HTMLCanvasElement,
    depthMap: HTMLCanvasElement,
    horizontalAmount: number,
    onProgress?: (step: string, progress: number) => void
  ): Promise<HTMLCanvasElement> {
    const width = source.width;
    const height = source.height;
    
    // Calculate optimal chunk size based on available memory
    const estimatedMemoryPerPixel = 16; // 4 bytes * 4 (source, depth, temp, result)
    const availableMemory = ChunkedProcessor.MAX_MEMORY_USAGE;
    const maxPixelsPerChunk = Math.floor(availableMemory / estimatedMemoryPerPixel);
    const chunkHeight = Math.min(height, Math.floor(Math.sqrt(maxPixelsPerChunk * height / width)));
    
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    const resultCtx = result.getContext('2d')!;
    
    const sourceCtx = source.getContext('2d')!;
    const depthCtx = depthMap.getContext('2d')!;
    
    const totalChunks = Math.ceil(height / chunkHeight);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const yStart = chunkIndex * chunkHeight;
      const actualHeight = Math.min(chunkHeight, height - yStart);
      
      onProgress?.(`Processing displacement chunk ${chunkIndex + 1}/${totalChunks}...`, 90 + (chunkIndex / totalChunks) * 8);
      
      // Get source and depth data for this chunk
      const sourceData = sourceCtx.getImageData(0, yStart, width, actualHeight);
      const depthData = depthCtx.getImageData(0, yStart, width, actualHeight);
      
      // Process displacement for this chunk
      const displacedData = ChunkedProcessor.processChunkDisplacement(
        sourceData, depthData, horizontalAmount, width
      );
      
      // Put processed data back
      resultCtx.putImageData(displacedData, 0, yStart);
      
      // Yield control for UI responsiveness
      if (chunkIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    return result;
  }

  /**
   * Process displacement for a single chunk
   */
  private static processChunkDisplacement(
    sourceData: ImageData,
    depthData: ImageData,
    horizontalAmount: number,
    fullWidth: number
  ): ImageData {
    const { width, height } = sourceData;
    const resultData = new ImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const depthIdx = idx;
        
        // Calculate displacement based on depth
        const depth = depthData.data[depthIdx] / 255;
        const displacement = Math.round((depth - 0.5) * horizontalAmount);
        
        const sourceX = Math.max(0, Math.min(width - 1, x - displacement));
        const sourceIdx = (y * width + sourceX) * 4;
        
        // Copy pixel with displacement
        resultData.data[idx] = sourceData.data[sourceIdx];
        resultData.data[idx + 1] = sourceData.data[sourceIdx + 1];
        resultData.data[idx + 2] = sourceData.data[sourceIdx + 2];
        resultData.data[idx + 3] = sourceData.data[sourceIdx + 3];
      }
    }
    
    return resultData;
  }

  /**
   * Calculate optimal chunk size based on image dimensions and available memory
   */
  static calculateOptimalChunkSize(width: number, height: number): number {
    const totalPixels = width * height;
    const bytesPerPixel = 16; // Conservative estimate
    const targetMemoryUsage = Math.min(ChunkedProcessor.MAX_MEMORY_USAGE / 4, 100 * 1024 * 1024); // 100MB max per chunk
    
    const maxPixelsPerChunk = targetMemoryUsage / bytesPerPixel;
    
    if (totalPixels <= maxPixelsPerChunk) {
      return totalPixels; // Process entire image at once
    }
    
    // Find a good chunk size that divides evenly
    const idealChunkSize = Math.floor(maxPixelsPerChunk);
    const chunkWidth = Math.min(width, Math.floor(Math.sqrt(idealChunkSize * width / height)));
    return chunkWidth * Math.floor(idealChunkSize / chunkWidth);
  }
}