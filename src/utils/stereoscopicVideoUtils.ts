import { TraditionalMorphProcessor, type TraditionalMorphParams, type TraditionalInputs } from '@/lib/traditionalMorphMode';

/**
 * Process a rendered frame canvas into a stereoscopic side-by-side output
 * @param sourceCanvas The rendered frame canvas
 * @param starsOnlyImage Original stars-only image for star extraction
 * @param starlessImage Original starless image for background
 * @param traditionalParams Stereoscope processing parameters
 * @param stereoSpacing Spacing between left and right views
 * @param borderSize Black border around the stereo pair
 * @returns Canvas with stereoscopic side-by-side output
 */
export async function processFrameToStereoscopic(
  sourceCanvas: HTMLCanvasElement,
  starsOnlyImage: string,
  starlessImage: string,
  traditionalParams: TraditionalMorphParams,
  stereoSpacing: number,
  borderSize: number
): Promise<HTMLCanvasElement> {
  // Create temporary canvas to extract frame
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = sourceCanvas.width;
  frameCanvas.height = sourceCanvas.height;
  const frameCtx = frameCanvas.getContext('2d')!;
  frameCtx.drawImage(sourceCanvas, 0, 0);
  
  // Convert canvas to blob then to File for the processor
  const frameBlob = await new Promise<Blob>((resolve) => {
    frameCanvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
  
  // Load original images as Files
  const starsBlob = await fetch(starsOnlyImage).then(r => r.blob());
  const starlessBlob = await fetch(starlessImage).then(r => r.blob());
  
  const starsFile = new File([starsBlob], 'stars.png', { type: 'image/png' });
  const starlessFile = new File([starlessBlob], 'starless.png', { type: 'image/png' });
  
  // Process through traditional morph processor
  const processor = new TraditionalMorphProcessor();
  const inputs: TraditionalInputs = {
    starlessImage: starlessFile,
    starsOnlyImage: starsFile
  };
  
  const { leftCanvas, rightCanvas } = await processor.createTraditionalStereoPair(
    inputs,
    traditionalParams,
    (step, progress) => {
      console.log(`Stereoscopic frame processing: ${step} - ${progress}%`);
    }
  );
  
  // Create final stereo pair canvas
  const stereoCanvas = document.createElement('canvas');
  const stereoCtx = stereoCanvas.getContext('2d')!;
  
  if (borderSize > 0) {
    // Add borders
    const totalWidth = leftCanvas.width * 2 + stereoSpacing + (borderSize * 2);
    const totalHeight = leftCanvas.height + (borderSize * 2);
    
    stereoCanvas.width = totalWidth;
    stereoCanvas.height = totalHeight;
    
    // Fill with black borders
    stereoCtx.fillStyle = '#000000';
    stereoCtx.fillRect(0, 0, stereoCanvas.width, stereoCanvas.height);
    
    // Place left and right images with border offset
    stereoCtx.drawImage(leftCanvas, borderSize, borderSize);
    stereoCtx.drawImage(rightCanvas, borderSize + leftCanvas.width + stereoSpacing, borderSize);
  } else {
    // No borders
    stereoCanvas.width = leftCanvas.width * 2 + stereoSpacing;
    stereoCanvas.height = leftCanvas.height;
    
    stereoCtx.fillStyle = '#000000';
    stereoCtx.fillRect(0, 0, stereoCanvas.width, stereoCanvas.height);
    
    stereoCtx.drawImage(leftCanvas, 0, 0);
    stereoCtx.drawImage(rightCanvas, leftCanvas.width + stereoSpacing, 0);
  }
  
  // Cleanup
  processor.dispose();
  
  return stereoCanvas;
}
