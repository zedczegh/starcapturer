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
  private animationFrame: number | null = null;
  private isAnimating: boolean = false;
  
  // Keyframe-based animation
  private keyframes: Keyframe[] = [];
  private currentTime: number = 0;
  private animationDuration: number = 3000; // 3 seconds for full loop

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
    
    // Store original image data
    this.ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    this.originalImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  addMotionVector(x1: number, y1: number, x2: number, y2: number, strength: number) {
    this.motionVectors.push({
      x: x1,
      y: y1,
      dx: x2 - x1,
      dy: y2 - y1,
      strength
    });
    
    // Regenerate keyframes when motion changes
    this.generateKeyframes();
  }

  addMotionTrail(points: { x: number; y: number }[]) {
    this.motionTrails.push({ points });
  }

  addRangePoint(x: number, y: number, radius: number) {
    this.rangePoints.push({ x, y, radius });
    
    // Regenerate keyframes when range changes
    this.generateKeyframes();
  }

  removeAtPoint(x: number, y: number, radius: number) {
    this.motionVectors = this.motionVectors.filter(v => {
      const dist = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
      return dist > radius;
    });

    this.rangePoints = this.rangePoints.filter(r => {
      const dist = Math.sqrt((r.x - x) ** 2 + (r.y - y) ** 2);
      return dist > radius;
    });
    
    // Regenerate keyframes after removal
    this.generateKeyframes();
  }

  clear() {
    this.motionVectors = [];
    this.motionTrails = [];
    this.rangePoints = [];
    this.keyframes = [];
    this.stop();
  }

  drawOverlay(overlayCtx: CanvasRenderingContext2D) {
    overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw range points
    this.rangePoints.forEach(range => {
      overlayCtx.fillStyle = "rgba(34, 197, 94, 0.3)";
      overlayCtx.beginPath();
      overlayCtx.arc(range.x, range.y, range.radius, 0, Math.PI * 2);
      overlayCtx.fill();
      
      overlayCtx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      overlayCtx.lineWidth = 2;
      overlayCtx.stroke();
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
   * Generate 2 keyframes: original and displaced
   * This creates a simple, stable animation loop
   */
  private generateKeyframes() {
    if (this.motionVectors.length === 0) {
      this.keyframes = [];
      return;
    }

    console.log('Generating keyframes...');
    
    // Keyframe 0: Original image
    this.keyframes = [{
      imageData: this.cloneImageData(this.originalImageData)
    }];

    // Keyframe 1: Maximum displacement (small, controlled amount)
    const displacedImageData = this.createDisplacedFrame(0.5); // 50% displacement
    this.keyframes.push({
      imageData: displacedImageData
    });

    console.log('Generated 2 keyframes for smooth looping');
  }

  /**
   * Create a single displaced frame with controlled displacement
   */
  private createDisplacedFrame(intensity: number): ImageData {
    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const sourceData = this.originalImageData;

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const displacement = this.calculateDisplacement(x, y, intensity);
        
        // Backward warping
        const sourceX = x - displacement.dx;
        const sourceY = y - displacement.dy;

        // Clamp to bounds
        const clampedX = Math.max(0, Math.min(this.canvas.width - 1, sourceX));
        const clampedY = Math.max(0, Math.min(this.canvas.height - 1, sourceY));

        // Bilinear interpolation
        const x1 = Math.floor(clampedX);
        const y1 = Math.floor(clampedY);
        const x2 = Math.min(x1 + 1, this.canvas.width - 1);
        const y2 = Math.min(y1 + 1, this.canvas.height - 1);
        
        const fx = clampedX - x1;
        const fy = clampedY - y1;

        const targetIdx = (y * this.canvas.width + x) * 4;

        const idx11 = (y1 * this.canvas.width + x1) * 4;
        const idx21 = (y1 * this.canvas.width + x2) * 4;
        const idx12 = (y2 * this.canvas.width + x1) * 4;
        const idx22 = (y2 * this.canvas.width + x2) * 4;

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

    return imageData;
  }

  /**
   * Calculate displacement for a pixel with controlled, small motion
   */
  private calculateDisplacement(x: number, y: number, intensity: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Check if in range
    let inRange = this.rangePoints.length === 0;
    
    if (this.rangePoints.length > 0) {
      for (const range of this.rangePoints) {
        const dist = Math.sqrt((x - range.x) ** 2 + (y - range.y) ** 2);
        if (dist < range.radius) {
          inRange = true;
          break;
        }
      }
    }

    if (!inRange) {
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
        
        // Small, controlled displacement (max 6 pixels)
        const maxDisplacement = 6;
        const normalizedDx = vector.dx / Math.max(Math.abs(vector.dx), Math.abs(vector.dy), 1);
        const normalizedDy = vector.dy / Math.max(Math.abs(vector.dx), Math.abs(vector.dy), 1);
        
        totalDx += normalizedDx * weight * maxDisplacement * intensity;
        totalDy += normalizedDy * weight * maxDisplacement * intensity;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      return {
        dx: totalDx / totalWeight,
        dy: totalDy / totalWeight
      };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render animation by smoothly interpolating between keyframes
   */
  private renderLoop(timestamp: number) {
    if (!this.isAnimating) return;

    // Calculate smooth loop progress (0 to 1 and back)
    const elapsed = timestamp - (this.currentTime || timestamp);
    this.currentTime = timestamp;

    // Use sine wave for smooth back-and-forth motion
    const progress = (timestamp % this.animationDuration) / this.animationDuration;
    const sineProgress = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    if (this.keyframes.length === 2) {
      // Blend between keyframe 0 and keyframe 1
      this.blendKeyframes(sineProgress);
    } else {
      // No keyframes, just show original
      this.ctx.putImageData(this.originalImageData, 0, 0);
    }

    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
  }

  /**
   * Smoothly blend between two keyframes
   */
  private blendKeyframes(t: number) {
    const frame0 = this.keyframes[0].imageData;
    const frame1 = this.keyframes[1].imageData;
    
    const blendedImageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);

    for (let i = 0; i < frame0.data.length; i++) {
      blendedImageData.data[i] = Math.round(
        frame0.data[i] * (1 - t) + frame1.data[i] * t
      );
    }

    this.ctx.putImageData(blendedImageData, 0, 0);
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
    if (this.isAnimating) return;
    
    // Adjust duration based on speed (higher speed = shorter duration)
    this.animationDuration = 3000 / speed;
    
    this.isAnimating = true;
    this.currentTime = performance.now();
    this.animationFrame = requestAnimationFrame((t) => this.renderLoop(t));
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
