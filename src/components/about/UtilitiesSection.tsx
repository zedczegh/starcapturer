import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Video, Music, Calculator, TrendingUp, BookOpen, ExternalLink, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";

const UtilitiesSection = () => {
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900/80 border-cosmic-700/40 overflow-hidden backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-cosmic-900 via-cosmic-800 to-cosmic-900 border-b border-cosmic-700/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="text-cosmic-400 h-6 w-6" />
              {t("Computational Aesthetics & Astrophotography Utilities", "计算美学与天文摄影实用工具")}
            </CardTitle>
            {isAdmin && (
              <Link to="/critical-analysis">
                <Button variant="outline" size="sm" className="gap-2 border-cosmic-600 hover:border-cosmic-500 hover:bg-cosmic-800">
                  <BookOpen className="h-4 w-4" />
                  {t("Critical Analysis", "批判性分析")}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 space-y-6">
          <div className="bg-gradient-to-r from-cosmic-800/50 to-cosmic-900/50 border border-cosmic-600/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-cosmic-200 font-medium mb-2">
              {t("Beyond the Kantian Sublime: Computational Tools for Three-Dimensional Astrophotography", "超越康德式崇高：三维天文摄影的计算工具")}
            </p>
            <p className="text-xs text-cosmic-300 leading-relaxed">
              {t("Our suite of specialized tools transforms two-dimensional astrophotography into experiential artistic outputs through stereoscopic depth mapping, three-dimensional star field generation, parallel video synthesis, astronomical sonification, and mathematical equation extraction. Each utility democratizes sublime astronomical experience through browser-based processing.", "我们的专业工具套件通过立体深度映射、三维星场生成、并行视频合成、天文声化和数学方程提取，将二维天文摄影转化为体验式艺术输出。每个工具都通过基于浏览器的处理来民主化崇高的天文体验。")}
            </p>
          </div>

          {/* Stereoscope Processor */}
          <div className="bg-gradient-to-br from-fuchsia-950/30 to-pink-950/30 border border-fuchsia-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 p-2.5 rounded-lg mr-3">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fuchsia-200">
                  {t("Stereoscope Processor", "立体镜处理器")}
                </h3>
                <p className="text-xs text-fuchsia-300/70">
                  {t("Create 3D stereoscopic views", "创建3D立体视图")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Transform your 2D astrophotography images into stunning 3D stereoscopic pairs. This tool uses advanced depth mapping algorithms to create parallax-based stereoscopic images.", "将您的2D天文摄影图像转换为令人惊叹的3D立体图像对。此工具使用先进的深度映射算法创建基于视差的立体图像。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-fuchsia-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Fast mode: Single-image automatic depth map generation", "快速模式：单图像自动深度图生成")}</li>
                <li>{t("Traditional mode: Starless + stars layer processing", "传统模式：星空 + 星点图层处理")}</li>
                <li>{t("Adjustable stereo spacing and depth intensity", "可调整立体间距和深度强度")}</li>
                <li>{t("Support for TIFF, FITS, and standard image formats", "支持TIFF、FITS和标准图像格式")}</li>
              </ul>
            </div>
          </div>

          {/* 3D Star Field Generator */}
          <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-2.5 rounded-lg mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-200">
                  {t("3D Star Field Generator", "3D星场生成器")}
                </h3>
                <p className="text-xs text-cyan-300/70">
                  {t("Animated 3D star field videos", "动态3D星场视频")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Convert your astrophotography images into mesmerizing 3D animated videos with realistic star field motion. Perfect for creating dynamic presentations and social media content.", "将您的天文摄影图像转换为迷人的3D动画视频，具有逼真的星场运动。非常适合创建动态演示和社交媒体内容。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-cyan-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Multiple motion types: zoom, pan, spin", "多种运动类型：缩放、平移、旋转")}</li>
                <li>{t("Adjustable depth intensity (0-200%)", "可调深度强度（0-200%）")}</li>
                <li>{t("High-quality WebM and MP4 export", "高质量WebM和MP4导出")}</li>
                <li>{t("Real-time 3D preview with Three.js rendering", "使用Three.js渲染的实时3D预览")}</li>
              </ul>
            </div>
          </div>

          {/* 3D Parallel Video Generator */}
          <div className="bg-gradient-to-br from-amber-950/30 to-orange-950/30 border border-amber-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-2.5 rounded-lg mr-3">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-200">
                  {t("3D Parallel Video Generator", "3D并联视频生成器")}
                </h3>
                <p className="text-xs text-amber-300/70">
                  {t("Side-by-side stereoscopic videos", "并排立体视频")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Generate side-by-side stereoscopic 3D videos for VR headsets and 3D displays. Creates left and right eye views with proper parallax for immersive viewing experiences.", "为VR头戴设备和3D显示器生成并排立体3D视频。创建具有适当视差的左右眼视图，提供沉浸式观看体验。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-amber-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("VR-compatible side-by-side stereo video output", "VR兼容的并排立体视频输出")}</li>
                <li>{t("Independent left/right eye depth processing", "独立的左/右眼深度处理")}</li>
                <li>{t("Customizable stereo separation and border size", "可定制的立体分离和边框大小")}</li>
                <li>{t("Full motion control with zoom, pan, and spin", "全运动控制，包括缩放、平移和旋转")}</li>
              </ul>
            </div>
          </div>

          {/* Motion Animation */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-violet-950/30 border border-indigo-700/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-2.5 rounded-lg mr-3">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-indigo-200">
                    {t("Motion Animation", "动态动画")}
                  </h3>
                  <p className="text-xs text-indigo-300/70">
                    {t("Create cinemagraph-style loops", "创建电影照片式循环")}
                  </p>
                </div>
              </div>
              <Link to="/motion-animation">
                <Button variant="outline" size="sm" className="gap-2 border-indigo-600 hover:border-indigo-500 hover:bg-indigo-800">
                  {t("Try It", "尝试")}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Transform still images into captivating animated loops with motion arrows and anchor points. Similar to Motion Leap, create cinemagraph effects with selective motion in your photos.", "使用运动箭头和锚点将静态图像转换为迷人的动画循环。类似于Motion Leap，在照片中创建具有选择性运动的电影照片效果。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-indigo-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Draw motion arrows for directional animation", "绘制运动箭头以实现方向动画")}</li>
                <li>{t("Paint anchor points to freeze areas", "绘制锚点以冻结区域")}</li>
                <li>{t("Real-time preview with adjustable speed", "具有可调速度的实时预览")}</li>
                <li>{t("Export as MP4 or WebM video format", "导出为MP4或WebM视频格式")}</li>
              </ul>
            </div>
          </div>

          {/* Sonification Processor */}
          <div className="bg-gradient-to-br from-purple-950/30 to-violet-950/30 border border-purple-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-2.5 rounded-lg mr-3">
                <Music className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-200">
                  {t("Sonification Processor", "音频化处理器")}
                </h3>
                <p className="text-xs text-purple-300/70">
                  {t("Convert images to sound", "将图像转换为声音")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Transform astronomical images into audio by converting visual data into sound frequencies. Experience your astrophotography through a new sensory dimension.", "通过将视觉数据转换为声音频率，将天文图像转换为音频。通过新的感官维度体验您的天文摄影。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-purple-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Multi-type support: deep-sky, solar, planetary, lunar", "多类型支持：深空、太阳、行星、月球")}</li>
                <li>{t("Brightness, contrast, and color mapping to frequencies", "亮度、对比度和颜色映射到频率")}</li>
                <li>{t("Real-time audio waveform visualization", "实时音频波形可视化")}</li>
                <li>{t("MP3 export for sharing and preservation", "MP3导出以供分享和保存")}</li>
              </ul>
            </div>
          </div>

          {/* Sampling Calculator */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-green-950/30 border border-emerald-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-2.5 rounded-lg mr-3">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-200">
                  {t("Sampling Calculator", "采样计算器")}
                </h3>
                <p className="text-xs text-emerald-300/70">
                  {t("Optimize your imaging setup", "优化您的成像设置")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Calculate optimal sampling rates for your telescope and camera combination. Ensures you're achieving proper Nyquist sampling for the best image quality based on your local seeing conditions.", "计算望远镜和相机组合的最佳采样率。确保您根据本地视宁度条件实现适当的奈奎斯特采样，以获得最佳图像质量。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-emerald-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Comprehensive CMOS sensor database", "全面的CMOS传感器数据库")}</li>
                <li>{t("Barlow/reducer support for effective focal length", "巴洛镜/减焦镜支持以计算有效焦距")}</li>
                <li>{t("Real-time sampling rate feedback", "实时采样率反馈")}</li>
                <li>{t("Field of view calculation", "视场计算")}</li>
              </ul>
            </div>
          </div>

          {/* Astro Math Processor */}
          <div className="bg-gradient-to-br from-orange-950/30 to-red-950/30 border border-orange-700/30 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2.5 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-200">
                  {t("Astro Math Processor", "天文数学处理器")}
                </h3>
                <p className="text-xs text-orange-300/70">
                  {t("Mathematical image analysis", "数学图像分析")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {t("Advanced mathematical analysis of astronomical images using Fourier transforms, wavelet analysis, and fractal dimension calculations. Reveals hidden patterns and structures in your data.", "使用傅里叶变换、小波分析和分形维数计算对天文图像进行高级数学分析。揭示数据中的隐藏模式和结构。")}
            </p>
            <div className="space-y-2 text-xs">
              <p className="font-medium text-orange-200">{t("Features:", "功能：")}</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                <li>{t("Fourier analysis for frequency domain inspection", "傅里叶分析用于频域检查")}</li>
                <li>{t("Wavelet decomposition for multi-scale analysis", "小波分解用于多尺度分析")}</li>
                <li>{t("Fractal dimension measurement", "分形维数测量")}</li>
                <li>{t("Mathematical image reconstruction and enhancement", "数学图像重建和增强")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UtilitiesSection;
