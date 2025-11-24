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
  private animationFrame: number | null = null;
  private isAnimating: boolean = false;
  private maxDisplacement: number = 100; // Configurable max displacement in pixels
  private motionBlurAmount: number = 0.3; // 0 = no blur (always show original), 1 = max blur
  private coreBrightening: boolean = true; // Enable core brightening effect
  
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
    
    // Only regenerate keyframes if not batching
    if (!skipKeyframeGen) {
      this.generateKeyframes();
    }
  }

  // Add a complete range stroke for visualization
  addRangeStroke(points: { x: number; y: number }[], radius: number) {
    this.rangeStrokes.push({ points, radius });
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

  clear() {
    this.motionVectors = [];
    this.motionTrails = [];
    this.rangePoints = [];
    this.rangeStrokes = [];
    this.keyframes = [];
    this.currentTime = 0;
    this.stop();
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
    const numFrames = 12;

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

    console.log('Generated 12 keyframes for continuous one-directional loop');
  }

  /**
   * Create a single displaced frame with controlled displacement
   * Optimized for large images with efficient pixel processing
   */
  private createDisplacedFrame(sourceData: ImageData): ImageData {
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Use nearest neighbor for sharp results when displacement is low
    const useNearestNeighbor = this.maxDisplacement < 20;
    
    // Pre-calculate commonly used values
    const srcData = sourceData.data;
    const dstData = imageData.data;

    // Process pixels in batches for better cache locality
    const batchSize = 1000;
    
    for (let batchStart = 0; batchStart < height; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, height);
      
      for (let y = batchStart; y < batchEnd; y++) {
        const rowOffset = y * width;
        
        for (let x = 0; x < width; x++) {
          const displacement = this.calculateDisplacement(x, y, 1);
          
          // Skip negligible displacement
          if (Math.abs(displacement.dx) < 0.01 && Math.abs(displacement.dy) < 0.01) {
            const idx = (rowOffset + x) * 4;
            dstData[idx] = srcData[idx];
            dstData[idx + 1] = srcData[idx + 1];
            dstData[idx + 2] = srcData[idx + 2];
            dstData[idx + 3] = srcData[idx + 3];
            continue;
          }
          
          // Backward warping with wraparound
          let sourceX = x - displacement.dx;
          let sourceY = y - displacement.dy;

          // Wrap around for seamless loop
          sourceX = ((sourceX % width) + width) % width;
          sourceY = ((sourceY % height) + height) % height;

          const targetIdx = (rowOffset + x) * 4;

          if (useNearestNeighbor) {
            // Nearest neighbor - fast and sharp
            const nearX = Math.round(sourceX) % width;
            const nearY = Math.round(sourceY) % height;
            const sourceIdx = (nearY * width + nearX) * 4;
            
            dstData[targetIdx] = srcData[sourceIdx];
            dstData[targetIdx + 1] = srcData[sourceIdx + 1];
            dstData[targetIdx + 2] = srcData[sourceIdx + 2];
            dstData[targetIdx + 3] = srcData[sourceIdx + 3];
          } else {
            // Bilinear interpolation for smooth displacement
            const x1 = Math.floor(sourceX);
            const y1 = Math.floor(sourceY);
            const x2 = (x1 + 1) % width;
            const y2 = (y1 + 1) % height;
            
            const fx = sourceX - x1;
            const fy = sourceY - y1;

            const idx11 = (y1 * width + x1) * 4;
            const idx21 = (y1 * width + x2) * 4;
            const idx12 = (y2 * width + x1) * 4;
            const idx22 = (y2 * width + x2) * 4;

            // Interpolate each channel
            for (let channel = 0; channel < 4; channel++) {
              const c11 = srcData[idx11 + channel];
              const c21 = srcData[idx21 + channel];
              const c12 = srcData[idx12 + channel];
              const c22 = srcData[idx22 + channel];

              const c1 = c11 * (1 - fx) + c21 * fx;
              const c2 = c12 * (1 - fx) + c22 * fx;
              const interpolated = c1 * (1 - fy) + c2 * fy;

              dstData[targetIdx + channel] = Math.round(interpolated);
            }
          }
        }
      }
    }

    return imageData;
  }

  /**
   * Calculate displacement for a pixel with controlled motion
   */
  private calculateDisplacement(x: number, y: number, intensity: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Selection feathering based on continuous strokes / points
    let selectionWeight = 1;

    // If we have any selection strokes or points, compute a soft mask 0..1
    if (this.rangeStrokes.length > 0 || this.rangePoints.length > 0) {
      let minDist = Infinity;
      let radiusForMin = 1;

      // Check strokes first (continuous brush areas)
      for (const stroke of this.rangeStrokes) {
        const { points, radius } = stroke;
        radiusForMin = radius;

        if (points.length === 1) {
          const d = Math.sqrt((x - points[0].x) ** 2 + (y - points[0].y) ** 2);
          if (d < minDist) minDist = d;
        } else {
          // Check distance to all line segments
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const d = this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (d < minDist) {
              minDist = d;
              radiusForMin = radius;
            }
          }
          // Also check distance to the last point itself
          const lastPoint = points[points.length - 1];
          const d = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
          if (d < minDist) {
            minDist = d;
            radiusForMin = radius;
          }
        }
      }

      // Fallback / combination with individual range points
      for (const range of this.rangePoints) {
        const d = Math.sqrt((x - range.x) ** 2 + (y - range.y) ** 2);
        if (d < minDist) {
          minDist = d;
          radiusForMin = range.radius;
        }
      }

      if (minDist === Infinity) {
        selectionWeight = 0;
      } else {
        // Hard edge within radius, soft falloff outside
        // Pixels within 80% of radius get full weight, then soft falloff
        const innerRadius = radiusForMin * 0.8;
        if (minDist <= innerRadius) {
          selectionWeight = 1;
        } else if (minDist >= radiusForMin) {
          selectionWeight = 0;
        } else {
          // Smooth falloff in outer 20%
          const falloffDist = minDist - innerRadius;
          const falloffRange = radiusForMin - innerRadius;
          selectionWeight = 1 - (falloffDist / falloffRange);
        }
      }
    }

    if (selectionWeight <= 0) {
      return { dx: 0, dy: 0 };
    }

    // Calculate smooth motion field
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      const maxDist = 200;
      
      if (dist < maxDist) {
        const normalizedDist = dist / maxDist;
        const falloff = Math.exp(-normalizedDist * 3);
        const weight = falloff * vector.strength;
        
        // Use configurable max displacement
        const normalizedDx = vector.dx / Math.max(Math.abs(vector.dx), Math.abs(vector.dy), 1);
        const normalizedDy = vector.dy / Math.max(Math.abs(vector.dx), Math.abs(vector.dy), 1);
        
        totalDx += normalizedDx * weight * this.maxDisplacement * intensity;
        totalDy += normalizedDy * weight * this.maxDisplacement * intensity;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      const dx = (totalDx / totalWeight) * selectionWeight;
      const dy = (totalDy / totalWeight) * selectionWeight;
      return { dx, dy };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render loop with overlapping cycles for seamless infinite loop
   * Optimized for smooth playback with large images
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
    
    // Calculate two animation cycles offset by 50%
    const cycle1Progress = progress;
    const cycle2Progress = (progress + 0.5) % 1.0;
    
    // Calculate alpha for each cycle (0-1 fade in/out)
    const calculateCycleAlpha = (cycleProgress: number) => {
      if (cycleProgress < 0.7) {
        return cycleProgress / 0.7;
      } else {
        const fadeProgress = (cycleProgress - 0.7) / 0.3;
        return 1 - fadeProgress;
      }
    };
    
    const cycle1Alpha = calculateCycleAlpha(cycle1Progress);
    const cycle2Alpha = calculateCycleAlpha(cycle2Progress);
    
    // Get frames for cycle 1
    const framePosition1 = cycle1Progress * (numFrames - 1);
    const frame1Index = Math.floor(framePosition1);
    const frame2Index = Math.min(frame1Index + 1, numFrames - 1);
    const blendFactor1 = framePosition1 - frame1Index;
    
    // Get frames for cycle 2
    const framePosition2 = cycle2Progress * (numFrames - 1);
    const frame3Index = Math.floor(framePosition2);
    const frame4Index = Math.min(frame3Index + 1, numFrames - 1);
    const blendFactor2 = framePosition2 - frame3Index;
    
    // Render both cycles and composite them
    this.blendDualCycles(
      frame1Index, frame2Index, blendFactor1, cycle1Alpha,
      frame3Index, frame4Index, blendFactor2, cycle2Alpha
    );

    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
  }

  /**
   * Blend dual animation cycles for seamless overlap
   * Optimized for large images with efficient compositing
   */
  private blendDualCycles(
    frame1Index: number, frame2Index: number, blend1: number, alpha1: number,
    frame3Index: number, frame4Index: number, blend2: number, alpha2: number
  ) {
    const frame1 = this.keyframes[frame1Index].imageData;
    const frame2 = this.keyframes[frame2Index].imageData;
    const frame3 = this.keyframes[frame3Index].imageData;
    const frame4 = this.keyframes[frame4Index].imageData;
    const originalFrame = this.originalImageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const length = frame1.data.length;

    // Process in batches for better performance with large images
    for (let i = 0; i < length; i += 4) {
      // Blend cycle 1 frames
      const r1 = frame1.data[i] * (1 - blend1) + frame2.data[i] * blend1;
      const g1 = frame1.data[i + 1] * (1 - blend1) + frame2.data[i + 1] * blend1;
      const b1 = frame1.data[i + 2] * (1 - blend1) + frame2.data[i + 2] * blend1;
      
      // Blend cycle 2 frames
      const r2 = frame3.data[i] * (1 - blend2) + frame4.data[i] * blend2;
      const g2 = frame3.data[i + 1] * (1 - blend2) + frame4.data[i + 1] * blend2;
      const b2 = frame3.data[i + 2] * (1 - blend2) + frame4.data[i + 2] * blend2;
      
      // Composite both cycles together
      const totalAlpha = Math.min(1, alpha1 + alpha2);
      
      let r, g, b;
      
      if (this.coreBrightening) {
        // Brightening on: reduce blur factor to keep animated regions more visible with pulsing
        const rCycles = totalAlpha > 0 ? (r1 * alpha1 + r2 * alpha2) / totalAlpha : r1;
        const gCycles = totalAlpha > 0 ? (g1 * alpha1 + g2 * alpha2) / totalAlpha : g1;
        const bCycles = totalAlpha > 0 ? (b1 * alpha1 + b2 * alpha2) / totalAlpha : b1;
        
        const blurFactor = 0.3;
        r = rCycles * (1 - blurFactor * (1 - totalAlpha)) + originalFrame.data[i] * blurFactor * (1 - totalAlpha);
        g = gCycles * (1 - blurFactor * (1 - totalAlpha)) + originalFrame.data[i + 1] * blurFactor * (1 - totalAlpha);
        b = bCycles * (1 - blurFactor * (1 - totalAlpha)) + originalFrame.data[i + 2] * blurFactor * (1 - totalAlpha);
      } else {
        // Brightening off: maintain constant visibility without pulsing
        // Pure cycle crossfade - no alpha-based fading to original image
        const safeAlpha1 = Math.max(0.0001, alpha1);
        const safeAlpha2 = Math.max(0.0001, alpha2);
        const weight1 = safeAlpha1 / (safeAlpha1 + safeAlpha2);
        const weight2 = safeAlpha2 / (safeAlpha1 + safeAlpha2);

        const rCycles = r1 * weight1 + r2 * weight2;
        const gCycles = g1 * weight1 + g2 * weight2;
        const bCycles = b1 * weight1 + b2 * weight2;
        
        // Apply motion blur only if set (doesn't affect pulsing)
        if (this.motionBlurAmount > 0.01) {
          r = rCycles * (1 - this.motionBlurAmount) + originalFrame.data[i] * this.motionBlurAmount;
          g = gCycles * (1 - this.motionBlurAmount) + originalFrame.data[i + 1] * this.motionBlurAmount;
          b = bCycles * (1 - this.motionBlurAmount) + originalFrame.data[i + 2] * this.motionBlurAmount;
        } else {
          r = rCycles;
          g = gCycles;
          b = bCycles;
        }
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
    
    if (this.isAnimating) return;
    
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
