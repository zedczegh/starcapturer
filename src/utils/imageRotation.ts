/**
 * Rotate an image 90 degrees clockwise
 * @param imageElement - The image element to rotate
 * @returns Promise with the rotated image data URL and new dimensions
 */
export const rotateImage90Clockwise = async (
  imageElement: HTMLImageElement
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // For 90° clockwise rotation, swap width and height
      const newWidth = imageElement.height;
      const newHeight = imageElement.width;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Translate and rotate
      ctx.translate(newWidth, 0);
      ctx.rotate(Math.PI / 2);
      
      // Draw the image
      ctx.drawImage(imageElement, 0, 0);
      
      // Get the data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      resolve({
        dataUrl,
        width: newWidth,
        height: newHeight
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Rotate and create a new image element
 * @param imageElement - The image element to rotate
 * @returns Promise with the rotated image element and data URL
 */
export const rotateAndCreateImageElement = async (
  imageElement: HTMLImageElement
): Promise<{ element: HTMLImageElement; dataUrl: string }> => {
  const { dataUrl, width, height } = await rotateImage90Clockwise(imageElement);
  
  return new Promise((resolve, reject) => {
    const newImage = new Image();
    newImage.onload = () => {
      resolve({ element: newImage, dataUrl });
    };
    newImage.onerror = () => {
      reject(new Error('Failed to load rotated image'));
    };
    newImage.src = dataUrl;
  });
};
