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

interface AnchorPoint {
  x: number;
  y: number;
  radius: number;
}

export class MotionAnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sourceImage: HTMLImageElement;
  private motionVectors: MotionVector[] = [];
  private motionTrails: MotionTrail[] = [];
  private anchorPoints: AnchorPoint[] = [];
  private animationFrame: number | null = null;
  private currentFrame: number = 0;
  private isAnimating: boolean = false;

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
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
   * Add an anchor point (area that stays still)
   */
  addAnchorPoint(x: number, y: number, radius: number) {
    this.anchorPoints.push({ x, y, radius });
  }

  /**
   * Remove motion vectors or anchor points at a location
   */
  removeAtPoint(x: number, y: number, radius: number) {
    // Remove motion vectors
    this.motionVectors = this.motionVectors.filter(v => {
      const dist = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
      return dist > radius;
    });

    // Remove anchor points
    this.anchorPoints = this.anchorPoints.filter(a => {
      const dist = Math.sqrt((a.x - x) ** 2 + (a.y - y) ** 2);
      return dist > radius;
    });
  }

  /**
   * Clear all motion vectors and anchor points
   */
  clear() {
    this.motionVectors = [];
    this.motionTrails = [];
    this.anchorPoints = [];
    this.stop();
  }

  /**
   * Draw overlay showing motion trails and anchor points
   */
  drawOverlay(overlayCtx: CanvasRenderingContext2D) {
    overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw anchor points
    this.anchorPoints.forEach(anchor => {
      overlayCtx.fillStyle = "rgba(255, 59, 48, 0.3)";
      overlayCtx.beginPath();
      overlayCtx.arc(anchor.x, anchor.y, anchor.radius, 0, Math.PI * 2);
      overlayCtx.fill();
      
      overlayCtx.strokeStyle = "rgba(255, 59, 48, 0.6)";
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
   * Calculate displacement for a pixel based on motion vectors and anchor points
   */
  private calculateDisplacement(x: number, y: number, frame: number): { dx: number; dy: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalWeight = 0;

    // Check if pixel is in an anchor point
    for (const anchor of this.anchorPoints) {
      const dist = Math.sqrt((x - anchor.x) ** 2 + (y - anchor.y) ** 2);
      if (dist < anchor.radius) {
        return { dx: 0, dy: 0 }; // No movement in anchored areas
      }
    }

    // Calculate displacement from motion vectors
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      const maxDist = 200; // Influence radius
      
      if (dist < maxDist) {
        const weight = Math.pow(1 - dist / maxDist, 2) * vector.strength;
        
        // Create oscillating motion for loop effect
        const phase = (frame % 60) / 60 * Math.PI * 2;
        const amplitude = Math.sin(phase);
        
        totalDx += vector.dx * weight * amplitude;
        totalDy += vector.dy * weight * amplitude;
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
   * Render a single frame of the animation
   */
  private renderFrame(speed: number) {
    if (!this.isAnimating) return;

    const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    const sourceData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Apply displacement to each pixel
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const displacement = this.calculateDisplacement(x, y, this.currentFrame);
        
        const sourceX = Math.round(x - displacement.dx);
        const sourceY = Math.round(y - displacement.dy);

        // Bounds checking
        if (sourceX >= 0 && sourceX < this.canvas.width && 
            sourceY >= 0 && sourceY < this.canvas.height) {
          const sourceIdx = (sourceY * this.canvas.width + sourceX) * 4;
          const targetIdx = (y * this.canvas.width + x) * 4;

          imageData.data[targetIdx] = sourceData.data[sourceIdx];
          imageData.data[targetIdx + 1] = sourceData.data[sourceIdx + 1];
          imageData.data[targetIdx + 2] = sourceData.data[sourceIdx + 2];
          imageData.data[targetIdx + 3] = sourceData.data[sourceIdx + 3];
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
