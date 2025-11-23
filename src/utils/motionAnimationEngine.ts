/**
 * Motion Animation Engine
 * Creates animated loops with motion vectors and anchor points
 * Similar to Motion Leap / Pixaloop functionality
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

export class MotionAnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sourceImage: HTMLImageElement;
  private originalImageData: ImageData; // Store original image data
  private motionVectors: MotionVector[] = [];
  private motionTrails: MotionTrail[] = [];
  private rangePoints: RangePoint[] = [];
  private animationFrame: number | null = null;
  private currentFrame: number = 0;
  private isAnimating: boolean = false;
  private speedFactor: number = 1; // User-controlled speed multiplier
  private lastTimestamp: number | null = null; // For time-based animation

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
    
    // CRITICAL: Store the original image data once at initialization
    // This prevents cumulative distortion by always sampling from the original
    this.ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    this.originalImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Add a motion vector (arrow) to the canvas
   */
  addMotionVector(x1: number, y1: number, x2: number, y2: number, strength: number) {
    this.motionVectors.push({
      x: x1,
      y: y1,
      dx: x2 - x1,
      dy: y2 - y1,
      strength
    });
  }

  /**
   * Add a motion trail for display (single arrow at end)
   */
  addMotionTrail(points: { x: number; y: number }[]) {
    this.motionTrails.push({ points });
  }

  /**
   * Add a range point (area that should move)
   */
  addRangePoint(x: number, y: number, radius: number) {
    this.rangePoints.push({ x, y, radius });
  }

  /**
   * Remove motion vectors or range points at a location
   */
  removeAtPoint(x: number, y: number, radius: number) {
    // Remove motion vectors
    this.motionVectors = this.motionVectors.filter(v => {
      const dist = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
      return dist > radius;
    });

    // Remove range points
    this.rangePoints = this.rangePoints.filter(r => {
      const dist = Math.sqrt((r.x - x) ** 2 + (r.y - y) ** 2);
      return dist > radius;
    });
  }

  /**
   * Clear all motion vectors and range points
   */
  clear() {
    this.motionVectors = [];
    this.motionTrails = [];
    this.rangePoints = [];
    this.stop();
  }

  /**
   * Draw overlay showing motion trails and range points
   */
  drawOverlay(overlayCtx: CanvasRenderingContext2D) {
    overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw range points (areas that will move)
    this.rangePoints.forEach(range => {
      overlayCtx.fillStyle = "rgba(34, 197, 94, 0.3)"; // Green for motion areas
      overlayCtx.beginPath();
      overlayCtx.arc(range.x, range.y, range.radius, 0, Math.PI * 2);
      overlayCtx.fill();
      
      overlayCtx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      overlayCtx.lineWidth = 2;
      overlayCtx.stroke();
    });

    // Draw motion trails (one arrow per trail at the end)
    this.motionTrails.forEach(trail => {
      const points = trail.points;
      if (points.length < 2) return;

      // Draw smooth trail line
      overlayCtx.strokeStyle = "#3b82f6";
      overlayCtx.lineWidth = 4;
      overlayCtx.lineCap = "round";
      overlayCtx.lineJoin = "round";
      overlayCtx.shadowColor = "#3b82f6";
      overlayCtx.shadowBlur = 10;

      overlayCtx.beginPath();
      overlayCtx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        overlayCtx.lineTo(points[i].x, points[i].y);
      }
      overlayCtx.stroke();

      // Draw single arrowhead at the end
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
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
   * Calculate displacement for a pixel based on motion vectors and range points
   * Uses proper motion mapping similar to Motion Leap/Pixaloop
   */
  /**
   * Calculate pixel displacement using smooth oscillating motion (Motion Leap technique)
   * Key principle: Displacement oscillates smoothly from original position, creating living photo effect
   */
  private calculateDisplacement(x: number, y: number, frame: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Check if pixel is in a range point - if range points exist, only animate those areas
    let inRange = this.rangePoints.length === 0; // If no range points, animate everything
    
    if (this.rangePoints.length > 0) {
      for (const range of this.rangePoints) {
        const dist = Math.sqrt((x - range.x) ** 2 + (y - range.y) ** 2);
        if (dist < range.radius) {
          inRange = true;
          break;
        }
      }
    }

    // If not in range, no movement
    if (!inRange) {
      return { dx: 0, dy: 0 };
    }

    // Motion Leap technique: Smooth oscillating displacement using sine wave with easing
    // The motion smoothly goes forward and back, creating a natural "living photo" effect
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      const maxDist = 200; // Influence radius
      
      if (dist < maxDist) {
        // Smooth exponential falloff for natural motion field
        const normalizedDist = dist / maxDist;
        const falloff = Math.exp(-normalizedDist * 3); // Exponential decay
        const weight = falloff * vector.strength;
        
        // Sine wave oscillation: smooth forward and backward motion
        // This creates the characteristic Motion Leap "breathing" effect
        const cycleLength = 180; // Frames per complete cycle (adjust for speed)
        const phase = (frame % cycleLength) / cycleLength;
        const sineValue = Math.sin(phase * Math.PI * 2);
        
        // Apply ease-in-out to sine wave for ultra-smooth motion
        const eased = sineValue * Math.abs(sineValue); // Quadratic easing
        
        // Small displacement magnitude (2-6 pixels typical for Motion Leap)
        const maxDisplacement = 4;
        const displacement = eased * maxDisplacement;
        
        totalDx += vector.dx * weight * displacement;
        totalDy += vector.dy * weight * displacement;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      // Normalize by total weight for smooth blending
      return {
        dx: totalDx / totalWeight,
        dy: totalDy / totalWeight
      };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render a single frame of the animation using bilinear interpolation
   * CRITICAL: Always samples from the ORIGINAL image to prevent cumulative distortion
   */
  private renderFrame(timestamp: number) {
    if (!this.isAnimating) return;

    // Time-based animation for consistent motion across devices
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }
    const deltaSeconds = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Advance a virtual "frame" counter at 60fps, scaled by speedFactor
    const effectiveSpeed = this.speedFactor;

    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    // CRITICAL: Sample from ORIGINAL image data, not the modified canvas
    const sourceData = this.originalImageData;

    // Apply displacement to each pixel with bilinear interpolation (backward warping)
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const displacement = this.calculateDisplacement(x, y, this.currentFrame);
        
        // Backward warping: where should we sample FROM to fill this pixel?
        const sourceX = x - displacement.dx;
        const sourceY = y - displacement.dy;

        // Clamp to image bounds to prevent artifacts
        const clampedX = Math.max(0, Math.min(this.canvas.width - 1, sourceX));
        const clampedY = Math.max(0, Math.min(this.canvas.height - 1, sourceY));

        // Bilinear interpolation for smooth sampling
        const x1 = Math.floor(clampedX);
        const y1 = Math.floor(clampedY);
        const x2 = Math.min(x1 + 1, this.canvas.width - 1);
        const y2 = Math.min(y1 + 1, this.canvas.height - 1);
        
        const fx = clampedX - x1;
        const fy = clampedY - y1;

        const targetIdx = (y * this.canvas.width + x) * 4;

        // Sample four neighboring pixels
        const idx11 = (y1 * this.canvas.width + x1) * 4;
        const idx21 = (y1 * this.canvas.width + x2) * 4;
        const idx12 = (y2 * this.canvas.width + x1) * 4;
        const idx22 = (y2 * this.canvas.width + x2) * 4;

        // Interpolate each color channel
        for (let channel = 0; channel < 4; channel++) {
          const c11 = sourceData.data[idx11 + channel];
          const c21 = sourceData.data[idx21 + channel];
          const c12 = sourceData.data[idx12 + channel];
          const c22 = sourceData.data[idx22 + channel];

          const c1 = c11 * (1 - fx) + c21 * fx;
          const c2 = c12 * (1 - fx) + c22 * fx;
          const interpolated = c1 * (1 - fy) + c2 * fy;

          imageData.data[targetIdx + channel] = Math.round(interpolated);
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Advance virtual frame based on real time for smooth, consistent motion
    this.currentFrame += deltaSeconds * 60 * effectiveSpeed;

    this.animationFrame = requestAnimationFrame((nextTimestamp) => this.renderFrame(nextTimestamp));
  }

  /**
   * Start playing the animation
   */
  play(speed: number = 1) {
    if (this.isAnimating) return;

    // Clamp speed to a reasonable range to avoid jumpy motion
    this.speedFactor = Math.max(0.25, Math.min(speed, 5));
    this.isAnimating = true;
    this.currentFrame = 0;
    this.lastTimestamp = null;
    this.animationFrame = requestAnimationFrame((timestamp) => this.renderFrame(timestamp));
  }

  /**
   * Stop the animation
   */
  stop() {
    this.isAnimating = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Redraw original image
    this.ctx.drawImage(this.sourceImage, 0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Export animation as video
   */
  async export(format: "mp4" | "webm", fps: number = 30, duration: number = 6): Promise<Blob> {
    // This is a placeholder - actual video encoding would require FFmpeg or similar
    // For now, we'll create a canvas recording
    
    const stream = this.canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: format === "webm" ? "video/webm" : "video/webm", // MP4 requires additional setup
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
