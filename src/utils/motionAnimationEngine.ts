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
  private isVisible: boolean = true; // Visibility state for rendering
  private maxDisplacement: number = 100; // Configurable max displacement in pixels
  private motionBlurAmount: number = 0.3; // 0 = no blur (always show original), 1 = max blur
  private coreBrightening: boolean = true; // Enable core brightening effect
  private reverseDirection: boolean = false; // Reverse animation direction
  private numKeyframes: number = 12; // Number of keyframes to generate
  private hasShownInitialOriginal: boolean = false; // Ensures first frame shows pure original
  
  // Overlay styling (per-engine so each layer can have its own colors)
  private rangeColor: string = "#22c55e"; // default green
  private motionColor: string = "#3b82f6"; // default blue
  
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

  // Allow external callers (per-layer) to customize overlay colors
  public setColors(rangeColor: string, motionColor: string) {
    this.rangeColor = rangeColor;
    this.motionColor = motionColor;
  }

  // Allow external control of visibility for rendering
  public setVisible(visible: boolean) {
    this.isVisible = visible;
  }

  public getVisible(): boolean {
    return this.isVisible;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // Utility: convert hex color to RGB for translucent strokes
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace("#", "");
    const bigint = parseInt(cleaned, 16);
    if (Number.isNaN(bigint) || (cleaned.length !== 6 && cleaned.length !== 3)) {
      // Fallback to default green
      return { r: 34, g: 197, b: 94 };
    }
    if (cleaned.length === 3) {
      const r = (bigint >> 8) & 0xf;
      const g = (bigint >> 4) & 0xf;
      const b = bigint & 0xf;
      return { r: r * 17, g: g * 17, b: b * 17 };
    }
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }
  /**
   * Rebuild the unified selection mask - MATHEMATICAL APPROACH
   * Build mask by calculating distance to stroke points instead of canvas rendering
   * This gives pixel-perfect selection control without anti-aliasing artifacts
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
    
    // Build selection mask mathematically - check each pixel's distance to strokes
    // This eliminates anti-aliasing and gives exact control over selection boundaries
    
    // Process each stroke
    for (const stroke of this.rangeStrokes) {
      const { points, radius } = stroke;
      if (points.length === 0) continue;
      
      // For single point, select all pixels within radius
      if (points.length === 1) {
        this.selectCircle(points[0].x, points[0].y, radius, width, height);
        continue;
      }
      
      // For multi-point stroke, select pixels within radius of any line segment
      for (let i = 0; i < points.length - 1; i++) {
        this.selectLineSegment(
          points[i].x, points[i].y,
          points[i + 1].x, points[i + 1].y,
          radius, width, height
        );
      }
      
      // Add circles at endpoints for complete coverage
      this.selectCircle(points[0].x, points[0].y, radius, width, height);
      this.selectCircle(points[points.length - 1].x, points[points.length - 1].y, radius, width, height);
    }
    
    // Process individual points
    for (const point of this.rangePoints) {
      this.selectCircle(point.x, point.y, point.radius, width, height);
    }
    
    // Apply erosion to shrink selection by 2-3 pixels on all sides
    // This removes edge artifacts and ensures only solidly painted areas are selected
    this.erodeSelectionMask(width, height, 3);
  }
  
  /**
   * Select all pixels within a circle (mathematical calculation)
   */
  private selectCircle(cx: number, cy: number, radius: number, width: number, height: number) {
    // Only check pixels in bounding box around circle for efficiency
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    
    const radiusSq = radius * radius;
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const distSq = dx * dx + dy * dy;
        
        if (distSq <= radiusSq) {
          const idx = y * width + x;
          this.selectionMask[idx] = 255;
        }
      }
    }
  }
  
  /**
   * Select all pixels within radius of a line segment (mathematical calculation)
   */
  private selectLineSegment(
    x1: number, y1: number,
    x2: number, y2: number,
    radius: number, width: number, height: number
  ) {
    // Bounding box for the line segment plus radius
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - radius));
    const maxX = Math.min(width - 1, Math.ceil(Math.max(x1, x2) + radius));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - radius));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(y1, y2) + radius));
    
    const radiusSq = radius * radius;
    
    // Line segment vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      // Degenerate case: both points are the same
      this.selectCircle(x1, y1, radius, width, height);
      return;
    }
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Calculate distance from pixel to line segment
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        const distX = x - closestX;
        const distY = y - closestY;
        const distSq = distX * distX + distY * distY;
        
        if (distSq <= radiusSq) {
          const idx = y * width + x;
          this.selectionMask[idx] = 255;
        }
      }
    }
  }
  
  /**
   * Erode selection mask to shrink selection boundaries
   * This removes stray edge pixels and prevents accidental overselection
   */
  private erodeSelectionMask(width: number, height: number, iterations: number = 1) {
    for (let iter = 0; iter < iterations; iter++) {
      const tempMask = new Uint8Array(this.selectionMask);
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          
          // Only process selected pixels
          if (tempMask[idx] === 255) {
            // Check 8-connected neighbors
            const neighbors = [
              tempMask[idx - 1],           // left
              tempMask[idx + 1],           // right
              tempMask[idx - width],       // top
              tempMask[idx + width],       // bottom
              tempMask[idx - width - 1],   // top-left
              tempMask[idx - width + 1],   // top-right
              tempMask[idx + width - 1],   // bottom-left
              tempMask[idx + width + 1]    // bottom-right
            ];
            
            // If any neighbor is unselected, erode this pixel
            if (neighbors.some(n => n === 0)) {
              this.selectionMask[idx] = 0;
            }
          }
        }
      }
    }
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
    // Important: do NOT clear here in multi-layer mode; the caller
    // is responsible for clearing once, then drawing all engines.

    const rangeRgb = this.hexToRgb(this.rangeColor);
    const motionColor = this.motionColor;

    // Draw range strokes as continuous filled paths
    this.rangeStrokes.forEach(stroke => {
      overlayCtx.beginPath();
      
      if (stroke.points.length === 1) {
        // Single point - draw as circle
        overlayCtx.arc(stroke.points[0].x, stroke.points[0].y, stroke.radius, 0, Math.PI * 2);
        overlayCtx.fillStyle = `rgba(${rangeRgb.r}, ${rangeRgb.g}, ${rangeRgb.b}, 0.3)`;
        overlayCtx.fill();
        overlayCtx.strokeStyle = `rgba(${rangeRgb.r}, ${rangeRgb.g}, ${rangeRgb.b}, 0.6)`;
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
        overlayCtx.strokeStyle = `rgba(${rangeRgb.r}, ${rangeRgb.g}, ${rangeRgb.b}, 0.6)`;
        overlayCtx.stroke();
      }
    });

    // Draw motion trails
    this.motionTrails.forEach(trail => {
      if (trail.points.length < 2) return;

      overlayCtx.strokeStyle = motionColor;
      overlayCtx.lineWidth = 4;
      overlayCtx.lineCap = "round";
      overlayCtx.lineJoin = "round";
      overlayCtx.shadowColor = motionColor;
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
      overlayCtx.fillStyle = motionColor;
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
   * Generate keyframes for continuous one-directional loop with cumulative displacement
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

    // First keyframe: pure original (clone to avoid reference issues)
    this.keyframes.push({ imageData: this.cloneImageData(this.originalImageData) });

    // Generate subsequent keyframes with CUMULATIVE displacement
    // Each frame displaces the previous one, creating flowing motion trails
    let sourceFrame = this.originalImageData;
    
    for (let i = 1; i < numFrames; i++) {
      const displaced = this.createDisplacedFrame(sourceFrame, 1.0);
      this.keyframes.push({ imageData: displaced });
      sourceFrame = displaced; // Next frame builds on this one
      
      // For very large images, yield to browser occasionally
      if (i % 4 === 0 && this.canvas.width * this.canvas.height > 1000000) {
        void Promise.resolve();
      }
    }

    console.log(`Generated ${numFrames} keyframes for continuous one-directional loop`);
  }

  /**
   * CRITICAL FIX: Selection-aware displacement with proper fade-out trails
   * Creates smooth transition from displaced pixels to original at boundaries
   */
  private createDisplacedFrame(sourceData: ImageData, intensity: number = 1): ImageData {
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const srcData = sourceData.data;
    const dstData = imageData.data;
    const originalData = this.originalImageData.data;
    
    // Helper: Check if a pixel is selected with bounds check
    const isSelected = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      if (!this.selectionMask) return false;
      return this.selectionMask[y * width + x] === 255;
    };
    
    // Helper: Count selected neighbors in a radius (returns 0.0 to 1.0)
    const getSelectionDensity = (x: number, y: number, radius: number = 2): number => {
      let selected = 0;
      let total = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            total++;
            if (isSelected(nx, ny)) selected++;
          }
        }
      }
      return total > 0 ? selected / total : 0;
    };
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        
        if (!isSelected(x, y)) {
          // Unselected pixel - copy original
          dstData[destIdx] = originalData[destIdx];
          dstData[destIdx + 1] = originalData[destIdx + 1];
          dstData[destIdx + 2] = originalData[destIdx + 2];
          dstData[destIdx + 3] = originalData[destIdx + 3];
          continue;
        }
        
        // Calculate density-based fade factor for EDGE SOFTENING ONLY
        // IMPORTANT: pixels inside the binary selection mask never fall
        // back to pure original here; they always retain some motion so
        // we don’t get static duplicates at stroke starts/edges.
        const destDensity = getSelectionDensity(x, y, 3);
        const edgeThreshold = 0.25; // slightly inside the painted area

        // Map density → [0, 1] where 0 is near the edge, 1 is deep core
        const normalizedDensity = Math.max(
          0,
          Math.min(1, (destDensity - edgeThreshold) / (1 - edgeThreshold))
        );

        // Edge softness curve: near the edge we allow more original mix,
        // but never fully zero-out motion.
        const edgeBlend = Math.pow(normalizedDensity, 0.6);
        const fadeStrength = 0.25 + 0.75 * edgeBlend; // min 25% motion
        
        // Calculate displacement scaled by per-frame intensity so
        // early keyframes move less and later ones move more.
        const displacement = this.calculateDisplacement(x, y, intensity);
        
        let srcX = x - displacement.dx;
        let srcY = y - displacement.dy;
        
        // Clamp to bounds
        srcX = Math.max(0, Math.min(width - 1, srcX));
        srcY = Math.max(0, Math.min(height - 1, srcY));
        
        const sourcePosX = Math.round(srcX);
        const sourcePosY = Math.round(srcY);
        
        // Get displaced pixel
        const srcIdx = (sourcePosY * width + sourcePosX) * 4;
        
        // Fade effect: blend displaced pixels with original based on edge proximity
        // Core area (high density) = almost pure displacement
        // Edge area (near threshold) = gradual fade to original for smooth trails
        dstData[destIdx] = Math.round(srcData[srcIdx] * fadeStrength + originalData[destIdx] * (1 - fadeStrength));
        dstData[destIdx + 1] = Math.round(srcData[srcIdx + 1] * fadeStrength + originalData[destIdx + 1] * (1 - fadeStrength));
        dstData[destIdx + 2] = Math.round(srcData[srcIdx + 2] * fadeStrength + originalData[destIdx + 2] * (1 - fadeStrength));
        dstData[destIdx + 3] = originalData[destIdx + 3];
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
      
      // Check bounds strictly
      if (maskIdx >= 0 && maskIdx < this.selectionMask.length) {
        // Strict binary selection: pixel must be fully selected (255)
        // This prevents any animation of partially selected or unselected areas
        selectionWeight = this.selectionMask[maskIdx] === 255 ? 1 : 0;
      } else {
        selectionWeight = 0;
      }
    }

    // Strict early exit - NEVER animate unselected pixels
    if (selectionWeight === 0) {
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
      // Full displacement for selected pixels - no gradual falloff at edges
      let dx = totalDx / totalWeight;
      let dy = totalDy / totalWeight;
      
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
   * Render loop with overlapping cycles for seamless infinite loop
   * Shows only nearest keyframe (no interpolation) to eliminate static appearance
   * Now renders to own canvas without checking visibility (compositor handles that)
   */
  private renderLoop(timestamp: number) {
    if (!this.isAnimating) return;

    // First frame after play(): show pure original image so the
    // fade-in starts from maximum saturation, then let the
    // dual-cycle system take over.
    if (!this.hasShownInitialOriginal) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      this.hasShownInitialOriginal = true;
      this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
      return;
    }

    if (this.keyframes.length < 2) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
      return;
    }

    const progress = (timestamp % this.animationDuration) / this.animationDuration;
    const numFrames = this.keyframes.length;
    
    // We always reserve keyframe 0 as the static original reference
    // and ONLY animate over displaced frames [1 .. numFrames-1].
    // This hides the initial "duplicate" original keyframes so the
    // loop starts already displaced and fades just like the end.
    const firstAnimatedIndex = 1;
    const lastAnimatedIndex = numFrames - 1;
    const animatedSpan = Math.max(1, lastAnimatedIndex - firstAnimatedIndex);
    
    // Calculate two animation cycles offset by 50%
    const cycle1Progress = progress;
    const cycle2Progress = (progress + 0.5) % 1.0;
    
    // Calculate alpha for each cycle (0-1 fade in/out)
      const calculateCycleAlpha = (cycleProgress: number) => {
        // Faster ramp-up at the start so motion becomes visible earlier,
        // still fading out over the last 30% of the cycle.
        if (cycleProgress < 0.5) {
          const ramp = cycleProgress / 0.5; // 0..1 over first half
          // Ease-out curve so we reach strong opacity quickly
          return Math.pow(ramp, 0.6);
        } else {
          const fadeProgress = (cycleProgress - 0.5) / 0.5; // last half
          return 1 - Math.pow(fadeProgress, 0.9);
        }
      };
    
    const cycle1Alpha = calculateCycleAlpha(cycle1Progress);
    const cycle2Alpha = calculateCycleAlpha(cycle2Progress);
    
    // Get nearest displaced frame for each cycle (skip original frame 0)
    const framePosition1 = firstAnimatedIndex + cycle1Progress * animatedSpan;
    const frame1Index = Math.round(framePosition1);
    
    const framePosition2 = firstAnimatedIndex + cycle2Progress * animatedSpan;
    const frame2Index = Math.round(framePosition2);
    
    // Render both cycles and composite them
    this.blendDualCycles(frame1Index, cycle1Alpha, frame2Index, cycle2Alpha);

    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
  }

