import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ExternalLink, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";

const PersonalIntro = () => {
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-gradient-to-br from-cosmic-900/90 to-cosmic-800/90 border-cosmic-600/50 overflow-hidden backdrop-blur-sm shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-cosmic-600/50 shadow-lg shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-blue-300 text-2xl">
                ZC
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-cosmic-50 mb-2">Zed_Czegh (Yan Zeyu)</h2>
                <div className="flex items-center gap-2 text-cosmic-300 mb-3">
                  <GraduationCap className="h-4 w-4 text-cosmic-400" />
                  <p className="text-sm">
                    {t("MPhil/PhD Researcher at Burren College of Arts, University of Galway", 
                       "爱尔兰戈尔韦大学布伦艺术学院哲学硕士/博士研究员")}
                  </p>
                </div>
                <p className="text-cosmic-200 text-sm leading-relaxed">
                  {t("Professional fine art producer, amateur astronomer, and dark-sky advocator specializing in computational aesthetics and astrophotography. My research explores the intersection of technology, art, and the sublime experience of observing the cosmos.", 
                     "专业艺术制作人、业余天文学家和暗夜倡导者，专注于计算美学和天文摄影。我的研究探索技术、艺术和观察宇宙的崇高体验之间的交叉点。")}
                </p>
              </div>

              {/* Research & Publications */}
              <div className="bg-cosmic-800/40 rounded-lg p-4 border border-cosmic-600/30">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-cosmic-400" />
                  <h3 className="font-semibold text-cosmic-100">
                    {t("Research & Publications", "研究与出版物")}
                  </h3>
                </div>
                <div className="space-y-3">
                  {isAdmin && (
                    <div className="flex items-start gap-3 p-3 bg-cosmic-700/30 rounded border border-cosmic-600/20 hover:bg-cosmic-700/40 transition-colors">
                      <FileText className="h-5 w-5 text-fuchsia-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link to="/critical-analysis">
                          <h4 className="font-medium text-cosmic-100 hover:text-cosmic-50 transition-colors text-sm mb-1">
                            {t("Beyond the Kantian Sublime: Computational Aesthetics in Astrophotography", 
                               "超越康德式崇高：天文摄影中的计算美学")}
                          </h4>
                        </Link>
                        <p className="text-xs text-cosmic-300 mb-2">
                          {t("A critical examination of stereoscopic depth mapping, 3D volumetric star fields, parallel video generation, astronomical sonification, and mathematical universe visualization.", 
                             "对立体深度映射、3D体积星场、并行视频生成、天文声化和数学宇宙可视化的批判性研究。")}
                        </p>
                        <Link to="/critical-analysis">
                          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2 hover:bg-cosmic-600/30">
                            {t("Read Paper", "阅读论文")}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 p-3 bg-cosmic-700/30 rounded border border-cosmic-600/20 hover:bg-cosmic-700/40 transition-colors">
                    <FileText className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-cosmic-100 text-sm mb-1">
                        {t("SIQS: Stellar Imaging Quality Score System", 
                           "SIQS：恒星成像质量评分系统")}
                      </h4>
                      <p className="text-xs text-cosmic-300 mb-2">
                        {t("A comprehensive algorithm for evaluating astrophotography locations based on cloud cover, light pollution, seeing conditions, and astronomical factors.", 
                           "基于云层覆盖、光污染、视宁度和天文因素评估天文摄影位置的综合算法。")}
                      </p>
                      <a 
                        href="https://github.com/yanzeyuStarcapturer" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2 hover:bg-cosmic-600/30">
                          {t("View on GitHub", "在GitHub上查看")}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-cosmic-700/30 rounded border border-cosmic-600/20">
                    <FileText className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-cosmic-100 text-sm mb-1">
                        {t("Computational Tools for Astrophotography Processing", 
                           "天文摄影处理的计算工具")}
                      </h4>
                      <p className="text-xs text-cosmic-300">
                        {t("Suite of browser-based utilities including stereoscope processing, 3D star field generation, sonification, and mathematical analysis.", 
                           "基于浏览器的实用程序套件，包括立体镜处理、3D星场生成、声化和数学分析。")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Links */}
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://github.com/yanzeyuStarcapturer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  <Button variant="outline" size="sm" className="gap-2 border-cosmic-600 hover:border-cosmic-500 hover:bg-cosmic-700/30">
                    <ExternalLink className="h-3 w-3" />
                    {t("GitHub", "GitHub")}
                  </Button>
                </a>
                <a 
                  href="mailto:yanzeyu886@gmail.com"
                  className="text-xs"
                >
                  <Button variant="outline" size="sm" className="gap-2 border-cosmic-600 hover:border-cosmic-500 hover:bg-cosmic-700/30">
                    <ExternalLink className="h-3 w-3" />
                    {t("Contact", "联系")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalIntro;
