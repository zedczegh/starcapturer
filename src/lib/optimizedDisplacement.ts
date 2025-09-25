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
  private static readonly OVERLAP_SIZE = 4; // Overlap between chunks for seamless blending
  
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
      
      // Process this chunk with overlap handling
      const chunkData = this.processChunk(
        chunk, 
        originalData, 
        primaryDepthData, 
        structureDepthData, 
        edgeDepthData, 
        horizontalAmount, 
        width,
        i > 0 // Has previous chunk for blending
      );
      
      // Apply chunk to result canvas with seamless blending
      if (i === 0) {
        // First chunk - direct placement
        resultCtx.putImageData(chunkData, 0, chunk.startY);
      } else {
        // Subsequent chunks - blend overlap region
        this.blendChunkOverlap(resultCtx, chunkData, chunk, width);
      }
      
      // Yield control every few chunks to prevent freezing
      if (i % 4 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    return resultCanvas;
  }
  
  /**
   * Calculate processing chunks with overlap for seamless blending
   */
  private static calculateChunks(width: number, height: number): DisplacementChunk[] {
    const chunks: DisplacementChunk[] = [];
    
    for (let y = 0; y < height; y += this.CHUNK_SIZE) {
      const endY = Math.min(y + this.CHUNK_SIZE, height);
      // Add overlap to all chunks except the first one
      const actualStartY = y === 0 ? y : Math.max(0, y - this.OVERLAP_SIZE);
      const actualHeight = endY - actualStartY;
      
      chunks.push({
        startY: actualStartY,
        endY: endY,
        width: width,
        height: actualHeight
      });
    }
    
    return chunks;
  }
  
  /**
   * Process a single chunk of the displacement with overlap handling
   */
  private static processChunk(
    chunk: DisplacementChunk,
    originalData: ImageData,
    primaryDepthData: ImageData,
    structureDepthData: ImageData,
    edgeDepthData: ImageData,
    horizontalAmount: number,
    width: number,
    hasPrevious: boolean = false
  ): ImageData {
    const chunkData = new ImageData(width, chunk.height);
    
    for (let y = 0; y < chunk.height; y++) {
      const globalY = chunk.startY + y;
      
      for (let x = 0; x < width; x++) {
        const globalIdx = (globalY * width + x) * 4;
        const chunkIdx = (y * width + x) * 4;
        
        // NATURAL displacement calculation - simplified and realistic
        const primaryDepth = primaryDepthData.data[globalIdx] / 255;
        
        // Gentle, natural displacement based primarily on luminance
        // Reduced multipliers for more realistic depth perception
        const naturalDisplacement = (primaryDepth - 0.5) * horizontalAmount * 0.6; // Reduced intensity
        
        // Subtle structure and edge influence for realism
        const structureDepth = structureDepthData.data[globalIdx] / 255;
        const edgeDepth = edgeDepthData.data[globalIdx] / 255;
        
        const structureAdjustment = (structureDepth - 0.5) * horizontalAmount * 0.08; // Much gentler
        const edgeAdjustment = (1 - edgeDepth - 0.5) * horizontalAmount * 0.05; // Subtle edge preservation
        
        // Combined displacement with natural limits
        const totalDisplacement = naturalDisplacement + structureAdjustment + edgeAdjustment;
        
        // Clamp displacement to prevent extreme artifacts
        const clampedDisplacement = Math.max(-horizontalAmount * 0.8, Math.min(horizontalAmount * 0.8, totalDisplacement));
        const finalDisplacement = Math.floor(clampedDisplacement + 0.5);
        
        // Apply natural displacement with bounds checking
        const srcX = x - finalDisplacement;
        
        if (srcX >= 0 && srcX < width) {
          const clampedSrcX = Math.max(0, Math.min(width - 1, srcX));
          const srcIdx = (globalY * width + clampedSrcX) * 4;
          
          chunkData.data[chunkIdx] = originalData.data[srcIdx];
          chunkData.data[chunkIdx + 1] = originalData.data[srcIdx + 1];
          chunkData.data[chunkIdx + 2] = originalData.data[srcIdx + 2];
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
  
  /**
   * Blend chunk overlap region for seamless transitions
   */
  private static blendChunkOverlap(
    resultCtx: CanvasRenderingContext2D,
    chunkData: ImageData,
    chunk: DisplacementChunk,
    width: number
  ): void {
    // Get current canvas data for blending
    const existingData = resultCtx.getImageData(0, chunk.startY, width, chunk.height);
    
    for (let y = 0; y < this.OVERLAP_SIZE && y < chunk.height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Blend factor: 0 at top (keep existing), 1 at bottom (use new)
        const blendFactor = y / (this.OVERLAP_SIZE - 1);
        
        // Linear blend between existing and new pixels
        chunkData.data[idx] = Math.round(
          existingData.data[idx] * (1 - blendFactor) + chunkData.data[idx] * blendFactor
        );
        chunkData.data[idx + 1] = Math.round(
          existingData.data[idx + 1] * (1 - blendFactor) + chunkData.data[idx + 1] * blendFactor
        );
        chunkData.data[idx + 2] = Math.round(
          existingData.data[idx + 2] * (1 - blendFactor) + chunkData.data[idx + 2] * blendFactor
        );
      }
    }
    
    // Apply the blended chunk
    resultCtx.putImageData(chunkData, 0, chunk.startY);
  }
}