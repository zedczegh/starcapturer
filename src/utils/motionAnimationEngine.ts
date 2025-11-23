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
  private motionVectors: MotionVector[] = [];
  private motionTrails: MotionTrail[] = [];
  private rangePoints: RangePoint[] = [];
  private animationFrame: number | null = null;
  private currentFrame: number = 0;
  private isAnimating: boolean = false;
  private workCanvas: HTMLCanvasElement;
  private workCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, sourceImage: HTMLImageElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sourceImage = sourceImage;
    
    // Resize canvas to max 1080p for performance
    const maxDimension = 1920;
    let width = sourceImage.width;
    let height = sourceImage.height;
    
    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(maxDimension / width, maxDimension / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Create work canvas for efficient processing
    this.workCanvas = document.createElement('canvas');
    this.workCanvas.width = width;
    this.workCanvas.height = height;
    this.workCtx = this.workCanvas.getContext("2d")!;
    
    // Draw original image to both canvases
    this.ctx.drawImage(sourceImage, 0, 0, width, height);
    this.workCtx.drawImage(sourceImage, 0, 0, width, height);
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

    // Check if pixel is in a range point with feathering
    let rangeWeight = 0;
    
    if (this.rangePoints.length === 0) {
      rangeWeight = 1; // If no range points, animate everything
    } else {
      for (const range of this.rangePoints) {
        const dist = Math.sqrt((x - range.x) ** 2 + (y - range.y) ** 2);
        if (dist < range.radius) {
          // Feathering: full strength at center, fades at edges
          const featherDistance = 20; // pixels to fade over
          const edgeDist = range.radius - dist;
          if (edgeDist < featherDistance) {
            rangeWeight = Math.max(rangeWeight, edgeDist / featherDistance);
          } else {
            rangeWeight = 1;
          }
        }
      }
    }

    // If not in range, no movement
    if (rangeWeight === 0) {
      return { dx: 0, dy: 0 };
    }

    // Calculate displacement from motion vectors
    for (const vector of this.motionVectors) {
      const dist = Math.sqrt((x - vector.x) ** 2 + (y - vector.y) ** 2);
      const maxDist = 200; // Influence radius
      
      if (dist < maxDist) {
        const weight = Math.pow(1 - dist / maxDist, 2) * vector.strength;
        
        // Create smooth oscillating motion for loop effect
        const phase = (frame % 60) / 60 * Math.PI * 2;
        const amplitude = Math.sin(phase);
        
        totalDx += vector.dx * weight * amplitude;
        totalDy += vector.dy * weight * amplitude;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      return {
        dx: (totalDx / totalWeight) * rangeWeight,
        dy: (totalDy / totalWeight) * rangeWeight
      };
    }

    return { dx: 0, dy: 0 };
  }

  /**
   * Render a single frame of the animation using canvas transforms (much faster)
   */
  private renderFrame(speed: number) {
    if (!this.isAnimating) return;

    // Clear main canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate animation phase
    const phase = (this.currentFrame % 60) / 60 * Math.PI * 2;
    const amplitude = Math.sin(phase);

    // If no motion vectors, just draw the work canvas
    if (this.motionVectors.length === 0) {
      this.ctx.drawImage(this.workCanvas, 0, 0);
      this.currentFrame += speed;
      this.animationFrame = requestAnimationFrame(() => this.renderFrame(speed));
      return;
    }

    // Draw the base image
    this.ctx.drawImage(this.workCanvas, 0, 0);

    // Apply displacement effect in chunks for affected areas
    const chunkSize = 32; // Process in 32x32 chunks for better performance
    
    for (let cy = 0; cy < this.canvas.height; cy += chunkSize) {
      for (let cx = 0; cx < this.canvas.width; cx += chunkSize) {
        const centerX = cx + chunkSize / 2;
        const centerY = cy + chunkSize / 2;
        
        // Check if this chunk is affected by any motion vector or range point
        let isAffected = false;
        let rangeWeight = this.rangePoints.length === 0 ? 1 : 0;
        
        // Check range points
        if (this.rangePoints.length > 0) {
          for (const range of this.rangePoints) {
            const dist = Math.sqrt((centerX - range.x) ** 2 + (centerY - range.y) ** 2);
            if (dist < range.radius + chunkSize) {
              rangeWeight = 1;
              break;
            }
          }
        }
        
        if (rangeWeight === 0) continue; // Skip chunks outside range
        
        // Check motion vectors
        for (const vector of this.motionVectors) {
          const dist = Math.sqrt((centerX - vector.x) ** 2 + (centerY - vector.y) ** 2);
          if (dist < 250) { // 200 + chunkSize buffer
            isAffected = true;
            break;
          }
        }
        
        if (!isAffected) continue;
        
        // Calculate average displacement for this chunk
        const displacement = this.calculateDisplacement(centerX, centerY, this.currentFrame);
        
        if (Math.abs(displacement.dx) < 0.5 && Math.abs(displacement.dy) < 0.5) continue;
        
        // Apply displacement to this chunk
        const actualWidth = Math.min(chunkSize, this.canvas.width - cx);
        const actualHeight = Math.min(chunkSize, this.canvas.height - cy);
        
        try {
          const chunkData = this.workCtx.getImageData(cx, cy, actualWidth, actualHeight);
          this.ctx.putImageData(
            chunkData,
            cx + displacement.dx,
            cy + displacement.dy
          );
        } catch (e) {
          // Skip chunks that go out of bounds
        }
      }
    }

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
    
    // Redraw original image from work canvas
    this.ctx.drawImage(this.workCanvas, 0, 0);
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
