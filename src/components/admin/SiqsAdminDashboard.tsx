import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  MapPin, 
  Users, 
  TrendingUp, 
  RefreshCw,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiqsAdminData } from '@/hooks/admin/useSiqsAdminData';
import { useCountyGroupedSiqs } from '@/hooks/admin/useCountyGroupedSiqs';
import CountyGroupCard from './CountyGroupCard';
import MapProviderToggle from './MapProviderToggle';
import AMapKeyConfig from './AMapKeyConfig';
import { motion } from 'framer-motion';

const SiqsAdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const {
    photopointLocations,
    communityLocations,
    topRankedLocations,
    loading,
    error,
    refetch
  } = useSiqsAdminData();

  const [sortBy, setSortBy] = useState<'siqs' | 'count'>('siqs');

  // Group locations by county
  const { countyGroups: photopointCounties, loading: photopointGrouping } = useCountyGroupedSiqs(photopointLocations);
  const { countyGroups: communityCounties, loading: communityGrouping } = useCountyGroupedSiqs(communityLocations);
  const { countyGroups: topRankedCounties, loading: topRankedGrouping } = useCountyGroupedSiqs(topRankedLocations);

  const sortCountyGroups = (groups: any[]) => {
    if (sortBy === 'siqs') {
      return [...groups].sort((a, b) => b.avgSiqs - a.avgSiqs);
    }
    return [...groups].sort((a, b) => b.totalCalculations - a.totalCalculations);
  };

  const isGroupLoading = loading || photopointGrouping || communityGrouping || topRankedGrouping;

  const totalCalculations = 
    photopointLocations.reduce((sum, loc) => sum + loc.calculation_count, 0) +
    communityLocations.reduce((sum, loc) => sum + loc.calculation_count, 0);

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-6">
          <p className="text-red-400">{t('Error loading admin data', '加载管理员数据时出错')}: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Map Provider Settings (Admin Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapProviderToggle />
        <AMapKeyConfig />
      </div>
      
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2.5 rounded-lg">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-cosmic-100">
                  {t('SIQS Analytics Dashboard', 'SIQS分析仪表板')}
                </CardTitle>
                <p className="text-xs text-cosmic-400 mt-1">
                  {t('Admin-only data analytics and location insights', '仅限管理员的数据分析和位置洞察')}
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
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Photopoint Regions', '照片点区域')}</p>
                <p className="text-2xl font-bold text-cosmic-100">{photopointCounties.length}</p>
                <p className="text-xs text-cosmic-500 mt-0.5">{photopointLocations.length} {t('locations', '位置')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Community Regions', '社区区域')}</p>
                <p className="text-2xl font-bold text-cosmic-100">{communityCounties.length}</p>
                <p className="text-xs text-cosmic-500 mt-0.5">{communityLocations.length} {t('locations', '位置')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-cosmic-400">{t('Total Calculations', '总计算次数')}</p>
                <p className="text-2xl font-bold text-cosmic-100">{totalCalculations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-2">
        <Button
          variant={sortBy === 'siqs' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('siqs')}
          className="text-xs"
        >
          <ArrowUpDown className="h-3 w-3 mr-1.5" />
          {t('Sort by SIQS', '按SIQS排序')}
        </Button>
        <Button
          variant={sortBy === 'count' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('count')}
          className="text-xs"
        >
          <Filter className="h-3 w-3 mr-1.5" />
          {t('Sort by Count', '按次数排序')}
        </Button>
      </div>

      {/* Locations Tabs */}
      <Tabs defaultValue="ranked" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-cosmic-800/40">
          <TabsTrigger value="ranked" className="text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            {t('Top Ranked', '排名最高')}
          </TabsTrigger>
          <TabsTrigger value="photopoints" className="text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            {t('Photopoints', '照片点')}
          </TabsTrigger>
          <TabsTrigger value="community" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {t('Community', '社区')}
          </TabsTrigger>
        </TabsList>

        {/* Top Ranked Tab */}
        <TabsContent value="ranked" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-cosmic-400">
              {t('Showing top', '显示顶部')} {topRankedCounties.length} {t('regions with', '区域')} {topRankedLocations.length} {t('locations', '位置')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'siqs' ? 'count' : 'siqs')}
              className="text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              {t('Sort by', '排序')} {sortBy === 'siqs' ? t('Calculations', '计算次数') : 'SIQS'}
            </Button>
          </div>

          {isGroupLoading ? (
            <div className="text-center py-12 text-cosmic-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>{t('Loading data...', '加载数据中...')}</p>
            </div>
          ) : topRankedCounties.length === 0 ? (
            <Card className="bg-cosmic-800/40 border-cosmic-700/30">
              <CardContent className="p-8 text-center text-cosmic-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t('No ranked data available', '没有排名数据')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortCountyGroups(topRankedCounties).map((group, index) => (
                <CountyGroupCard
                  key={group.county}
                  group={group}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Photopoints Tab */}
        <TabsContent value="photopoints" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-cosmic-400">
              {t('Showing', '显示')} {photopointCounties.length} {t('regions with', '区域')} {photopointLocations.length} {t('locations', '位置')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'siqs' ? 'count' : 'siqs')}
              className="text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              {t('Sort by', '排序')} {sortBy === 'siqs' ? t('Calculations', '计算次数') : 'SIQS'}
            </Button>
          </div>

          {isGroupLoading ? (
            <div className="text-center py-12 text-cosmic-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>{t('Loading data...', '加载数据中...')}</p>
            </div>
          ) : photopointCounties.length === 0 ? (
            <Card className="bg-cosmic-800/40 border-cosmic-700/30">
              <CardContent className="p-8 text-center text-cosmic-400">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t('No photopoint data available', '没有照片点数据')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortCountyGroups(photopointCounties).map((group, index) => (
                <CountyGroupCard
                  key={group.county}
                  group={group}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-cosmic-400">
              {t('Showing', '显示')} {communityCounties.length} {t('regions with', '区域')} {communityLocations.length} {t('locations', '位置')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'siqs' ? 'count' : 'siqs')}
              className="text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              {t('Sort by', '排序')} {sortBy === 'siqs' ? t('Calculations', '计算次数') : 'SIQS'}
            </Button>
          </div>

          {isGroupLoading ? (
            <div className="text-center py-12 text-cosmic-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>{t('Loading data...', '加载数据中...')}</p>
            </div>
          ) : communityCounties.length === 0 ? (
            <Card className="bg-cosmic-800/40 border-cosmic-700/30">
              <CardContent className="p-8 text-center text-cosmic-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t('No community data available', '没有社区数据')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortCountyGroups(communityCounties).map((group, index) => (
                <CountyGroupCard
                  key={group.county}
                  group={group}
                  index={index}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SiqsAdminDashboard;
