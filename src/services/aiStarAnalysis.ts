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

export async function analyzeStarsWithAI(
  imageDataUrl: string,
  analysisType: 'star-analysis' | 'depth-enhancement' = 'star-analysis'
): Promise<StarAnalysisResult | DepthEnhancementResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-stars', {
      body: {
        imageBase64: imageDataUrl,
        analysisType
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
