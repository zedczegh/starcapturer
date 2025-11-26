export interface MotionAnimationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  rangeColor: string;
  motionColor: string;
  settings: LayerSettings;
  history: Array<{ type: 'motion' | 'range' | 'erase', data: any }>;
  historyIndex: number;
}

export interface LayerSettings {
  displacementAmount: number;
  animationSpeed: number;
  motionBlur: number;
  coreBrightening: boolean;
  reverseDirection: boolean;
  keyframeAmount: number;
  brushSize: number;
  motionStrength: number;
}

export const LAYER_COLORS = [
  { range: "#22c55e", motion: "#3b82f6" }, // Green/Blue
  { range: "#a855f7", motion: "#f97316" }, // Purple/Orange
  { range: "#ec4899", motion: "#eab308" }, // Pink/Yellow
  { range: "#06b6d4", motion: "#ef4444" }, // Cyan/Red
  { range: "#6366f1", motion: "#14b8a6" }, // Indigo/Teal
];

export const createDefaultLayerSettings = (): LayerSettings => ({
  displacementAmount: 10,
  animationSpeed: 60,
  motionBlur: 30,
  coreBrightening: false,
  reverseDirection: false,
  keyframeAmount: 12,
  brushSize: 30,
  motionStrength: 50,
});

export const createNewLayer = (index: number): MotionAnimationLayer => {
  const colorIndex = index % LAYER_COLORS.length;
  return {
    id: `layer-${Date.now()}-${index}`,
    name: `Layer ${index + 1}`,
    visible: true,
    locked: false,
    rangeColor: LAYER_COLORS[colorIndex].range,
    motionColor: LAYER_COLORS[colorIndex].motion,
    settings: createDefaultLayerSettings(),
    history: [],
    historyIndex: -1,
  };
};
