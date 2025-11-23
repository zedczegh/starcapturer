import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowRight, 
  Anchor, 
  Eraser, 
  Play, 
  Pause, 
  Download, 
  RotateCcw,
  Hand
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

type Tool = "motion" | "anchor" | "erase" | "pan";

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
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [motionArrowStart, setMotionArrowStart] = useState<{x: number, y: number} | null>(null);

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

    // Initialize animation engine
    animationEngineRef.current = new MotionAnimationEngine(canvas, imageElement);

  }, [imageElement]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "motion") {
      setMotionArrowStart({ x, y });
    } else if (activeTool === "anchor" || activeTool === "erase") {
      setIsDrawing(true);
      drawBrush(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "motion" && motionArrowStart) {
      // Draw temporary arrow
      redrawOverlay();
      drawArrow(motionArrowStart.x, motionArrowStart.y, x, y);
    } else if ((activeTool === "anchor" || activeTool === "erase") && isDrawing) {
      drawBrush(x, y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !animationEngineRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "motion" && motionArrowStart) {
      // Add motion vector
      animationEngineRef.current.addMotionVector(
        motionArrowStart.x,
        motionArrowStart.y,
        x,
        y,
        motionStrength / 100
      );
      setMotionArrowStart(null);
      redrawOverlay();
    }

    setIsDrawing(false);
  };

  const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = "#3b82f6";
    ctx.fillStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawBrush = (x: number, y: number) => {
    if (!animationEngineRef.current) return;

    if (activeTool === "anchor") {
      animationEngineRef.current.addAnchorPoint(x, y, brushSize);
    } else if (activeTool === "erase") {
      animationEngineRef.current.removeAtPoint(x, y, brushSize);
    }

    redrawOverlay();
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !animationEngineRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animationEngineRef.current.drawOverlay(ctx);
  };

  const handlePlayPause = () => {
    if (!animationEngineRef.current) return;

    if (isPlaying) {
      animationEngineRef.current.stop();
    } else {
      animationEngineRef.current.play(animationSpeed / 100);
    }
    setIsPlaying(!isPlaying);
  };

  const handleExport = async () => {
    if (!animationEngineRef.current) return;

    try {
      toast.info(t("Generating animation...", "生成动画中..."));
      const blob = await animationEngineRef.current.export("mp4", 30, 3);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `motion-animation-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t("Animation exported!", "动画已导出！"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("Failed to export animation", "导出动画失败"));
    }
  };

  const handleClear = () => {
    if (!animationEngineRef.current) return;
    animationEngineRef.current.clear();
    redrawOverlay();
    toast.success(t("Canvas cleared", "画布已清空"));
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
              variant={activeTool === "anchor" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("anchor")}
            >
              <Anchor className="w-4 h-4 mr-2" />
              {t("Anchor", "锚点")}
            </Button>
            <Button
              variant={activeTool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("erase")}
            >
              <Eraser className="w-4 h-4 mr-2" />
              {t("Erase", "擦除")}
            </Button>
            <Button
              variant={activeTool === "pan" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTool("pan")}
            >
              <Hand className="w-4 h-4 mr-2" />
              {t("Pan", "平移")}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  {t("Pause", "暂停")}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t("Play", "播放")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("Clear", "清空")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              {t("Export", "导出")}
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
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              setMotionArrowStart(null);
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
            {(activeTool === "anchor" || activeTool === "erase") && (
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
