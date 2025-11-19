import { useState, useCallback, useRef } from 'react';

export interface StarLayer {
  x: number;
  y: number;
  scale: number;
}

export interface StarLayers {
  layer1: ImageBitmap | null;
  layer2: ImageBitmap | null;
  layer3: ImageBitmap | null;
  layer4: ImageBitmap | null;
  layer5: ImageBitmap | null;
  layer6: ImageBitmap | null;
  layer7: ImageBitmap | null;
  layer8: ImageBitmap | null;
  layer9: ImageBitmap | null;
  layer10: ImageBitmap | null;
  layer11: ImageBitmap | null;
  layer12: ImageBitmap | null;
}

export interface LayerOffsets {
  layer1: StarLayer;
  layer2: StarLayer;
  layer3: StarLayer;
  layer4: StarLayer;
  layer5: StarLayer;
  layer6: StarLayer;
  layer7: StarLayer;
  layer8: StarLayer;
  layer9: StarLayer;
  layer10: StarLayer;
  layer11: StarLayer;
  layer12: StarLayer;
  background: StarLayer;
}

/**
 * Custom hook to manage star layers and their offsets
 */
export function useStarLayers() {
  const [starLayers, setStarLayers] = useState<StarLayers>({ 
    layer1: null, layer2: null, layer3: null, layer4: null, 
    layer5: null, layer6: null, layer7: null, layer8: null,
    layer9: null, layer10: null, layer11: null, layer12: null,
  });

  const offsetsRef = useRef<LayerOffsets>({
    layer1: { x: 0, y: 0, scale: 1 },
    layer2: { x: 0, y: 0, scale: 1 },
    layer3: { x: 0, y: 0, scale: 1 },
    layer4: { x: 0, y: 0, scale: 1 },
    layer5: { x: 0, y: 0, scale: 1 },
    layer6: { x: 0, y: 0, scale: 1 },
    layer7: { x: 0, y: 0, scale: 1 },
    layer8: { x: 0, y: 0, scale: 1 },
    layer9: { x: 0, y: 0, scale: 1 },
    layer10: { x: 0, y: 0, scale: 1 },
    layer11: { x: 0, y: 0, scale: 1 },
    layer12: { x: 0, y: 0, scale: 1 },
    background: { x: 0, y: 0, scale: 1 }
  });

  const updateLayerOffset = useCallback((layerKey: keyof LayerOffsets, offset: StarLayer) => {
    offsetsRef.current[layerKey] = offset;
  }, []);

  return {
    starLayers,
    setStarLayers,
    offsetsRef,
    updateLayerOffset
  };
}
