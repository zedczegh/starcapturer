import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  const [brushSize, setBrushSize] = useState(30);
  const [motionStrength, setMotionStrength] = useState(50);
  const [displacementAmount, setDisplacementAmount] = useState(100); // Max displacement in pixels
  const [animationSpeed, setAnimationSpeed] = useState(300); // 300% speed by default (relative to base 100)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [motionArrowStart, setMotionArrowStart] = useState<{x: number, y: number} | null>(null);
  const [motionTrailPoints, setMotionTrailPoints] = useState<{x: number, y: number}[]>([]);
  const [rangeStrokePoints, setRangeStrokePoints] = useState<{x: number, y: number}[]>([]);
  const [lastBrushPoint, setLastBrushPoint] = useState<{x: number, y: number} | null>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<Array<{ type: 'motion' | 'range' | 'erase', data: any }>>([]);

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

    // Initialize animation engine with displacement amount
    animationEngineRef.current = new MotionAnimationEngine(canvas, imageElement, displacementAmount);

  }, [imageElement, displacementAmount]);

  // When displacement amount changes, update the engine
  useEffect(() => {
    if (animationEngineRef.current) {
      animationEngineRef.current.setMaxDisplacement(displacementAmount);
    }
  }, [displacementAmount]);

  // When the animation speed changes while playing, update it dynamically
  useEffect(() => {
    const engine = animationEngineRef.current;
    if (!engine || !isPlaying) return;

    engine.updateSpeed(animationSpeed / 100);
  }, [animationSpeed, isPlaying]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "motion") {
      setIsDrawing(true);
      setMotionArrowStart({ x, y });
      setMotionTrailPoints([{ x, y }]);
    } else if (activeTool === "range" || activeTool === "erase") {
      setIsDrawing(true);
      setRangeStrokePoints([{ x, y }]);
      setLastBrushPoint({ x, y });
      // Add first point and draw initial circle
      drawBrushAtPoint(x, y);
      
      // Draw preview
      const canvas = overlayCanvasRef.current;
      if (canvas) {
        requestAnimationFrame(() => {
          redrawOverlay();
          drawContinuousBrushStroke([{ x, y }], brushSize, activeTool === "erase");
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "motion" && isDrawing && motionArrowStart) {
      // Add point to trail
      setMotionTrailPoints(prev => [...prev, { x, y }]);
      
      // Throttled redraw using requestAnimationFrame
      if (!canvas.dataset.drawing) {
        canvas.dataset.drawing = "true";
        requestAnimationFrame(() => {
          redrawOverlay();
          drawMotionTrail([...motionTrailPoints, { x, y }]);
          canvas.dataset.drawing = "";
        });
      }
    } else if ((activeTool === "range" || activeTool === "erase") && isDrawing) {
      // Only draw if moved enough distance from last point (throttle)
      if (lastBrushPoint) {
        const dist = Math.sqrt(
          Math.pow(x - lastBrushPoint.x, 2) + Math.pow(y - lastBrushPoint.y, 2)
        );
        
        // Only add point if moved at least 1/3 of brush size
        if (dist >= brushSize / 3) {
          const newPoints = [...rangeStrokePoints, { x, y }];
          setRangeStrokePoints(newPoints);
          setLastBrushPoint({ x, y });
          
          // Add to engine silently
          drawBrushAtPoint(x, y);
          
          // Draw continuous stroke preview
          if (!canvas.dataset.drawing) {
            canvas.dataset.drawing = "true";
            requestAnimationFrame(() => {
              redrawOverlay();
              drawContinuousBrushStroke(newPoints, brushSize, activeTool === "erase");
              canvas.dataset.drawing = "";
            });
          }
        }
      }
    }
  };

  const addToHistory = (type: 'motion' | 'range' | 'erase', data: any) => {
    // Remove any redo history when adding new action
    historyRef.current = historyRef.current.slice(0, historyIndex + 1);
    historyRef.current.push({ type, data });
    setHistoryIndex(historyRef.current.length - 1);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !animationEngineRef.current) return;

    if (activeTool === "motion" && motionArrowStart && motionTrailPoints.length > 1) {
      // Store entire motion trail as one action in history
      const trailData = [...motionTrailPoints];
      addToHistory('motion', { points: trailData, strength: motionStrength / 100 });

      // Add motion vectors along the trail (for animation calculation)
      for (let i = 0; i < motionTrailPoints.length - 1; i++) {
        const start = motionTrailPoints[i];
        const end = motionTrailPoints[i + 1];
        
        // Skip keyframe generation for each vector (batch mode)
        animationEngineRef.current.addMotionVector(
          start.x,
          start.y,
          end.x,
          end.y,
          motionStrength / 100,
          true
        );
      }

      // Store the trail as a single path for display (not individual vectors)
      animationEngineRef.current.addMotionTrail(trailData);
      
      // Generate keyframes once after all vectors are added
      animationEngineRef.current.updateKeyframes();
      
      setMotionArrowStart(null);
      setMotionTrailPoints([]);
      redrawOverlay();
    } else if ((activeTool === "range" || activeTool === "erase") && rangeStrokePoints.length > 0) {
      // Store the entire stroke as one history action
      const strokeData = {
        points: [...rangeStrokePoints],
        radius: brushSize
      };
      
      if (activeTool === "range") {
        addToHistory('range', strokeData);
        // Add the stroke for visualization
        animationEngineRef.current.addRangeStroke(rangeStrokePoints, brushSize);
      } else {
        addToHistory('erase', strokeData);
      }
      
      // Now generate keyframes once after the complete stroke
      animationEngineRef.current.updateKeyframes();
      
      setRangeStrokePoints([]);
      setLastBrushPoint(null);
    }

    setIsDrawing(false);
  };

  const drawMotionTrail = (points: {x: number, y: number}[]) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || points.length < 2) return;

    // Draw smooth trail line
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#3b82f6";
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
      ctx.fillStyle = "#3b82f6";
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
      animationEngineRef.current.addRangePoint(x, y, brushSize, true);
    } else if (activeTool === "erase") {
      animationEngineRef.current.removeAtPoint(x, y, brushSize, true);
    }
  };

  const drawContinuousBrushStroke = (points: {x: number, y: number}[], radius: number, isErase: boolean = false) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || points.length === 0) return;

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
      ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
    }
    
    if (points.length === 1) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !animationEngineRef.current) return;

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationEngineRef.current?.drawOverlay(ctx);
    });
  };

  const handlePlayPause = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!animationEngineRef.current || !overlayCanvas) return;

    if (isPlaying) {
      animationEngineRef.current.stop();
      // Show overlay when paused
      overlayCanvas.style.opacity = "1";
    } else {
      animationEngineRef.current.play(animationSpeed / 100);
      // Hide overlay when playing
      overlayCanvas.style.opacity = "0";
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
    if (historyIndex < 0) {
      toast.info(t("Nothing to undo", "没有可撤销的操作"));
      return;
    }

    setHistoryIndex(historyIndex - 1);
    rebuildFromHistory(historyIndex - 1);
    toast.success(t("Undo successful", "撤销成功"));
  };

  const handleRedo = () => {
    if (historyIndex >= historyRef.current.length - 1) {
      toast.info(t("Nothing to redo", "没有可重做的操作"));
      return;
    }

    setHistoryIndex(historyIndex + 1);
    rebuildFromHistory(historyIndex + 1);
    toast.success(t("Redo successful", "重做成功"));
  };

  const rebuildFromHistory = (targetIndex: number) => {
    if (!animationEngineRef.current) return;

    // Clear everything
    animationEngineRef.current.clear();

    // Rebuild from history up to targetIndex
    for (let i = 0; i <= targetIndex; i++) {
      const action = historyRef.current[i];
      
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

    // Generate keyframes once after rebuilding all history
    animationEngineRef.current.updateKeyframes();
    
    redrawOverlay();
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
    historyRef.current = [];
    setHistoryIndex(-1);
    
    // Reset all drawing state
    setIsDrawing(false);
    setMotionArrowStart(null);
    setMotionTrailPoints([]);
    setRangeStrokePoints([]);
    setLastBrushPoint(null);
    
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
    
    // Show overlay
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
              disabled={historyIndex < 0}
              title={t("Undo", "撤销")}
            >
              <Undo2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("Undo", "撤销")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= historyRef.current.length - 1}
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
              setMotionArrowStart(null);
              setMotionTrailPoints([]);
              setRangeStrokePoints([]);
              setLastBrushPoint(null);
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
                <Label>{t("Brush Size", "画笔大小")}: {brushSize}px</Label>
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => setBrushSize(value)}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            )}

            {activeTool === "motion" && (
              <div>
                <Label>{t("Motion Strength", "运动强度")}: {motionStrength}%</Label>
                <Slider
                  value={[motionStrength]}
                  onValueChange={([value]) => setMotionStrength(value)}
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
              <Label>{t("Displacement Amount", "位移量")}: {displacementAmount}px</Label>
              <Slider
                value={[displacementAmount]}
                onValueChange={([value]) => setDisplacementAmount(value)}
                min={10}
                max={200}
                step={10}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>{t("Animation Speed", "动画速度")}: {animationSpeed}%</Label>
              <Slider
                value={[animationSpeed]}
                onValueChange={([value]) => setAnimationSpeed(value)}
                min={10}
                max={200}
                step={10}
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