/**
   * Blend dual animation cycles for seamless overlap
   * Enhanced with per-frame opacity curve to eliminate static duplicates at cycle start
   */
  private blendDualCycles(
    frame1Index: number, alpha1: number,
    frame2Index: number, alpha2: number
  ) {
    const frame1 = this.keyframes[frame1Index].imageData;
    const frame2 = this.keyframes[frame2Index].imageData;
    const originalFrame = this.originalImageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const length = frame1.data.length;

    // Per-frame opacity curve: early frames fade in, late frames remain strong
    // This prevents barely-displaced early keyframes from appearing as static duplicates
      const getFrameOpacity = (frameIndex: number): number => {
        if (frameIndex === 0) return 0; // Original never shown in cycles
        const numAnimatedFrames = this.keyframes.length - 1;
        const normalizedFrame = (frameIndex - 1) / Math.max(1, numAnimatedFrames - 1); // 0..1
        // Much shorter fade-in: first 15% ramp from 0.25 → 1 so
        // early displaced frames are clearly visible and not static.
        if (normalizedFrame < 0.15) {
          const local = normalizedFrame / 0.15; // 0..1
          return 0.25 + 0.75 * local;
        }
        return 1.0;
      };

    const frame1Opacity = getFrameOpacity(frame1Index);
    const frame2Opacity = getFrameOpacity(frame2Index);

    // Process in batches for better performance with large images
    for (let i = 0; i < length; i += 4) {
      // Get colors from each cycle's nearest keyframe
      const r1 = frame1.data[i];
      const g1 = frame1.data[i + 1];
      const b1 = frame1.data[i + 2];
      
      const r2 = frame2.data[i];
      const g2 = frame2.data[i + 1];
      const b2 = frame2.data[i + 2];
      
      const origR = originalFrame.data[i];
      const origG = originalFrame.data[i + 1];
      const origB = originalFrame.data[i + 2];
      
      let r, g, b;
      
      if (this.coreBrightening) {
        // Brightening on: reduce blur factor to keep animated regions more visible with pulsing
        const effectiveAlpha1 = alpha1 * frame1Opacity;
        const effectiveAlpha2 = alpha2 * frame2Opacity;
        const totalAlpha = Math.min(1, effectiveAlpha1 + effectiveAlpha2);
        const rCycles = totalAlpha > 0 ? (r1 * effectiveAlpha1 + r2 * effectiveAlpha2) / totalAlpha : r1;
        const gCycles = totalAlpha > 0 ? (g1 * effectiveAlpha1 + g2 * effectiveAlpha2) / totalAlpha : g1;
        const bCycles = totalAlpha > 0 ? (b1 * effectiveAlpha1 + b2 * effectiveAlpha2) / totalAlpha : b1;
        
        const blurFactor = 0.3;
        r = rCycles * (1 - blurFactor * (1 - totalAlpha)) + origR * blurFactor * (1 - totalAlpha);
        g = gCycles * (1 - blurFactor * (1 - totalAlpha)) + origG * blurFactor * (1 - totalAlpha);
        b = bCycles * (1 - blurFactor * (1 - totalAlpha)) + origB * blurFactor * (1 - totalAlpha);
      } else {
        // Apply per-frame opacity to cycle alphas for smooth fade-in
        const effectiveAlpha1 = alpha1 * frame1Opacity;
        const effectiveAlpha2 = alpha2 * frame2Opacity;
        const totalAlpha = Math.min(1, effectiveAlpha1 + effectiveAlpha2);
        
        // Gentler power curve for more balanced blending between cycles
        const adjustedAlpha1 = Math.pow(effectiveAlpha1, 0.85);
        const adjustedAlpha2 = Math.pow(effectiveAlpha2, 0.85);
        const adjustedTotal = adjustedAlpha1 + adjustedAlpha2;
        
        const weight1 = adjustedTotal > 0 ? adjustedAlpha1 / adjustedTotal : 0.5;
        const weight2 = adjustedTotal > 0 ? adjustedAlpha2 / adjustedTotal : 0.5;

        // Blend the two displaced cycles first
        const rCycles = r1 * weight1 + r2 * weight2;
        const gCycles = g1 * weight1 + g2 * weight2;
        const bCycles = b1 * weight1 + b2 * weight2;
        
        // Then fade cycles in/out against the original image based on totalAlpha
        // We enforce a minimum animation contribution so after the very first
        // pure-original frame, subsequent frames never look static again.
        let fadeFactor = totalAlpha;
        if (fadeFactor > 0 && fadeFactor < 0.35) {
          fadeFactor = 0.35 + 0.65 * fadeFactor; // keep some curve but avoid near-0
        }
        r = rCycles * fadeFactor + origR * (1 - fadeFactor);
        g = gCycles * fadeFactor + origG * (1 - fadeFactor);
        b = bCycles * fadeFactor + origB * (1 - fadeFactor);
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
    this.hasShownInitialOriginal = false;
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
