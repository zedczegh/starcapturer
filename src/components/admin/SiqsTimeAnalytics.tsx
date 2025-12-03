import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  TrendingUp,
  RefreshCw,
  BarChart3,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiqsTimeStats, TimePeriod, GroupedTimeStats } from '@/hooks/admin/useSiqsTimeStats';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const sourceLabels: Record<string, { en: string; zh: string; color: string }> = {
  search: { en: 'Photopoint', zh: '照片点', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  community: { en: 'Community', zh: '社区', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  calculator: { en: 'Calculator', zh: '计算器', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  unknown: { en: 'Unknown', zh: '未知', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
};

const PeriodStatsCard: React.FC<{ 
  stats: GroupedTimeStats; 
  index: number;
  period: TimePeriod;
}> = ({ stats, index, period }) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(index === 0);

  const formatPeriodLabel = (label: string, p: TimePeriod) => {
    if (p === 'year') return label;
    if (p === 'month') {
      const [year, month] = label.split('-');
      const monthNames = language === 'zh' 
        ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return label;
  };

  const getDaysLabel = (days: number) => {
    if (language === 'zh') {
      return `${days} 天数据`;
    }
    return days === 1 ? '1 day of data' : `${days} days of data`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-cosmic-800/40 border-cosmic-700/30 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-cosmic-700/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    {period === 'day' && <Calendar className="h-4 w-4 text-amber-400" />}
                    {period === 'month' && <CalendarDays className="h-4 w-4 text-amber-400" />}
                    {period === 'year' && <CalendarRange className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-cosmic-100">
                      {formatPeriodLabel(stats.period_label, period)}
                    </CardTitle>
                    <p className="text-xs text-cosmic-400 mt-0.5">
                      {stats.total_calculations} {t('calculations', '次计算')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">
                      {stats.overall_avg_siqs.toFixed(1)}
                    </p>
                    <p className="text-xs text-cosmic-500">{getDaysLabel(stats.unique_days)}</p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-cosmic-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-cosmic-400" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-2 border-t border-cosmic-700/30">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-cosmic-900/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-cosmic-400">{t('Min', '最小')}</p>
                  <p className="text-sm font-semibold text-cosmic-200">{stats.overall_min_siqs.toFixed(1)}</p>
                </div>
                <div className="bg-cosmic-900/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-cosmic-400">{t('Max', '最大')}</p>
                  <p className="text-sm font-semibold text-cosmic-200">{stats.overall_max_siqs.toFixed(1)}</p>
                </div>
                <div className="bg-cosmic-900/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-cosmic-400">{t('Locations', '位置')}</p>
                  <p className="text-sm font-semibold text-cosmic-200">{stats.unique_locations}</p>
                </div>
              </div>

              {/* By Source Breakdown */}
              <div className="space-y-2">
                <p className="text-xs text-cosmic-400 font-medium">{t('By Source', '按来源')}</p>
                {stats.by_source.map((source, idx) => {
                  const sourceInfo = sourceLabels[source.source] || sourceLabels.unknown;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between bg-cosmic-900/30 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${sourceInfo.color}`}>
                          {language === 'zh' ? sourceInfo.zh : sourceInfo.en}
                        </Badge>
                        <span className="text-xs text-cosmic-400">
                          {source.calculation_count} {t('calc', '次')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-cosmic-200">
                        {source.avg_siqs.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
};

const SiqsTimeAnalytics: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    period,
    setPeriod,
    groupedStats,
    summary,
    loading,
    error,
    refetch
  } = useSiqsTimeStats('month');

  const periodOptions: { value: TimePeriod; labelEn: string; labelZh: string; icon: React.ReactNode }[] = [
    { value: 'day', labelEn: 'Daily', labelZh: '按天', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'month', labelEn: 'Monthly', labelZh: '按月', icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { value: 'year', labelEn: 'Yearly', labelZh: '按年', icon: <CalendarRange className="h-3.5 w-3.5" /> }
  ];

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-6">
          <p className="text-red-400">{t('Error loading time analytics', '加载时间分析时出错')}: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2.5 rounded-lg">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-cosmic-100">
                  {t('Time-Based Analytics', '时间分析')}
                </CardTitle>
                <p className="text-xs text-cosmic-400 mt-1">
                  {t('SIQS scores aggregated by time period', 'SIQS分数按时间段汇总')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              {t('Refresh', '刷新')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {periodOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(opt.value)}
                className={`text-xs ${period === opt.value ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
              >
                {opt.icon}
                <span className="ml-1.5">{t(opt.labelEn, opt.labelZh)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <CalendarDays className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Total Days', '总天数')}</p>
                <p className="text-xl font-bold text-cosmic-100">{summary.totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Total Calculations', '总计算次数')}</p>
                <p className="text-xl font-bold text-cosmic-100">{summary.totalCalculations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Overall Avg SIQS', '整体平均SIQS')}</p>
                <p className="text-xl font-bold text-amber-400">{summary.overallAvgSiqs.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Cards */}
      {loading ? (
        <div className="text-center py-12 text-cosmic-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>{t('Loading time analytics...', '加载时间分析中...')}</p>
        </div>
      ) : groupedStats.length === 0 ? (
        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-8 text-center text-cosmic-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t('No time-based data available', '没有时间数据')}</p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={period}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {groupedStats.map((stats, index) => (
              <PeriodStatsCard 
                key={stats.period_label} 
                stats={stats} 
                index={index}
                period={period}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default SiqsTimeAnalytics;
