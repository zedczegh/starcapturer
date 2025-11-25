/**
 * Motion Animation Engine - Simplified Keyframe Approach
 * Creates smooth looping animations by interpolating between 2 keyframes
 * Much more stable than continuous displacement accumulation
 */

interface MotionVector {
  x: number;
  y: number;
  dx: number;
  dy: number;
  strength: number;
}

interface MotionTrail {
  points: { x: number; y: number }[];
}

interface RangePoint {
  x: number;
  y: number;
  radius: number;
}

interface RangeStroke {
  points: { x: number; y: number }[];
  radius: number;
}

interface Keyframe {
  imageData: ImageData;
}

export class MotionAnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sourceImage: HTMLImageElement;
  private originalImageData: ImageData;
  private motionVectors: MotionVector[] = [];
  private motionTrails: MotionTrail[] = [];
  private rangePoints: RangePoint[] = [];
  private rangeStrokes: RangeStroke[] = []; // Store complete strokes for visualization
  private selectionMask: Uint8Array | null = null; // Unified selection mask (0-255 per pixel)
  private animationFrame: number | null = null;
  private isAnimating: boolean = false;
  private maxDisplacement: number = 100; // Configurable max displacement in pixels
  private motionBlurAmount: number = 0.3; // 0 = no blur (always show original), 1 = max blur
  private coreBrightening: boolean = true; // Enable core brightening effect
  private reverseDirection: boolean = false; // Reverse animation direction
  private numKeyframes: number = 12; // Number of keyframes to generate
  
  // Keyframe-based animation
  private keyframes: Keyframe[] = [];
  private currentTime: number = 0;
  private animationDuration: number = 3000; // 3 seconds for full loop

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement, maxDisplacement: number = 100, motionBlurAmount: number = 0.3, coreBrightening: boolean = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
    this.maxDisplacement = maxDisplacement;
    this.motionBlurAmount = motionBlurAmount;
    this.coreBrightening = coreBrightening;
    
    // Store original image data
    this.ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    this.originalImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  addMotionVector(x1: number, y1: number, x2: number, y2: number, strength: number, skipKeyframeGen: boolean = false) {
    this.motionVectors.push({
      x: x1,
      y: y1,
      dx: x2 - x1,
      dy: y2 - y1,
      strength
    });
    
    // Only regenerate keyframes if not batching
    if (!skipKeyframeGen) {
      this.generateKeyframes();
    }
  }

  addMotionTrail(points: { x: number; y: number }[]) {
    this.motionTrails.push({ points });
  }

  addRangePoint(x: number, y: number, radius: number, skipKeyframeGen: boolean = false) {
    this.rangePoints.push({ x, y, radius });
    this.rebuildSelectionMask(); // Update mask
    
    // Only regenerate keyframes if not batching
    if (!skipKeyframeGen) {
      this.generateKeyframes();
    }
  }

  // Add a complete range stroke for visualization
  addRangeStroke(points: { x: number; y: number }[], radius: number) {
    this.rangeStrokes.push({ points, radius });
    this.rebuildSelectionMask(); // Update mask
  }

  removeAtPoint(x: number, y: number, radius: number, skipKeyframeGen: boolean = false) {
    this.motionVectors = this.motionVectors.filter(v => {
      const dist = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
      return dist > radius;
    });

    this.rangePoints = this.rangePoints.filter(r => {
      const dist = Math.sqrt((r.x - x) ** 2 + (r.y - y) ** 2);
      return dist > radius;
    });
    
    this.rebuildSelectionMask(); // Update mask
    
    // Only regenerate keyframes if not batching
    if (!skipKeyframeGen) {
      this.generateKeyframes();
    }
  }

  // Public method to manually trigger keyframe generation (for batch operations)
  public updateKeyframes() {
    this.generateKeyframes();
  }

  // Public method to update displacement amount
  public setMaxDisplacement(amount: number) {
    // Only update the parameter here; actual keyframe regeneration
    // is debounced and controlled from the canvas layer so that
    // slider drags stay responsive without blocking the main thread.
    this.maxDisplacement = amount;
  }
  
  // Public method to update motion blur amount
  public setMotionBlur(amount: number) {
    // Convert 0-100 slider value to 0-1 range
    this.motionBlurAmount = amount / 100;
  }
  
  // Public method to update core brightening
  public setCoreBrightening(enabled: boolean) {
    this.coreBrightening = enabled;
  }

  // Public method to update reverse direction
  public setReverseDirection(enabled: boolean) {
    this.reverseDirection = enabled;
    // Regenerate keyframes when direction changes
    if (this.motionVectors.length > 0 || this.rangePoints.length > 0) {
      this.generateKeyframes();
    }
  }

  // Public method to update number of keyframes
  public setNumKeyframes(amount: number) {
    this.numKeyframes = Math.max(2, Math.min(60, amount)); // Clamp between 2-60
    // Regenerate keyframes when amount changes
    if (this.motionVectors.length > 0 || this.rangePoints.length > 0) {
      this.generateKeyframes();
    }
  }

  clear() {
    this.motionVectors = [];
    this.motionTrails = [];
    this.rangePoints = [];
    this.rangeStrokes = [];
    this.selectionMask = null;
    this.keyframes = [];
    this.currentTime = 0;
    this.stop();
  }

  /**
   * Rebuild the unified selection mask from all range strokes and points
   * Uses canvas rendering for natural, smooth painted regions
   */
  private rebuildSelectionMask() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create or clear mask (0-255 per pixel)
    if (!this.selectionMask) {
      this.selectionMask = new Uint8Array(width * height);
    } else {
      this.selectionMask.fill(0);
    }
    
    // If no selection strokes or points, leave mask empty
    if (this.rangeStrokes.length === 0 && this.rangePoints.length === 0) {
      return;
    }
    
    // Create an offscreen canvas to render the selection mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
    
    // Set up for smooth, anti-aliased drawing
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    maskCtx.fillStyle = 'white';
    maskCtx.strokeStyle = 'white';
    
    // Draw all strokes onto the mask canvas
    for (const stroke of this.rangeStrokes) {
      const { points, radius } = stroke;
      
      if (points.length === 0) continue;
      
      if (points.length === 1) {
        // Single point - draw a circle
        maskCtx.beginPath();
        maskCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
        maskCtx.fill();
      } else {
        // Multiple points - use stroke only for clean single-layer coverage
        // This prevents repeated/overlapping selection that causes animation issues
        maskCtx.lineWidth = radius * 2;
        maskCtx.lineCap = "round";
        maskCtx.lineJoin = "round";
        maskCtx.beginPath();
        maskCtx.moveTo(points[0].x, points[0].y);
        
        // Use smooth curves matching the visual overlay exactly
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          maskCtx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        
        maskCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        maskCtx.stroke();
        
        // Add circles only at endpoints to ensure complete coverage at stroke ends
        maskCtx.beginPath();
        maskCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
        maskCtx.fill();
        
        maskCtx.beginPath();
        maskCtx.arc(points[points.length - 1].x, points[points.length - 1].y, radius, 0, Math.PI * 2);
        maskCtx.fill();
      }
    }
    
    // Draw individual points
    for (const point of this.rangePoints) {
      maskCtx.beginPath();
      maskCtx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      maskCtx.fill();
    }
    
    // Extract the alpha/luminance data from the rendered mask
    const maskImageData = maskCtx.getImageData(0, 0, width, height);
    const maskData = maskImageData.data;
    
    // Convert RGBA to single-channel mask (use red channel since we drew white)
    for (let i = 0; i < width * height; i++) {
      const pixelIndex = i * 4;
      // Use the red channel and alpha for the mask value
      const value = maskData[pixelIndex]; // Red channel
      const alpha = maskData[pixelIndex + 3]; // Alpha channel
      
      // Combine both for proper anti-aliasing
      this.selectionMask[i] = Math.round((value / 255) * (alpha / 255) * 255);
    }
    
    // Apply edge smoothing for even better blending
    this.smoothSelectionEdges();
  }
  
  /**
   * Apply a smoothing pass to selection edges for better blending
   */
  private smoothSelectionEdges() {
    if (!this.selectionMask) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const tempMask = new Uint8Array(this.selectionMask);
    
    // 3x3 box blur for edge smoothing
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Only smooth edge pixels (not fully selected or fully unselected)
        const centerVal = tempMask[idx];
        if (centerVal > 20 && centerVal < 235) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = (y + dy) * width + (x + dx);
              sum += tempMask[nIdx];
              count++;
            }
          }
          
          this.selectionMask[idx] = Math.round(sum / count);
        }
      }
    }
  }

  drawOverlay(overlayCtx: CanvasRenderingContext2D) {
    overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw range strokes as continuous filled paths
    this.rangeStrokes.forEach(stroke => {
      overlayCtx.beginPath();
      
      if (stroke.points.length === 1) {
        // Single point - draw as circle
        overlayCtx.arc(stroke.points[0].x, stroke.points[0].y, stroke.radius, 0, Math.PI * 2);
        overlayCtx.fillStyle = "rgba(34, 197, 94, 0.3)";
        overlayCtx.fill();
        overlayCtx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
      } else {
        // Multiple points - create smooth stroke
        overlayCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
          overlayCtx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        
        overlayCtx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
        
        overlayCtx.lineWidth = stroke.radius * 2;
        overlayCtx.lineCap = "round";
        overlayCtx.lineJoin = "round";
        overlayCtx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        overlayCtx.stroke();
      }
    });

    // Draw motion trails
    this.motionTrails.forEach(trail => {
      if (trail.points.length < 2) return;

      overlayCtx.strokeStyle = "#3b82f6";
      overlayCtx.lineWidth = 4;
      overlayCtx.lineCap = "round";
      overlayCtx.lineJoin = "round";
      overlayCtx.shadowColor = "#3b82f6";
      overlayCtx.shadowBlur = 10;

      overlayCtx.beginPath();
      overlayCtx.moveTo(trail.points[0].x, trail.points[0].y);
      
      for (let i = 1; i < trail.points.length; i++) {
        overlayCtx.lineTo(trail.points[i].x, trail.points[i].y);
      }
      overlayCtx.stroke();

      // Draw arrowhead
      const last = trail.points[trail.points.length - 1];
      const secondLast = trail.points[trail.points.length - 2];
      const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);
      const headLength = 15;

      overlayCtx.shadowBlur = 0;
      overlayCtx.fillStyle = "#3b82f6";
      overlayCtx.beginPath();
      overlayCtx.moveTo(last.x, last.y);
      overlayCtx.lineTo(
        last.x - headLength * Math.cos(angle - Math.PI / 6),
        last.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      overlayCtx.lineTo(
        last.x - headLength * Math.cos(angle + Math.PI / 6),
        last.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      overlayCtx.closePath();
      overlayCtx.fill();
    });
  }

  /**
   * Generate 12 keyframes for continuous one-directional loop
   * Optimized for large images with memory management
   */
  private generateKeyframes() {
    if (this.motionVectors.length === 0) {
      this.keyframes = [];
      return;
    }

    console.log('Generating keyframes for continuous loop...');
    
    // Clear old keyframes to free memory
    this.keyframes = [];
    const numFrames = this.numKeyframes;

    // Start from the original image
    let sourceFrame = this.originalImageData;

    // First keyframe: original image (clone to avoid reference issues)
    this.keyframes.push({ imageData: this.cloneImageData(sourceFrame) });

    // Generate subsequent keyframes with progressive displacement
    // For large images, generate frames one at a time and allow GC
    for (let i = 1; i < numFrames; i++) {
      const displaced = this.createDisplacedFrame(sourceFrame);
      this.keyframes.push({ imageData: displaced });
      sourceFrame = displaced;
      
      // For very large images, yield to browser occasionally
      if (i % 4 === 0 && this.canvas.width * this.canvas.height > 1000000) {
        // Allow browser to process other tasks
        void Promise.resolve();
      }
    }

    console.log(`Generated ${numFrames} keyframes for continuous one-directional loop`);
  }

  /**
   * Create a single displaced frame using nearest-neighbor displacement
   * This provides crisp, sharp motion without any blur
   */
  private createDisplacedFrame(sourceData: ImageData): ImageData {
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const srcData = sourceData.data;
    const dstData = imageData.data;
    
    // Initialize destination with source (for non-displaced areas)
    for (let i = 0; i < srcData.length; i++) {
      dstData[i] = srcData[i];
    }
    
    // Forward warping: push each source pixel to its displaced destination
    // Use nearest neighbor for crisp, sharp results
    const occupied = new Uint8Array(width * height); // Track which pixels have been written
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const displacement = this.calculateDisplacement(x, y, 1);
        
        // Skip pixels with no displacement
        if (Math.abs(displacement.dx) < 0.1 && Math.abs(displacement.dy) < 0.1) {
          continue;
        }
        
        // Calculate destination position (nearest neighbor)
        let destX = Math.round(x + displacement.dx);
        let destY = Math.round(y + displacement.dy);
        
        // Wrap around for seamless loop
        destX = ((destX % width) + width) % width;
        destY = ((destY % height) + height) % height;
        
        const srcIdx = (y * width + x) * 4;
        const destIdx = (destY * width + destX) * 4;
        const occupiedIdx = destY * width + destX;
        
        // Copy pixel to destination (nearest neighbor - no interpolation)
        dstData[destIdx] = srcData[srcIdx];
        dstData[destIdx + 1] = srcData[srcIdx + 1];
        dstData[destIdx + 2] = srcData[srcIdx + 2];
        dstData[destIdx + 3] = srcData[srcIdx + 3];
        
        occupied[occupiedIdx] = 1;
      }
    }

    return imageData;
  }

  /**
   * Calculate displacement for a pixel with controlled motion
   * Updated to follow trail direction more accurately with localized influence
   */
  private calculateDisplacement(x: number, y: number, intensity: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Use pre-computed selection mask for fast lookup (eliminates overlapping issues)
    let selectionWeight = 1;
    
    if (this.selectionMask && (this.rangeStrokes.length > 0 || this.rangePoints.length > 0)) {
      const maskIdx = Math.floor(y) * this.canvas.width + Math.floor(x);
      
      // Check bounds
      if (maskIdx >= 0 && maskIdx < this.selectionMask.length) {
        selectionWeight = this.selectionMask[maskIdx] / 255;
      } else {
        selectionWeight = 0;
      }
    }

    if (selectionWeight <= 0) {
      return { dx: 0, dy: 0 };
    }

    // Use much more localized influence radius for accurate directional control
    // This prevents distant motion vectors from affecting pixels incorrectly
    const baseMaxDist = Math.max(this.canvas.width, this.canvas.height) * 0.15;
    
    // Find nearest motion vectors and weight them heavily based on distance
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      
      if (dist < baseMaxDist) {
        const normalizedDist = dist / baseMaxDist;
        
        // Much steeper falloff to prioritize nearby vectors
        // This ensures pixels follow the direction of the closest trail segment
        const falloff = Math.pow(1 - normalizedDist, 3.5);
        const weight = falloff * vector.strength;
        
        // Use configurable max displacement - preserve exact arrow direction
        const magnitude = Math.sqrt(vector.dx ** 2 + vector.dy ** 2);
        const normalizedDx = magnitude > 0 ? vector.dx / magnitude : 0;
        const normalizedDy = magnitude > 0 ? vector.dy / magnitude : 0;
        
        totalDx += normalizedDx * weight * this.maxDisplacement * intensity;
        totalDy += normalizedDy * weight * this.maxDisplacement * intensity;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      let dx = (totalDx / totalWeight) * selectionWeight;
      let dy = (totalDy / totalWeight) * selectionWeight;
      
      // Apply reverse direction if enabled
      if (this.reverseDirection) {
        dx = -dx;
        dy = -dy;
      }
      
      return { dx, dy };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render loop with single continuous cycle for smooth directional movement
   */
  private renderLoop(timestamp: number) {
    if (!this.isAnimating) return;

    if (this.keyframes.length < 2) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
      return;
    }

    const progress = (timestamp % this.animationDuration) / this.animationDuration;
    const numFrames = this.keyframes.length;
    
    // Single continuous cycle
    const framePosition = progress * numFrames;
    const currentFrameIndex = Math.floor(framePosition) % numFrames;
    const nextFrameIndex = (currentFrameIndex + 1) % numFrames;
    const blendFactor = framePosition - Math.floor(framePosition);
    
    // Render interpolated frame
    this.renderInterpolatedFrame(currentFrameIndex, nextFrameIndex, blendFactor);

    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
  }

  /**
   * Render interpolated frame between two keyframes for smooth continuous movement
   */
  private renderInterpolatedFrame(currentIndex: number, nextIndex: number, blend: number) {
    const currentFrame = this.keyframes[currentIndex].imageData;
    const nextFrame = this.keyframes[nextIndex].imageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const length = currentFrame.data.length;

    for (let i = 0; i < length; i += 4) {
      // Interpolate between current and next displaced frame
      const r1 = currentFrame.data[i];
      const g1 = currentFrame.data[i + 1];
      const b1 = currentFrame.data[i + 2];
      
      const r2 = nextFrame.data[i];
      const g2 = nextFrame.data[i + 1];
      const b2 = nextFrame.data[i + 2];
      
      // Smooth interpolation between frames
      let r = r1 * (1 - blend) + r2 * blend;
      let g = g1 * (1 - blend) + g2 * blend;
      let b = b1 * (1 - blend) + b2 * blend;

      // Apply motion blur if set
      if (this.motionBlurAmount > 0.01) {
        const orig = this.originalImageData;
        r = r * (1 - this.motionBlurAmount) + orig.data[i] * this.motionBlurAmount;
        g = g * (1 - this.motionBlurAmount) + orig.data[i + 1] * this.motionBlurAmount;
        b = b * (1 - this.motionBlurAmount) + orig.data[i + 2] * this.motionBlurAmount;
      }

      blendedImageData.data[i] = Math.round(r);
      blendedImageData.data[i + 1] = Math.round(g);
      blendedImageData.data[i + 2] = Math.round(b);
      blendedImageData.data[i + 3] = 255;
    }

    this.ctx.putImageData(blendedImageData, 0, 0);
  }

  /**
   * Blend between two specific keyframes
   */
  private blendTwoFrames(index1: number, index2: number, t: number) {
    const frame1 = this.keyframes[index1].imageData;
    const frame2 = this.keyframes[index2].imageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    for (let i = 0; i < frame1.data.length; i++) {
      blendedImageData.data[i] = Math.round(
        frame1.data[i] * (1 - t) + frame2.data[i] * t
      );
    }

    this.ctx.putImageData(blendedImageData, 0, 0);
  }

  /**
   * Blend between two keyframes with fade to/from original image
   */
  private blendTwoFramesWithFade(index1: number, index2: number, t: number, alpha: number) {
    const frame1 = this.keyframes[index1].imageData;
    const frame2 = this.keyframes[index2].imageData;
    const originalFrame = this.originalImageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    for (let i = 0; i < frame1.data.length; i += 4) {
      // First blend between the two keyframes
      const r = frame1.data[i] * (1 - t) + frame2.data[i] * t;
      const g = frame1.data[i + 1] * (1 - t) + frame2.data[i + 1] * t;
      const b = frame1.data[i + 2] * (1 - t) + frame2.data[i + 2] * t;
      const a = frame1.data[i + 3] * (1 - t) + frame2.data[i + 3] * t;
      
      // Then blend with original image based on alpha
      blendedImageData.data[i] = Math.round(r * alpha + originalFrame.data[i] * (1 - alpha));
      blendedImageData.data[i + 1] = Math.round(g * alpha + originalFrame.data[i + 1] * (1 - alpha));
      blendedImageData.data[i + 2] = Math.round(b * alpha + originalFrame.data[i + 2] * (1 - alpha));
      blendedImageData.data[i + 3] = Math.round(a * alpha + originalFrame.data[i + 3] * (1 - alpha));
    }

    this.ctx.putImageData(blendedImageData, 0, 0);
  }

  /**
   * Check if a point is within a stroke path (within radius distance)
   */
  private isPointInStroke(x: number, y: number, stroke: RangeStroke): boolean {
    const { points, radius } = stroke;
    
    // Single point - check as circle
    if (points.length === 1) {
      const dist = Math.sqrt((x - points[0].x) ** 2 + (y - points[0].y) ** 2);
      return dist < radius;
    }
    
    // Multiple points - check distance to line segments
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < radius) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate distance from a point to a line segment
   */
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }
    
    // Calculate projection parameter
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
    
    // Find closest point on line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    // Return distance to closest point
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  }

  /**
   * Clone ImageData
   */
  private cloneImageData(imageData: ImageData): ImageData {
    const cloned = new ImageData(imageData.width, imageData.height);
    cloned.data.set(imageData.data);
    return cloned;
  }

  play(speed: number = 1) {
    // Adjust duration based on speed (higher speed = shorter duration)
    this.animationDuration = 3000 / speed;
    
    // Force stop first to ensure clean state
    if (this.isAnimating) {
      this.stop();
    }
    
    this.isAnimating = true;
    this.currentTime = performance.now();
    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
  }
  
  // Update speed during playback
  updateSpeed(speed: number) {
    this.animationDuration = 3000 / speed;
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Show original image
    this.ctx.drawImage(this.sourceImage, 0, 0, this.canvas.width, this.canvas.height);
  }

  async export(format: "mp4" | "webm", fps: number = 30, duration: number = 6): Promise<Blob> {
    const stream = this.canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: format === "webm" ? "video/webm" : "video/webm",
      videoBitsPerSecond: 5000000
    });

    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: format === "webm" ? "video/webm" : "video/mp4" });
        resolve(blob);
      };
      mediaRecorder.onerror = reject;

      const wasPlaying = this.isAnimating;
      if (!wasPlaying) {
        this.play(1);
      }

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        if (!wasPlaying) {
          this.stop();
        }
      }, duration * 1000);
    });
  }
}
