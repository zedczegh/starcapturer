/**
 * Star rendering with PSF (Point Spread Function)
 */
import type { DetectedStar } from './types';

/**
 * Render star with realistic Point Spread Function
 */
export function renderStarWithPSF(ctx: CanvasRenderingContext2D, star: DetectedStar): void {
  const { x, y, size, color, brightness, type } = star;
  
  // Get canvas bounds for clipping
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  let coreSize = size;
  let midHaloSize = size * 2;
  let outerHaloSize = size * 4;
  let farOuterHaloSize = size * 6;
  
  switch (type) {
    case 'point':
      coreSize = Math.max(0.5, size * 0.8);
      midHaloSize = size * 2;
      outerHaloSize = size * 3;
      farOuterHaloSize = size * 4;
      break;
    case 'extended':
      coreSize = size;
      midHaloSize = size * 3;
      outerHaloSize = size * 5;
      farOuterHaloSize = size * 7;
      break;
    case 'saturated':
      coreSize = size * 1.5;
      midHaloSize = size * 4;
      outerHaloSize = size * 8;
      farOuterHaloSize = size * 12;
      break;
  }
  
  const { r, g, b } = color;
  
  // Layer 4: Far outer halo with bounds checking
  const farOuterGradient = ctx.createRadialGradient(x, y, outerHaloSize, x, y, farOuterHaloSize);
  farOuterGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.08})`);
  farOuterGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.05})`);
  farOuterGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.02})`);
  farOuterGradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${brightness * 0.01})`);
  farOuterGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = farOuterGradient;
  const farRectX = Math.max(0, x - farOuterHaloSize);
  const farRectY = Math.max(0, y - farOuterHaloSize);
  const farRectW = Math.min(canvasWidth - farRectX, (x + farOuterHaloSize) - farRectX);
  const farRectH = Math.min(canvasHeight - farRectY, (y + farOuterHaloSize) - farRectY);
  ctx.fillRect(farRectX, farRectY, farRectW, farRectH);
  
  // Layer 3: Outer halo with bounds checking
  const outerGradient = ctx.createRadialGradient(x, y, midHaloSize, x, y, outerHaloSize);
  outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.15})`);
  outerGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.1})`);
  outerGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.06})`);
  outerGradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${brightness * 0.03})`);
  outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = outerGradient;
  const outerRectX = Math.max(0, x - outerHaloSize);
  const outerRectY = Math.max(0, y - outerHaloSize);
  const outerRectW = Math.min(canvasWidth - outerRectX, (x + outerHaloSize) - outerRectX);
  const outerRectH = Math.min(canvasHeight - outerRectY, (y + outerHaloSize) - outerRectY);
  ctx.fillRect(outerRectX, outerRectY, outerRectW, outerRectH);
  
  // Layer 2: Mid halo with bounds checking
  const midGradient = ctx.createRadialGradient(x, y, coreSize, x, y, midHaloSize);
  midGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.4})`);
  midGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
  midGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.2})`);
  midGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${brightness * 0.1})`);
  midGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = midGradient;
  const midRectX = Math.max(0, x - midHaloSize);
  const midRectY = Math.max(0, y - midHaloSize);
  const midRectW = Math.min(canvasWidth - midRectX, (x + midHaloSize) - midRectX);
  const midRectH = Math.min(canvasHeight - midRectY, (y + midHaloSize) - midRectY);
  ctx.fillRect(midRectX, midRectY, midRectW, midRectH);
  
  // Layer 1: Core brightness with bounds checking
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
  coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness})`);
  coreGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${brightness * 0.95})`);
  coreGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${brightness * 0.85})`);
  coreGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.7})`);
  coreGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${brightness * 0.5})`);
  coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
  
  ctx.fillStyle = coreGradient;
  const coreRectX = Math.max(0, x - coreSize);
  const coreRectY = Math.max(0, y - coreSize);
  const coreRectW = Math.min(canvasWidth - coreRectX, (x + coreSize) - coreRectX);
  const coreRectH = Math.min(canvasHeight - coreRectY, (y + coreSize) - coreRectY);
  ctx.fillRect(coreRectX, coreRectY, coreRectW, coreRectH);
  
  if (brightness > 0.7 && type !== 'point') {
    renderDiffractionSpikes(ctx, star);
  }
}

/**
 * Render diffraction spikes for bright stars
 */
export function renderDiffractionSpikes(ctx: CanvasRenderingContext2D, star: DetectedStar): void {
  const { x, y, size, color, brightness } = star;
  const spikeLength = size * 8;
  const spikeWidth = Math.max(1, size * 0.3);
  
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.4})`;
  ctx.lineWidth = spikeWidth;
  ctx.lineCap = 'round';
  
  // Vertical spike
  ctx.beginPath();
  ctx.moveTo(x, y - spikeLength);
  ctx.lineTo(x, y + spikeLength);
  ctx.stroke();
  
  // Horizontal spike
  ctx.beginPath();
  ctx.moveTo(x - spikeLength, y);
  ctx.lineTo(x + spikeLength, y);
  ctx.stroke();
}

/**
 * Create precise star mask for better separation with Gaussian feathering
 */
export function createPreciseStarMask(width: number, height: number, stars: DetectedStar[]): Float32Array {
  const mask = new Float32Array(width * height);
  
  for (const star of stars) {
    let radiusMultiplier = 4;
    if (star.type === 'saturated') {
      radiusMultiplier = 8;
    } else if (star.type === 'extended') {
      radiusMultiplier = 6;
    }
    
    const radius = Math.max(3, star.size * radiusMultiplier);
    const centerX = Math.round(star.x);
    const centerY = Math.round(star.y);
    
    const sigma = radius / (star.type === 'saturated' ? 2.5 : 3.0);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          const gaussianValue = Math.exp(-(distance * distance) / (2 * sigma * sigma));
          const maskValue = Math.max(0, Math.min(1, gaussianValue));
          const idx = y * width + x;
          
          mask[idx] = Math.max(mask[idx], maskValue * star.confidence);
        }
      }
    }
  }
  
  return mask;
}
