import { supabase } from "@/integrations/supabase/client";

export interface StarAnalysisResult {
  summary: string;
  objects: Array<{
    type: string;
    name: string;
    estimatedDistance: string;
    depthLayer: number;
    brightness: string;
    color: string;
    notes?: string;
  }>;
  stereoscopicRecommendations: {
    suggestedMaxShift: number;
    depthContrast: string;
    primaryForeground: string;
    primaryBackground: string;
    processingTips: string[];
  };
  objectClassification: {
    hasNebula: boolean;
    hasGalaxy: boolean;
    hasStarCluster: boolean;
    dominantType: string;
  };
}

export interface DepthEnhancementResult {
  depthAnalysis: {
    foregroundElements: string[];
    midgroundElements: string[];
    backgroundElements: string[];
  };
  parameters: {
    starDisplacement: number;
    nebulaDisplacement: number;
    borderSize: number;
    stereoSpacing: number;
  };
  tips: string[];
}

/**
 * Convert a blob URL or image URL to a base64 data URL
 */
async function convertToBase64DataUrl(imageUrl: string): Promise<string> {
  // If already a data URL, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // For blob URLs or regular URLs, we need to fetch and convert
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Limit size for API (max 1024px for faster processing)
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 JPEG (smaller than PNG)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for conversion'));
    };
    
    img.src = imageUrl;
  });
}

export interface PlateSolveContext {
  ra: number;
  dec: number;
  fieldRadius: number;
  pixelScale: number;
  identifiedObject?: {
    name: string;
    commonName?: string;
    distanceLY?: number;
    type: string;
  };
  objectsInField: string[];
}

export async function analyzeStarsWithAI(
  imageDataUrl: string,
  analysisType: 'star-analysis' | 'depth-enhancement' = 'star-analysis',
  plateSolveContext?: PlateSolveContext
): Promise<StarAnalysisResult | DepthEnhancementResult | null> {
  try {
    // Convert to proper base64 data URL if needed
    const base64DataUrl = await convertToBase64DataUrl(imageDataUrl);
    
    const { data, error } = await supabase.functions.invoke('analyze-stars', {
      body: {
        imageBase64: base64DataUrl,
        analysisType,
        plateSolveContext
      }
    });

    if (error) {
      console.error('AI star analysis error:', error);
      throw error;
    }

    return data?.analysis || null;
  } catch (err) {
    console.error('Failed to analyze stars with AI:', err);
    throw err;
  }
}

export function getRecommendedParams(analysis: StarAnalysisResult) {
  const recommendations = analysis.stereoscopicRecommendations;
  const classification = analysis.objectClassification;

  return {
    maxShift: recommendations.suggestedMaxShift || 30,
    objectType: classification.dominantType as 'nebula' | 'galaxy' | 'planetary' | 'mixed',
    depthContrast: recommendations.depthContrast,
    tips: recommendations.processingTips
  };
}
