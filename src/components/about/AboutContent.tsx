
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Telescope, Star, CloudSun, Compass, MountainSnow, Award, Settings } from "lucide-react";

const AboutContent = () => {
  const { language, t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-4">
          {t ? t("About SIQS", "关于SIQS") : "About SIQS"}
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          {t
            ? t(
                "The Stellar Imaging Quality Score is a revolutionary system for astrophotographers to find and evaluate perfect shooting locations.",
                "恒星影像质量评分是一个革命性系统，帮助天文摄影师找到和评估完美的拍摄地点。"
              )
            : "The Stellar Imaging Quality Score is a revolutionary system for astrophotographers to find and evaluate perfect shooting locations."}
        </p>
      </header>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Star className="mr-2 text-yellow-400" />
          {t ? t("What is SIQS?", "什么是SIQS？") : "What is SIQS?"}
        </h2>
        
        <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md mb-8">
          <p className="mb-4">
            {t
              ? t(
                  "SIQS (Stellar Imaging Quality Score) is a comprehensive metric designed to evaluate the suitability of a location for astrophotography. It combines multiple environmental factors into a single score on a scale of 0-10.",
                  "SIQS（恒星影像质量评分）是一个综合指标，旨在评估一个地点对天文摄影的适宜性。它将多个环境因素综合为一个0-10分的单一评分。"
                )
              : "SIQS (Stellar Imaging Quality Score) is a comprehensive metric designed to evaluate the suitability of a location for astrophotography. It combines multiple environmental factors into a single score on a scale of 0-10."}
          </p>
          <p>
            {t
              ? t(
                  "Unlike existing metrics that focus on just one factor like light pollution, SIQS provides a complete assessment by incorporating cloud cover, seeing conditions, wind, humidity, and more.",
                  "与仅关注光污染等单一因素的现有指标不同，SIQS通过结合云覆盖、视宁度、风力、湿度等多个因素提供全面评估。"
                )
              : "Unlike existing metrics that focus on just one factor like light pollution, SIQS provides a complete assessment by incorporating cloud cover, seeing conditions, wind, humidity, and more."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">
              {t ? t("For Photographers", "对摄影师") : "For Photographers"}
            </h3>
            <p>
              {t
                ? t(
                    "SIQS helps you identify optimal locations and timing for your astrophotography sessions, saving you time and increasing your chances of capturing spectacular images.",
                    "SIQS帮助您确定天文摄影的最佳地点和时机，节省您的时间并提高拍摄壮观图像的几率。"
                  )
                : "SIQS helps you identify optimal locations and timing for your astrophotography sessions, saving you time and increasing your chances of capturing spectacular images."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-xl font-semibold mb-3 text-teal-400">
              {t ? t("For Researchers", "对研究人员") : "For Researchers"}
            </h3>
            <p>
              {t
                ? t(
                    "The SIQS methodology provides a standardized way to compare observing conditions across different locations and time periods, useful for astronomical research planning.",
                    "SIQS方法学提供了一种标准化方法来比较不同地点和时间段的观测条件，有助于天文研究规划。"
                  )
                : "The SIQS methodology provides a standardized way to compare observing conditions across different locations and time periods, useful for astronomical research planning."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Settings className="mr-2 text-blue-400" />
          {t ? t("How SIQS Works", "SIQS如何工作") : "How SIQS Works"}
        </h2>
        
        <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md mb-8">
          <p className="mb-4">
            {t
              ? t(
                  "SIQS uses advanced algorithms to analyze and weight multiple factors that affect astrophotography conditions. Each factor is individually scored and then combined using a weighted average.",
                  "SIQS使用先进的算法分析和权衡影响天文摄影条件的多种因素。每个因素都会单独评分，然后使用加权平均值进行合并。"
                )
              : "SIQS uses advanced algorithms to analyze and weight multiple factors that affect astrophotography conditions. Each factor is individually scored and then combined using a weighted average."}
          </p>
          <p>
            {t
              ? t(
                  "The system prioritizes the most critical factors for imaging quality while accounting for the varying impact of each element on different types of astrophotography.",
                  "该系统优先考虑对成像质量最重要的因素，同时考虑每个元素对不同类型天文摄影的不同影响。"
                )
              : "The system prioritizes the most critical factors for imaging quality while accounting for the varying impact of each element on different types of astrophotography."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex items-center mb-4">
              <CloudSun className="text-yellow-400 mr-3" />
              <h3 className="text-xl font-semibold">
                {t ? t("Real-time Weather", "实时天气") : "Real-time Weather"}
              </h3>
            </div>
            <p className="text-gray-300">
              {t
                ? t(
                    "SIQS incorporates current and forecasted weather data including cloud cover, humidity, and wind speed to predict imaging conditions.",
                    "SIQS整合当前和预测的天气数据，包括云覆盖率、湿度和风速，以预测拍摄条件。"
                  )
                : "SIQS incorporates current and forecasted weather data including cloud cover, humidity, and wind speed to predict imaging conditions."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex items-center mb-4">
              <Compass className="text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">
                {t ? t("Light Pollution", "光污染") : "Light Pollution"}
              </h3>
            </div>
            <p className="text-gray-300">
              {t
                ? t(
                    "Using the Bortle Dark-Sky Scale and light pollution maps, SIQS evaluates how artificial light affects the visibility of celestial objects.",
                    "使用Bortle暗空量表和光污染地图，SIQS评估人造光对天体可见度的影响。"
                  )
                : "Using the Bortle Dark-Sky Scale and light pollution maps, SIQS evaluates how artificial light affects the visibility of celestial objects."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex items-center mb-4">
              <Telescope className="text-teal-400 mr-3" />
              <h3 className="text-xl font-semibold">
                {t ? t("Atmospheric Seeing", "大气视宁度") : "Atmospheric Seeing"}
              </h3>
            </div>
            <p className="text-gray-300">
              {t
                ? t(
                    "SIQS measures atmospheric stability which directly impacts image sharpness and detail, especially for planetary and lunar photography.",
                    "SIQS测量大气稳定性，这直接影响图像的清晰度和细节，尤其是对行星和月球摄影。"
                  )
                : "SIQS measures atmospheric stability which directly impacts image sharpness and detail, especially for planetary and lunar photography."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <MountainSnow className="mr-2 text-teal-400" />
          {t ? t("Key SIQS Factors", "SIQS关键因素") : "Key SIQS Factors"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">
              {t ? t("Cloud Cover", "云覆盖") : "Cloud Cover"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "Perhaps the most critical factor. SIQS analyzes both current cloud cover and nighttime forecast to determine if the sky will be clear for imaging.",
                    "可能是最关键的因素。SIQS分析当前云覆盖和夜间预报，以确定天空是否适合成像。"
                  )
                : "Perhaps the most critical factor. SIQS analyzes both current cloud cover and nighttime forecast to determine if the sky will be clear for imaging."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">
              {t ? t("Light Pollution", "光污染") : "Light Pollution"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "Using the Bortle scale (1-9), SIQS evaluates how artificial light affects the visibility of faint celestial objects and nebulae.",
                    "使用Bortle量表（1-9），SIQS评估人造光如何影响微弱天体和星云的可见度。"
                  )
                : "Using the Bortle scale (1-9), SIQS evaluates how artificial light affects the visibility of faint celestial objects and nebulae."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-teal-400">
              {t ? t("Seeing Conditions", "视宁度条件") : "Seeing Conditions"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "Atmospheric stability affects image sharpness. SIQS incorporates seeing data, which is especially important for high-magnification imaging.",
                    "大气稳定性影响图像清晰度。SIQS结合视宁度数据，这对高倍率成像尤为重要。"
                  )
                : "Atmospheric stability affects image sharpness. SIQS incorporates seeing data, which is especially important for high-magnification imaging."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-purple-400">
              {t ? t("Moon Phase", "月相") : "Moon Phase"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "The moon's brightness significantly impacts deep-sky imaging. SIQS factors in the current moon phase and position when calculating overall conditions.",
                    "月亮的亮度显著影响深空成像。SIQS在计算整体条件时考虑当前月相和位置。"
                  )
                : "The moon's brightness significantly impacts deep-sky imaging. SIQS factors in the current moon phase and position when calculating overall conditions."}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-indigo-400">
              {t ? t("Wind Speed", "风速") : "Wind Speed"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "Affects telescope stability. High winds can cause vibrations and tracking issues in long-exposure photography.",
                    "影响望远镜稳定性。强风可能导致长曝光摄影中的振动和跟踪问题。"
                  )
                : "Affects telescope stability. High winds can cause vibrations and tracking issues in long-exposure photography."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-cyan-400">
              {t ? t("Humidity", "湿度") : "Humidity"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "High humidity can lead to dew formation on optics and can reduce transparency, affecting image contrast and detail.",
                    "高湿度可能导致光学元件结露，并降低透明度，影响图像对比度和细节。"
                  )
                : "High humidity can lead to dew formation on optics and can reduce transparency, affecting image contrast and detail."}
            </p>
          </div>
          
          <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
            <h3 className="text-lg font-semibold mb-3 text-emerald-400">
              {t ? t("Air Quality", "空气质量") : "Air Quality"}
            </h3>
            <p className="text-gray-300">
              {t
                ? t(
                    "Particulates in the air can scatter light and reduce transparency. SIQS considers AQI when available for more accurate predictions.",
                    "空气中的颗粒物可以散射光线并降低透明度。SIQS在可用时考虑AQI以提供更准确的预测。"
                  )
                : "Particulates in the air can scatter light and reduce transparency. SIQS considers AQI when available for more accurate predictions."}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Award className="mr-2 text-yellow-400" />
          {t ? t("SIQS Score Interpretation", "SIQS评分解读") : "SIQS Score Interpretation"}
        </h2>
        
        <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md mb-8">
          <p className="mb-6">
            {t
              ? t(
                  "SIQS provides a score on a scale of 0-10, with higher scores indicating better imaging conditions:",
                  "SIQS提供0-10分的评分，分数越高表示拍摄条件越好："
                )
              : "SIQS provides a score on a scale of 0-10, with higher scores indicating better imaging conditions:"}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h4 className="font-semibold text-emerald-400">8.0 - 10.0: {t ? t("Outstanding", "极佳") : "Outstanding"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Perfect conditions for all types of astrophotography. Exceptional transparency and stability.",
                        "适合所有类型天文摄影的完美条件。卓越的透明度和稳定性。"
                      )
                    : "Perfect conditions for all types of astrophotography. Exceptional transparency and stability."}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-blue-400">7.0 - 7.9: {t ? t("Excellent", "优秀") : "Excellent"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Great conditions for all types of imaging. Minimal limitations.",
                        "适合所有类型成像的良好条件。极少限制。"
                      )
                    : "Great conditions for all types of imaging. Minimal limitations."}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-teal-400">6.0 - 6.9: {t ? t("Very Good", "很好") : "Very Good"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Good conditions for most imaging. Some minor limitations may be present.",
                        "适合大多数成像的良好条件。可能存在一些小限制。"
                      )
                    : "Good conditions for most imaging. Some minor limitations may be present."}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-yellow-400">5.0 - 5.9: {t ? t("Good", "良好") : "Good"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Decent conditions with some limitations. May require specific techniques for best results.",
                        "尚可的条件，有一些限制。可能需要特定技术才能获得最佳效果。"
                      )
                    : "Decent conditions with some limitations. May require specific techniques for best results."}
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <h4 className="font-semibold text-amber-400">4.0 - 4.9: {t ? t("Fair", "一般") : "Fair"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Moderate conditions with notable limitations. Better for bright targets or lunar/planetary.",
                        "有明显限制的中等条件。更适合明亮目标或月球/行星。"
                      )
                    : "Moderate conditions with notable limitations. Better for bright targets or lunar/planetary."}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-orange-400">3.0 - 3.9: {t ? t("Below Average", "低于平均") : "Below Average"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Poor conditions with significant limitations. Consider visual observation instead.",
                        "有显著限制的较差条件。考虑改为目视观测。"
                      )
                    : "Poor conditions with significant limitations. Consider visual observation instead."}
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-rose-400">2.0 - 2.9: {t ? t("Poor", "较差") : "Poor"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Very poor conditions. Only the brightest objects will be visible and imageable.",
                        "非常差的条件。只有最亮的天体才能被看见和拍摄。"
                      )
                    : "Very poor conditions. Only the brightest objects will be visible and imageable."}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-500">0.0 - 1.9: {t ? t("Very Poor", "极差") : "Very Poor"}</h4>
                <p className="text-sm text-gray-300">
                  {t
                    ? t(
                        "Extremely poor conditions. Not suitable for any kind of astronomical observation or imaging.",
                        "极其恶劣的条件。不适合任何类型的天文观测或成像。"
                      )
                    : "Extremely poor conditions. Not suitable for any kind of astronomical observation or imaging."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Star className="mr-2 text-blue-400" />
          {t ? t("Future Development", "未来发展") : "Future Development"}
        </h2>
        
        <div className="bg-cosmic-900/60 p-6 rounded-lg shadow-lg backdrop-blur-md">
          <p className="mb-4">
            {t
              ? t(
                  "The SIQS system continues to evolve with ongoing research and development. Future enhancements include:",
                  "SIQS系统随着持续的研究和开发不断发展。未来的增强包括："
                )
              : "The SIQS system continues to evolve with ongoing research and development. Future enhancements include:"}
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>
              {t
                ? t(
                    "Integration with more specialized weather models focused on astronomical seeing and transparency",
                    "与更专注于天文视宁度和透明度的专业天气模型集成"
                  )
                : "Integration with more specialized weather models focused on astronomical seeing and transparency"}
            </li>
            <li>
              {t
                ? t(
                    "Target-specific SIQS calculations that optimize for particular types of astrophotography",
                    "针对特定类型天文摄影优化的目标特定SIQS计算"
                  )
                : "Target-specific SIQS calculations that optimize for particular types of astrophotography"}
            </li>
            <li>
              {t
                ? t(
                    "Advanced machine learning algorithms to improve prediction accuracy based on historical imaging results",
                    "基于历史成像结果的先进机器学习算法，以提高预测准确性"
                  )
                : "Advanced machine learning algorithms to improve prediction accuracy based on historical imaging results"}
            </li>
            <li>
              {t
                ? t(
                    "Mobile apps with push notifications for optimal imaging conditions at your favorite locations",
                    "具有推送通知功能的移动应用程序，提醒您喜爱地点的最佳拍摄条件"
                  )
                : "Mobile apps with push notifications for optimal imaging conditions at your favorite locations"}
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AboutContent;
