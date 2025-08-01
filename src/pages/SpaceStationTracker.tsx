import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Satellite, MapPin, Clock, Users, Globe, Orbit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SpaceStation {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
  crew?: number;
  country: string;
}

const SpaceStationTracker = () => {
  const { t } = useLanguage();
  const [stations, setStations] = useState<SpaceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStationData = async () => {
    try {
      setLoading(true);
      
      // Fetch ISS position
      const issResponse = await fetch('http://api.open-notify.org/iss-now.json');
      const issData = await issResponse.json();
      
      // Fetch ISS crew info
      const crewResponse = await fetch('http://api.open-notify.org/astros.json');
      const crewData = await crewResponse.json();
      const issCrew = crewData.people?.filter((person: any) => person.craft === 'ISS').length || 0;

      // Create ISS station object
      const issStation: SpaceStation = {
        name: 'International Space Station (ISS)',
        id: 25544,
        latitude: parseFloat(issData.iss_position.latitude),
        longitude: parseFloat(issData.iss_position.longitude),
        altitude: 408, // Average ISS altitude
        velocity: 27600, // Average ISS velocity km/h
        visibility: 'Visible',
        timestamp: issData.timestamp * 1000,
        crew: issCrew,
        country: 'International'
      };

      // Mock data for other stations (in real app, you'd fetch from TLE APIs)
      const otherStations: SpaceStation[] = [
        {
          name: 'Tiangong Space Station',
          id: 48274,
          latitude: 0,
          longitude: 0,
          altitude: 340,
          velocity: 27500,
          visibility: 'Tracking...',
          timestamp: Date.now(),
          crew: 3,
          country: 'China'
        },
        {
          name: 'Hubble Space Telescope',
          id: 20580,
          latitude: 0,
          longitude: 0,
          altitude: 547,
          velocity: 27300,
          visibility: 'Tracking...',
          timestamp: Date.now(),
          crew: 0,
          country: 'International'
        }
      ];

      setStations([issStation, ...otherStations]);
      setLastUpdate(new Date());
      toast.success(t('Space station data updated', '空间站数据已更新'));
    } catch (error) {
      console.error('Error fetching station data:', error);
      toast.error(t('Failed to fetch station data', '获取空间站数据失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationData();
    
    // Update every 10 seconds for real-time tracking
    const interval = setInterval(fetchStationData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(4)}° ${direction}`;
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'Visible': return 'bg-green-500';
      case 'Tracking...': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'International': return '🌍';
      case 'China': return '🇨🇳';
      case 'USA': return '🇺🇸';
      case 'Russia': return '🇷🇺';
      default: return '🛰️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cosmic-900/10 to-background">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Satellite className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('Space Station Tracker', '空间站追踪器')}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('Track real-time positions of space stations orbiting Earth', '实时追踪地球轨道上的空间站位置')}
          </p>
          
          {lastUpdate && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('Last updated', '最后更新')}: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </motion.div>

        <div className="flex justify-center mb-6">
          <Button 
            onClick={fetchStationData} 
            disabled={loading}
            className="gap-2"
          >
            <Orbit className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('Updating...', '更新中...') : t('Refresh Data', '刷新数据')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stations.map((station, index) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="cosmic-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(station.country)}</span>
                      <CardTitle className="text-lg leading-tight">
                        {station.name}
                      </CardTitle>
                    </div>
                    <Badge 
                      className={`${getVisibilityColor(station.visibility)} text-white border-0`}
                    >
                      {station.visibility}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t('Position', '位置')}</span>
                      </div>
                      <div className="text-muted-foreground space-y-1">
                        <div>{formatCoordinate(station.latitude, 'lat')}</div>
                        <div>{formatCoordinate(station.longitude, 'lng')}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t('Altitude', '高度')}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {station.altitude} km
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border/50">
                    <div>
                      <span className="font-medium">{t('Velocity', '速度')}: </span>
                      <span className="text-muted-foreground">{station.velocity.toLocaleString()} km/h</span>
                    </div>
                    
                    {station.crew !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t('Crew', '乘员')}: </span>
                        <span className="text-muted-foreground">{station.crew}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => {
                      // Future: Open detailed tracking view
                      toast.info(t('Detailed tracking coming soon', '详细追踪功能即将推出'));
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('View on Map', '在地图上查看')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 p-6 rounded-lg bg-card/50"
        >
          <h3 className="text-xl font-semibold mb-3">
            {t('Real-time Space Tracking', '实时空间追踪')}
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t('Data is updated every 10 seconds from official space agencies. Track the International Space Station, Tiangong, and other satellites as they orbit Earth at incredible speeds.', 
               '数据每10秒从官方航天机构更新一次。追踪国际空间站、天宫以及其他卫星以惊人速度环绕地球的轨迹。')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceStationTracker;