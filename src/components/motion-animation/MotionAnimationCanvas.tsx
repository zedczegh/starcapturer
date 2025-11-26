import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowRight, 
  RectangleEllipsis,
  Eraser, 
  Play, 
  Pause, 
  Download, 
  RotateCcw,
  Undo2,
  Redo2
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MotionAnimationEngine } from "@/utils/motionAnimationEngine";
import { LayerPanel } from "./LayerPanel";
import { MotionAnimationLayer, createNewLayer } from "@/types/motionAnimationLayer";

interface MotionAnimationCanvasProps {
  imageDataUrl: string;
  imageElement: HTMLImageElement;
  onReset: () => void;
}

type Tool = "motion" | "range" | "erase";

export const MotionAnimationCanvas = ({ 
  imageDataUrl, 
  imageElement,
  onReset 
}: MotionAnimationCanvasProps) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationEngineRef = useRef<MotionAnimationEngine | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>("motion");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Layer management
  const [layers, setLayers] = useState<MotionAnimationLayer[]>([createNewLayer(0)]);
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0].id);
  
  // Use refs for drawing state to avoid closure issues and enable immediate updates
  const motionArrowStartRef = useRef<{x: number, y: number} | null>(null);
  const motionTrailPointsRef = useRef<{x: number, y: number}[]>([]);
  const rangeStrokePointsRef = useRef<{x: number, y: number}[]>([]);
  const lastBrushPointRef = useRef<{x: number, y: number} | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const keyframeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const layerEnginesRef = useRef<Map<string, MotionAnimationEngine>>(new Map());
  const layerVisibilityRef = useRef<Map<string, boolean>>(new Map());
  
  // Get active layer
  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];
  const { settings } = activeLayer;

  // Initialize canvas and animation engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    if (!canvas || !overlayCanvas || !imageElement) return;

    const ctx = canvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    
    if (!ctx || !overlayCtx) return;

    // Set canvas size to match container while maintaining aspect ratio
    const maxWidth = Math.min(window.innerWidth - 32, 1200);
    const maxHeight = 800;
    const scale = Math.min(maxWidth / imageElement.width, maxHeight / imageElement.height, 1);
    
    canvas.width = imageElement.width * scale;
    canvas.height = imageElement.height * scale;
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    // Draw image
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Initialize engines for all layers
    layerEnginesRef.current.clear();
    layerVisibilityRef.current.clear();
    layers.forEach(layer => {
      const engine = new MotionAnimationEngine(
        canvas, 
        imageElement, 
        layer.settings.displacementAmount, 
        layer.settings.motionBlur, 
        layer.settings.coreBrightening
      );
      engine.setReverseDirection(layer.settings.reverseDirection);
      engine.setNumKeyframes(layer.settings.keyframeAmount);
      layerEnginesRef.current.set(layer.id, engine);
      layerVisibilityRef.current.set(layer.id, layer.visible);
    });
    
    // Set active engine ref for backward compatibility
    animationEngineRef.current = layerEnginesRef.current.get(activeLayerId) || null;
 
    // Show overlay initially so users can see their strokes
    overlayCanvas.style.opacity = "1";

    // Cleanup on unmount
    return () => {
      if (keyframeDebounceRef.current) {
        clearTimeout(keyframeDebounceRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [imageElement, layers]);

  // Update active layer's engine when settings change
  useEffect(() => {
    const engine = layerEnginesRef.current.get(activeLayerId);
    if (!engine) return;
    
    engine.setMaxDisplacement(settings.displacementAmount);
    engine.setMotionBlur(settings.motionBlur);
    engine.setCoreBrightening(settings.coreBrightening);
    engine.setReverseDirection(settings.reverseDirection);
    engine.setNumKeyframes(settings.keyframeAmount);
    
    if (isPlaying) {
      engine.updateSpeed(settings.animationSpeed / 100);
    }
    
    // Update main ref for backward compatibility
    animationEngineRef.current = engine;
  }, [activeLayerId, settings, isPlaying]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Account for canvas display size vs internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeTool === "motion") {
      setIsDrawing(true);
      motionArrowStartRef.current = { x, y };
      motionTrailPointsRef.current = [{ x, y }];
    } else if (activeTool === "range" || activeTool === "erase") {
      setIsDrawing(true);
      rangeStrokePointsRef.current = [{ x, y }];
      lastBrushPointRef.current = { x, y };
      // Add first point silently (no preview)
      drawBrushAtPoint(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Account for canvas display size vs internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (activeTool === "motion" && motionArrowStartRef.current) {
      // Add point to trail and draw it in real-time
      motionTrailPointsRef.current.push({ x, y });
      scheduleRedraw();
    } else if ((activeTool === "range" || activeTool === "erase")) {
      // Only draw if moved enough distance from last point
      const lastPoint = lastBrushPointRef.current;
      if (lastPoint) {
        const dist = Math.sqrt(
          Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
        );
        
        // Only add point if moved at least 1/3 of brush size
        if (dist >= settings.brushSize / 3) {
          rangeStrokePointsRef.current.push({ x, y });
          lastBrushPointRef.current = { x, y };
          
          // Add to engine and draw in real-time
          drawBrushAtPoint(x, y);
          scheduleRedraw();
        }
      }
    }
  };

  // Debounced keyframe generation to prevent freezing during rapid strokes
  const scheduleKeyframeGeneration = () => {
    // Clear any pending generation
    if (keyframeDebounceRef.current) {
      clearTimeout(keyframeDebounceRef.current);
    }
    
    // Schedule new generation after 300ms of inactivity
    keyframeDebounceRef.current = setTimeout(() => {
      if (animationEngineRef.current) {
        animationEngineRef.current.updateKeyframes();
      }
      keyframeDebounceRef.current = null;
    }, 300);
  };

  // Throttle redraw using RAF to prevent flickering
  const scheduleRedraw = () => {
    if (rafIdRef.current !== null) return; // Already scheduled
    
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      // Clear and redraw all visible layers' overlays
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      layerEnginesRef.current.forEach((engine, layerId) => {
        if (layerVisibilityRef.current.get(layerId) !== false) {
          engine.drawOverlay(ctx);
        }
      });

      // Draw current drawing in real-time
      if (activeTool === "motion" && motionTrailPointsRef.current.length > 1) {
        drawMotionTrail(motionTrailPointsRef.current);
      } else if ((activeTool === "range" || activeTool === "erase") && rangeStrokePointsRef.current.length > 0) {
        drawContinuousBrushStroke(rangeStrokePointsRef.current, settings.brushSize, activeTool === "erase");
      }
    });
  };

  const addToHistory = (type: 'motion' | 'range' | 'erase', data: any) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id !== activeLayerId) return layer;
      
      // Remove any redo history when adding new action
      const newHistory = layer.history.slice(0, layer.historyIndex + 1);
      newHistory.push({ type, data });
      
      return {
        ...layer,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    }));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !animationEngineRef.current) return;

    if (activeTool === "motion" && motionArrowStartRef.current && motionTrailPointsRef.current.length > 1) {
      // Store entire motion trail as one action in history
      const trailData = [...motionTrailPointsRef.current];
      addToHistory('motion', { points: trailData, strength: settings.motionStrength / 100 });

      // Add motion vectors along the trail (for animation calculation)
      for (let i = 0; i < trailData.length - 1; i++) {
        const start = trailData[i];
        const end = trailData[i + 1];
        
        // Skip keyframe generation for each vector (batch mode)
        animationEngineRef.current.addMotionVector(
          start.x,
          start.y,
          end.x,
          end.y,
          settings.motionStrength / 100,
          true
        );
      }

      // Store the trail as a single path for display (not individual vectors)
      animationEngineRef.current.addMotionTrail(trailData);
      
      motionArrowStartRef.current = null;
      motionTrailPointsRef.current = [];
      
      // Show the completed stroke immediately (cursor preview will be shown if still hovering)
      redrawOverlay();
    } else if ((activeTool === "range" || activeTool === "erase") && rangeStrokePointsRef.current.length > 0) {
      // Store the entire stroke as one history action
      const strokeData = {
        points: [...rangeStrokePointsRef.current],
        radius: settings.brushSize
      };
      
      if (activeTool === "range") {
        addToHistory('range', strokeData);
        // Add the stroke for visualization
        animationEngineRef.current.addRangeStroke(rangeStrokePointsRef.current, settings.brushSize);
      } else {
        addToHistory('erase', strokeData);
      }
      
      
      rangeStrokePointsRef.current = [];
      lastBrushPointRef.current = null;
      
      // Show the completed stroke immediately (cursor preview will be shown if still hovering)
      redrawOverlay();
    }

    setIsDrawing(false);
  };

  const drawMotionTrail = (points: {x: number, y: number}[]) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || points.length < 2) return;

    // Use active layer motion color
    const motionColor = activeLayer.motionColor;
    
    // Draw smooth trail line
    ctx.strokeStyle = motionColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = motionColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw arrowhead at the end
    if (points.length >= 2) {
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
      const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);
      const headLength = 15;

      ctx.shadowBlur = 0;
      ctx.fillStyle = motionColor;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(
        last.x - headLength * Math.cos(angle - Math.PI / 6),
        last.y - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        last.x - headLength * Math.cos(angle + Math.PI / 6),
        last.y - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawBrushAtPoint = (x: number, y: number) => {
    if (!animationEngineRef.current) return;

    // Don't draw individual points - we'll draw the entire stroke at once
    // Just add to the engine silently
    if (activeTool === "range") {
      animationEngineRef.current.addRangePoint(x, y, settings.brushSize, true);
    } else if (activeTool === "erase") {
      animationEngineRef.current.removeAtPoint(x, y, settings.brushSize, true);
    }
  };

  const drawContinuousBrushStroke = (points: {x: number, y: number}[], radius: number, isErase: boolean = false) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || points.length === 0) return;

    // Use active layer range color
    const rangeColor = activeLayer.rangeColor;
    
    // Draw smooth continuous stroke
    ctx.beginPath();
    
    if (points.length === 1) {
      // Single point - draw as circle
      ctx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
    } else {
      // Multiple points - create smooth stroke path
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      
      // Connect to last point
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      
      // Create offset path for stroke width
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    
    if (isErase) {
      ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
      ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
    } else {
      // Use layer color with transparency
      const rgb = hexToRgb(rangeColor);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    }
    
    if (points.length === 1) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 34, g: 197, b: 94 };
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all visible layers' overlays
    layerEnginesRef.current.forEach((engine, layerId) => {
      if (layerVisibilityRef.current.get(layerId) !== false) {
        engine.drawOverlay(ctx);
      }
    });
  };

  const handlePlayPause = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!animationEngineRef.current || !overlayCanvas) return;

    if (isPlaying) {
      animationEngineRef.current.stop();
      // Show overlay with drawn elements when paused
      redrawOverlay();
      overlayCanvas.style.opacity = "1";
    } else {
      // Show loading notification
      toast.info(t("Preparing preview...", "准备预览中..."));
      
      // Generate keyframes on demand when starting playback to avoid blocking during drawing
      animationEngineRef.current.updateKeyframes();
      animationEngineRef.current.play(settings.animationSpeed / 100);
      // Hide overlay when playing to show animation
      overlayCanvas.style.opacity = "0";
      
      // Dismiss loading after a short delay
      setTimeout(() => {
        toast.success(t("Preview ready!", "预览就绪！"));
      }, 500);
    }
    setIsPlaying(!isPlaying);
  };

  const handleExport = async () => {
    if (!animationEngineRef.current) return;

    try {
      toast.info(t("Generating animation...", "生成动画中..."));
      const blob = await animationEngineRef.current.export("webm", 30, 6);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `motion-animation-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t("Animation exported!", "动画已导出！"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("Failed to export animation", "导出动画失败"));
    }
  };

  const handleUndo = () => {
    if (activeLayer.historyIndex < 0) {
      toast.info(t("Nothing to undo", "没有可撤销的操作"));
      return;
    }

    setLayers(prev => prev.map(layer => {
      if (layer.id !== activeLayerId) return layer;
      return { ...layer, historyIndex: layer.historyIndex - 1 };
    }));
    
    rebuildFromHistory(activeLayer.historyIndex - 1);
    toast.success(t("Undo successful", "撤销成功"));
  };

  const handleRedo = () => {
    if (activeLayer.historyIndex >= activeLayer.history.length - 1) {
      toast.info(t("Nothing to redo", "没有可重做的操作"));
      return;
    }

    setLayers(prev => prev.map(layer => {
      if (layer.id !== activeLayerId) return layer;
      return { ...layer, historyIndex: layer.historyIndex + 1 };
    }));
    
    rebuildFromHistory(activeLayer.historyIndex + 1);
    toast.success(t("Redo successful", "重做成功"));
  };

  const rebuildFromHistory = (targetIndex: number) => {
    if (!animationEngineRef.current) return;

    // Clear everything
    animationEngineRef.current.clear();

    // Rebuild from history up to targetIndex
    for (let i = 0; i <= targetIndex; i++) {
      const action = activeLayer.history[i];
      if (!action) continue;
      
      if (action.type === 'motion') {
        const { points, strength } = action.data;
        // Add motion vectors for animation (skip keyframe generation in batch)
        for (let j = 0; j < points.length - 1; j++) {
          const start = points[j];
          const end = points[j + 1];
          animationEngineRef.current.addMotionVector(
            start.x,
            start.y,
            end.x,
            end.y,
            strength,
            true
          );
        }
        // Add trail for display
        animationEngineRef.current.addMotionTrail(points);
      } else if (action.type === 'range') {
        // Handle both old single-point format and new stroke format
        if (action.data.points) {
          // New stroke format - add all points in the stroke (skip keyframe generation in batch)
          const { points, radius } = action.data;
          for (const point of points) {
            animationEngineRef.current.addRangePoint(point.x, point.y, radius, true);
          }
          // Add the stroke for visualization
          animationEngineRef.current.addRangeStroke(points, radius);
        } else {
          // Old single-point format
          const { x, y, radius } = action.data;
          animationEngineRef.current.addRangePoint(x, y, radius, true);
        }
      } else if (action.type === 'erase') {
        // Handle both old single-point format and new stroke format
        if (action.data.points) {
          // New stroke format - erase all points in the stroke (skip keyframe generation in batch)
          const { points, radius } = action.data;
          for (const point of points) {
            animationEngineRef.current.removeAtPoint(point.x, point.y, radius, true);
          }
        } else {
          // Old single-point format
          const { x, y, radius } = action.data;
          animationEngineRef.current.removeAtPoint(x, y, radius, true);
        }
      }
    }

    // Only show overlay if paused; keyframes are generated lazily on play
    if (!isPlaying) {
      redrawOverlay();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!animationEngineRef.current || !canvas || !overlayCanvas) return;
    
    // Stop animation if playing
    if (isPlaying) {
      animationEngineRef.current.stop();
      setIsPlaying(false);
    }
    
    // Clear the animation engine (motion vectors, trails, range points)
    animationEngineRef.current.clear();
    
    // Clear history
    setLayers(prev => prev.map(layer => {
      if (layer.id !== activeLayerId) return layer;
      return { ...layer, history: [], historyIndex: -1 };
    }));
    
    // Reset all drawing state
    motionArrowStartRef.current = null;
    motionTrailPointsRef.current = [];
    rangeStrokePointsRef.current = [];
    lastBrushPointRef.current = null;
    setIsDrawing(false);
    
    // Clear and redraw original image on main canvas
    const ctx = canvas.getContext("2d");
    if (ctx && imageElement) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    }
    
    // Clear overlay canvas completely
    const overlayCtx = overlayCanvas.getContext("2d");
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    
    // Remove any dataset flags
    delete canvas.dataset.drawing;
    delete overlayCanvas.dataset.drawing;
    
    // Keep overlay visible so strokes remain visible
    overlayCanvas.style.opacity = "1";
    
    toast.success(t("Reset complete - all animations cleared", "重置完成 - 所有动画已清除"));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="bg-cosmic-800/60 border-primary/20 backdrop-blur-xl p-3 sm:p-4 mx-3 sm:mx-0">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTool === "motion" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("motion")}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {t("Motion", "运动")}
            </Button>
            <Button
              variant={activeTool === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("range")}
            >
              <RectangleEllipsis className="w-4 h-4 mr-2" />
              {t("Range Select", "范围选择")}
            </Button>
            <Button
              variant={activeTool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("erase")}
            >
              <Eraser className="w-4 h-4 mr-2" />
              {t("Erase", "擦除")}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={activeLayer.historyIndex < 0}
              title={t("Undo", "撤销")}
            >
              <Undo2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Undo", "撤销")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={activeLayer.historyIndex >= activeLayer.history.length - 1}
              title={t("Redo", "重做")}
            >
              <Redo2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Redo", "重做")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Pause", "暂停")}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("Play", "播放")}</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              title={t("Reset - Clear all animations and return to original image", "重置 - 清除所有动画并返回原始图像")}
            >
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Reset", "重置")}</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Export", "导出")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Layer Panel */}
      <LayerPanel
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={(id) => {
          const layer = layers.find(l => l.id === id);
          if (layer && !layer.locked) {
            setActiveLayerId(id);
          }
        }}
        onAddLayer={() => {
          const newLayer = createNewLayer(layers.length);
          setLayers([...layers, newLayer]);
          setActiveLayerId(newLayer.id);
          
          // Initialize engine for new layer
          const canvas = canvasRef.current;
          if (canvas && imageElement) {
            const engine = new MotionAnimationEngine(
              canvas, 
              imageElement, 
              newLayer.settings.displacementAmount, 
              newLayer.settings.motionBlur, 
              newLayer.settings.coreBrightening
            );
            engine.setReverseDirection(newLayer.settings.reverseDirection);
            engine.setNumKeyframes(newLayer.settings.keyframeAmount);
            layerEnginesRef.current.set(newLayer.id, engine);
          }
          
          toast.success(t("Layer added", "图层已添加"));
        }}
        onDeleteLayer={(id) => {
          if (layers.length === 1) {
            toast.error(t("Cannot delete the last layer", "无法删除最后一个图层"));
            return;
          }
          
          // Remove layer engine
          layerEnginesRef.current.delete(id);
          
          // Remove layer
          const newLayers = layers.filter(l => l.id !== id);
          setLayers(newLayers);
          
          // Select another layer if active was deleted
          if (id === activeLayerId) {
            setActiveLayerId(newLayers[0].id);
          }
          
          toast.success(t("Layer deleted", "图层已删除"));
        }}
        onToggleVisibility={(id) => {
          setLayers(prev => prev.map(layer => {
            if (layer.id === id) {
              const newVisible = !layer.visible;
              layerVisibilityRef.current.set(id, newVisible);
              return { ...layer, visible: newVisible };
            }
            return layer;
          }));
          redrawOverlay();
        }}
        onToggleLock={(id) => {
          setLayers(prev => prev.map(layer => 
            layer.id === id ? { ...layer, locked: !layer.locked } : layer
          ));
        }}
      />

      {/* Canvas Area */}
      <Card className="bg-cosmic-800/40 border-primary/20 backdrop-blur-xl overflow-hidden mx-0 sm:mx-0 rounded-none sm:rounded-lg border-l-0 border-r-0 sm:border-l sm:border-r">
        <div className="relative w-full" style={{ aspectRatio: `${imageElement.width}/${imageElement.height}` }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              motionArrowStartRef.current = null;
              motionTrailPointsRef.current = [];
              rangeStrokePointsRef.current = [];
              lastBrushPointRef.current = null;
            }}
          />
        </div>
      </Card>

      {/* Settings Panel */}
      <Card className="bg-cosmic-800/60 border-primary/20 backdrop-blur-xl p-4 sm:p-6 mx-3 sm:mx-0">
        <Tabs defaultValue="tool" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-cosmic-900/60">
            <TabsTrigger value="tool">{t("Tool Settings", "工具设置")}</TabsTrigger>
            <TabsTrigger value="animation">{t("Animation", "动画")}</TabsTrigger>
          </TabsList>

          <TabsContent value="tool" className="space-y-6 mt-4">
            {(activeTool === "range" || activeTool === "erase") && (
              <div>
                <Label>{t("Brush Size", "画笔大小")}: {settings.brushSize}px</Label>
                <Slider
                  value={[settings.brushSize]}
                  onValueChange={([value]) => {
                    setLayers(prev => prev.map(layer =>
                      layer.id === activeLayerId 
                        ? { ...layer, settings: { ...layer.settings, brushSize: value } }
                        : layer
                    ));
                  }}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            )}

            {activeTool === "motion" && (
              <div>
                <Label>{t("Motion Strength", "运动强度")}: {settings.motionStrength}%</Label>
                <Slider
                  value={[settings.motionStrength]}
                  onValueChange={([value]) => {
                    setLayers(prev => prev.map(layer =>
                      layer.id === activeLayerId 
                        ? { ...layer, settings: { ...layer.settings, motionStrength: value } }
                        : layer
                    ));
                  }}
                  min={1}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="animation" className="space-y-6 mt-4">
            <div>
              <Label>{t("Displacement Amount", "位移量")}: {settings.displacementAmount}px</Label>
              <Slider
                value={[settings.displacementAmount]}
                onValueChange={([value]) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, displacementAmount: value } }
                      : layer
                  ));
                }}
                min={0}
                max={200}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>{t("Animation Speed", "动画速度")}: {settings.animationSpeed}%</Label>
              <Slider
                value={[settings.animationSpeed]}
                onValueChange={([value]) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, animationSpeed: value } }
                      : layer
                  ));
                }}
                min={10}
                max={200}
                step={10}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>{t("Motion Blur", "运动模糊")}: {settings.motionBlur}%</Label>
              <Slider
                value={[settings.motionBlur]}
                onValueChange={([value]) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, motionBlur: value } }
                      : layer
                  ));
                }}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>{t("Core Brightening", "核心增亮")}</Label>
              <Switch
                checked={settings.coreBrightening}
                onCheckedChange={(checked) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, coreBrightening: checked } }
                      : layer
                  ));
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>{t("Opposite Direction", "反向运动")}</Label>
              <Switch
                checked={settings.reverseDirection}
                onCheckedChange={(checked) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, reverseDirection: checked } }
                      : layer
                  ));
                }}
              />
            </div>

            <div>
              <Label>{t("Keyframe Amount", "关键帧数量")}: {settings.keyframeAmount}</Label>
              <Slider
                value={[settings.keyframeAmount]}
                onValueChange={([value]) => {
                  setLayers(prev => prev.map(layer =>
                    layer.id === activeLayerId 
                      ? { ...layer, settings: { ...layer.settings, keyframeAmount: value } }
                      : layer
                  ));
                }}
                min={2}
                max={60}
                step={1}
                className="mt-2"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onReset} className="flex-1">
            {t("Upload New Image", "上传新图片")}
          </Button>
        </div>
      </Card>
    </div>
  );
};
