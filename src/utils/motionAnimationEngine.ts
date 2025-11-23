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
  private sourceImageData: ImageData | null = null;
  private motionVectors: MotionVector[] = [];
  private motionTrails: MotionTrail[] = [];
  private rangePoints: RangePoint[] = [];
  private animationFrame: number | null = null;
  private currentFrame: number = 0;
  private isAnimating: boolean = false;
  private feathering: number = 20;

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement, feathering: number = 20) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
    this.feathering = feathering;
    
    // Store the original image data for clean sampling
    this.ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    this.sourceImageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  setFeathering(feathering: number) {
    this.feathering = feathering;
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
   */
  private calculateDisplacement(x: number, y: number, frame: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Calculate range influence with feathering
    let rangeInfluence = this.rangePoints.length === 0 ? 1 : 0; // If no range points, animate everything
    
    if (this.rangePoints.length > 0) {
      for (const range of this.rangePoints) {
        const dist = Math.sqrt((x - range.x) ** 2 + (y - range.y) ** 2);
        
        if (dist < range.radius) {
          // Inside the range - full influence
          rangeInfluence = 1;
          break;
        } else if (dist < range.radius + this.feathering) {
          // In the feathering zone - gradient falloff
          const falloff = 1 - (dist - range.radius) / this.feathering;
          rangeInfluence = Math.max(rangeInfluence, falloff);
        }
      }
    }

    // If no range influence, no movement
    if (rangeInfluence === 0) {
      return { dx: 0, dy: 0 };
    }

    // Calculate displacement from motion vectors
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      const maxDist = 200; // Influence radius
      
      if (dist < maxDist) {
        const weight = Math.pow(1 - dist / maxDist, 2) * vector.strength;
        
        // Smooth unidirectional motion (no oscillation)
        const progress = (frame % 120) / 120; // Loop every 120 frames
        const smoothProgress = progress < 0.5 
          ? 2 * progress * progress // Ease in
          : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease out
        
        totalDx += vector.dx * weight * smoothProgress;
        totalDy += vector.dy * weight * smoothProgress;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      return {
        dx: (totalDx / totalWeight) * rangeInfluence,
        dy: (totalDy / totalWeight) * rangeInfluence
      };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render a single frame of the animation
   */
  private renderFrame(speed: number) {
    if (!this.isAnimating || !this.sourceImageData) return;

    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const sourceData = this.sourceImageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Optimized pixel processing
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const displacement = this.calculateDisplacement(x, y, this.currentFrame);
        
        const sourceX = Math.round(x - displacement.dx);
        const sourceY = Math.round(y - displacement.dy);

        const targetIdx = (y * width + x) * 4;

        // Bounds checking with early copy for in-bounds pixels
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const sourceIdx = (sourceY * width + sourceX) * 4;
          
          // Direct array access for better performance
          data[targetIdx] = sourceData[sourceIdx];
          data[targetIdx + 1] = sourceData[sourceIdx + 1];
          data[targetIdx + 2] = sourceData[sourceIdx + 2];
          data[targetIdx + 3] = sourceData[sourceIdx + 3];
        } else {
          // Out of bounds - use original pixel
          const originalIdx = targetIdx;
          data[targetIdx] = sourceData[originalIdx];
          data[targetIdx + 1] = sourceData[originalIdx + 1];
          data[targetIdx + 2] = sourceData[originalIdx + 2];
          data[targetIdx + 3] = sourceData[originalIdx + 3];
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.currentFrame += speed;

    this.animationFrame = requestAnimationFrame(() => this.renderFrame(speed));
  }

  /**
   * Start playing the animation
   */
  play(speed: number = 1) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.renderFrame(speed);
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
  async export(format: "mp4" | "webm", fps: number = 30, duration: number = 3): Promise<Blob> {
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
