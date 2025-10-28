/**
 * Optimized displacement processing for better performance with large images
 */

export interface DisplacementChunk {
  startY: number;
  endY: number;
  width: number;
  height: number;
}

export class OptimizedDisplacementProcessor {
  private static readonly CHUNK_SIZE = 128; // Process in 128px high chunks
  
  /**
   * Apply displacement processing in chunks to prevent UI freezing
   */
  static async applyOptimizedDisplacement(
    source: HTMLImageElement | HTMLCanvasElement,
    depthMaps: { 
      primaryDepth: HTMLCanvasElement; 
      structureDepth: HTMLCanvasElement; 
      edgeDepth: HTMLCanvasElement; 
      combinedDepth: HTMLCanvasElement 
    },
    horizontalAmount: number,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<HTMLCanvasElement> {
    const width = source.width;
    const height = source.height;
    
    // Create working canvas
    const workCanvas = document.createElement('canvas');
    const workCtx = workCanvas.getContext('2d')!;
    workCanvas.width = width;
    workCanvas.height = height;
    workCtx.drawImage(source, 0, 0);
    
    const originalData = workCtx.getImageData(0, 0, width, height);
    
    // Get depth data
    const primaryDepthData = depthMaps.primaryDepth.getContext('2d')!.getImageData(0, 0, width, height);
    const structureDepthData = depthMaps.structureDepth.getContext('2d')!.getImageData(0, 0, width, height);
    const edgeDepthData = depthMaps.edgeDepth.getContext('2d')!.getImageData(0, 0, width, height);
    
    // Create result canvas
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d')!;
    resultCanvas.width = width;
    resultCanvas.height = height;
    
    // Calculate chunks
    const chunks = this.calculateChunks(width, height);
    
    // Process chunks with yielding for UI responsiveness
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkProgress = 90 + (i / chunks.length) * 8;
      
      onProgress?.(`Processing displacement chunk ${i + 1}/${chunks.length}...`, chunkProgress);
      
      // Process this chunk
      const chunkData = this.processChunk(
        chunk, 
        originalData, 
        primaryDepthData, 
        structureDepthData, 
        edgeDepthData, 
        horizontalAmount, 
        width
      );
      
      // Apply chunk to result canvas
      resultCtx.putImageData(chunkData, 0, chunk.startY);
      
      // Yield control every few chunks to prevent freezing
      if (i % 4 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    return resultCanvas;
  }
  
  /**
   * Calculate processing chunks
   */
  private static calculateChunks(width: number, height: number): DisplacementChunk[] {
    const chunks: DisplacementChunk[] = [];
    
    for (let y = 0; y < height; y += this.CHUNK_SIZE) {
      const endY = Math.min(y + this.CHUNK_SIZE, height);
      chunks.push({
        startY: y,
        endY: endY,
        width: width,
        height: endY - y
      });
    }
    
    return chunks;
  }
  
  /**
   * Process a single chunk of the displacement
   */
  private static processChunk(
    chunk: DisplacementChunk,
    originalData: ImageData,
    primaryDepthData: ImageData,
    structureDepthData: ImageData,
    edgeDepthData: ImageData,
    horizontalAmount: number,
    width: number
  ): ImageData {
    const chunkData = new ImageData(width, chunk.height);
    
    for (let y = 0; y < chunk.height; y++) {
      const globalY = chunk.startY + y;
      
      for (let x = 0; x < width; x++) {
        const globalIdx = (globalY * width + x) * 4;
        const chunkIdx = (y * width + x) * 4;
        
        // Multi-layer displacement calculation
        const primaryDepth = primaryDepthData.data[globalIdx] / 255;
        const structureDepth = structureDepthData.data[globalIdx] / 255;
        const edgeDepth = edgeDepthData.data[globalIdx] / 255;
        
        // Calculate base displacement
        const structureInfluence = Math.min(1, structureDepth * 1.5);
        const edgeInfluence = Math.min(1, (1 - edgeDepth) * 1.2);
        
        const baseDisplacement = (primaryDepth - 0.5) * horizontalAmount;
        const structureAdjustment = (structureDepth - 0.5) * horizontalAmount * 0.25 * structureInfluence;
        const edgeAdjustment = (edgeDepth - 0.5) * horizontalAmount * 0.15 * edgeInfluence;
        
        const totalDisplacement = Math.round(baseDisplacement + structureAdjustment + edgeAdjustment);
        
        // Apply displacement with bounds checking
        const srcX = x - totalDisplacement;
        
        if (srcX >= 0 && srcX < width) {
          const clampedSrcX = Math.max(0, Math.min(width - 1, Math.round(srcX)));
          const srcIdx = (globalY * width + clampedSrcX) * 4;
          
          // CRITICAL: Check BOTH target and source luminance to prevent overexposure
          // Target luminance (where we're writing to)
          const targetR = originalData.data[globalIdx];
          const targetG = originalData.data[globalIdx + 1];
          const targetB = originalData.data[globalIdx + 2];
          const targetLuminance = 0.299 * targetR + 0.587 * targetG + 0.114 * targetB;
          
          // Source luminance (where we're pulling from)
          const sourceR = originalData.data[srcIdx];
          const sourceG = originalData.data[srcIdx + 1];
          const sourceB = originalData.data[srcIdx + 2];
          const sourceLuminance = 0.299 * sourceR + 0.587 * sourceG + 0.114 * sourceB;
          
          // Use the MAXIMUM luminance of source and target for protection
          const maxLuminance = Math.max(targetLuminance, sourceLuminance);
          
          // Determine blend factor based on brightness
          let blendFactor = 1.0; // 1.0 = full displaced pixel, 0.0 = original pixel
          
          if (maxLuminance > 200) {
            // Extremely bright areas: use almost entirely original pixel
            blendFactor = 0.05;
          } else if (maxLuminance > 170) {
            // Very bright: minimal displacement
            blendFactor = 0.2;
          } else if (maxLuminance > 140) {
            // Bright: reduced displacement
            blendFactor = 0.5;
          } else if (maxLuminance > 110) {
            // Moderately bright: some protection
            blendFactor = 0.75;
          }
          
          // Blend between original and displaced pixels
          chunkData.data[chunkIdx] = Math.round(targetR * (1 - blendFactor) + sourceR * blendFactor);
          chunkData.data[chunkIdx + 1] = Math.round(targetG * (1 - blendFactor) + sourceG * blendFactor);
          chunkData.data[chunkIdx + 2] = Math.round(targetB * (1 - blendFactor) + sourceB * blendFactor);
          chunkData.data[chunkIdx + 3] = 255;
        } else {
          // Black fill for out-of-bounds pixels
          chunkData.data[chunkIdx] = 0;
          chunkData.data[chunkIdx + 1] = 0;
          chunkData.data[chunkIdx + 2] = 0;
          chunkData.data[chunkIdx + 3] = 255;
        }
      }
    }
    
    return chunkData;
  }
}