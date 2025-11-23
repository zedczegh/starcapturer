import { useState } from "react";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { MotionAnimationUploader } from "@/components/motion-animation/MotionAnimationUploader";
import { MotionAnimationCanvas } from "@/components/motion-animation/MotionAnimationCanvas";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MotionAnimation() {
  const { t } = useLanguage();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const handleImageUpload = (dataUrl: string, element: HTMLImageElement) => {
    setUploadedImage(dataUrl);
    setImageElement(element);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setImageElement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 via-cosmic-800 to-cosmic-900">
      <NavBar />
      
      <div className="w-full mx-auto px-0 sm:px-4 py-6 sm:py-8 pt-16 sm:pt-20 sm:max-w-7xl">
        <div className="mb-6 sm:mb-8 px-3 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent mb-2">
            {t("Motion Animation", "动态动画")}
          </h1>
          <p className="text-cosmic-300 text-xs sm:text-sm">
            {t("Create stunning animated loops from your photos", "从照片创建令人惊叹的动画循环")}
          </p>
        </div>

        {!uploadedImage ? (
          <div className="px-3 sm:px-0">
            <MotionAnimationUploader onImageUpload={handleImageUpload} />
          </div>
        ) : (
          <div className="px-0 sm:px-0">
            <MotionAnimationCanvas 
              imageDataUrl={uploadedImage}
              imageElement={imageElement!}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Tutorial Section */}
        <Card className="mt-6 bg-cosmic-800/60 border-primary/20 backdrop-blur-xl mx-3 sm:mx-0">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t("How to Use", "使用方法")}
            </h3>
            <Tabs defaultValue="motion" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-cosmic-900/60">
                <TabsTrigger value="motion" className="text-xs sm:text-sm">
                  {t("Motion", "运动")}
                </TabsTrigger>
                <TabsTrigger value="range" className="text-xs sm:text-sm">
                  {t("Range", "范围")}
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm">
                  {t("Settings", "设置")}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="motion" className="space-y-2 mt-4">
                <p className="text-sm text-cosmic-300">
                  • {t("Draw arrows to indicate motion direction and intensity", "绘制箭头以指示运动方向和强度")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Longer arrows create faster motion", "较长的箭头产生更快的运动")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Multiple arrows create complex motion patterns", "多个箭头创建复杂的运动模式")}
                </p>
              </TabsContent>
              
              <TabsContent value="range" className="space-y-2 mt-4">
                <p className="text-sm text-cosmic-300">
                  • {t("Paint areas that should move with animation", "绘制应随动画移动的区域")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Only selected areas will be animated", "只有选定的区域会被动画化")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Use larger brush for bigger areas", "使用更大的画笔绘制更大的区域")}
                </p>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-2 mt-4">
                <p className="text-sm text-cosmic-300">
                  • {t("Adjust animation speed and smoothness", "调整动画速度和平滑度")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Control loop duration and quality", "控制循环持续时间和质量")}
                </p>
                <p className="text-sm text-cosmic-300">
                  • {t("Export as MP4 or WebM format", "导出为 MP4 或 WebM 格式")}
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
