import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Satellite, MapPin, Clock, Users, Globe, Orbit, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const [showMap, setShowMap] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const fetchStationData = async () => {
    try {
      setLoading(true);
      
      // Use HTTPS endpoints to avoid CORS issues
      const issResponse = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const issData = await issResponse.json();
      
      // Fetch astronaut data
      const astroResponse = await fetch('https://api.wheretheiss.at/v1/satellites/25544/astronauts');
      let crewCount = 0;
      try {
        const astroData = await astroResponse.json();
        crewCount = astroData.length || 3; // Default to 3 if API fails
      } catch (e) {
        crewCount = 3; // ISS typically has 3-7 crew members
      }

      // Create ISS station object
      const issStation: SpaceStation = {
        name: 'International Space Station (ISS)',
        id: 25544,
        latitude: issData.latitude,
        longitude: issData.longitude,
        altitude: issData.altitude,
        velocity: issData.velocity,
        visibility: 'Live Tracking',
        timestamp: Date.now(),
        crew: crewCount,
        country: 'International'
      };

      // Mock data for other stations (in real app, you'd fetch from TLE APIs)
      const otherStations: SpaceStation[] = [
        {
          name: 'Tiangong Space Station',
          id: 48274,
          latitude: issStation.latitude + 10, // Offset for demo
          longitude: issStation.longitude - 15,
          altitude: 340,
          velocity: 27500,
          visibility: 'Simulated',
          timestamp: Date.now(),
          crew: 3,
          country: 'China'
        },
        {
          name: 'Hubble Space Telescope',
          id: 20580,
          latitude: issStation.latitude - 20,
          longitude: issStation.longitude + 25,
          altitude: 547,
          velocity: 27300,
          visibility: 'Simulated',
          timestamp: Date.now(),
          crew: 0,
          country: 'International'
        }
      ];

      const allStations = [issStation, ...otherStations];
      setStations(allStations);
      setLastUpdate(new Date());
      
      // Update map markers
      updateMapMarkers(allStations);
      
      toast.success(t('Space station data updated', '空间站数据已更新'));
    } catch (error) {
      console.error('Error fetching station data:', error);
      toast.error(t('Failed to fetch station data', '获取空间站数据失败'));
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix Leaflet default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current).setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
  };

  const updateMapMarkers = (stationData: SpaceStation[]) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    stationData.forEach(station => {
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${station.id === 25544 ? '#22c55e' : '#3b82f6'};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">
            🛰️
          </div>
        `,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([station.latitude, station.longitude], { icon })
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${station.name}</h3>
            <p style="margin: 2px 0;"><strong>Altitude:</strong> ${station.altitude} km</p>
            <p style="margin: 2px 0;"><strong>Velocity:</strong> ${station.velocity.toLocaleString()} km/h</p>
            <p style="margin: 2px 0;"><strong>Crew:</strong> ${station.crew || 0}</p>
            <p style="margin: 2px 0;"><strong>Status:</strong> ${station.visibility}</p>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current[station.id] = marker;
    });
  };

  useEffect(() => {
    if (showMap) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showMap]);

  useEffect(() => {
    fetchStationData();
    
    // Update every 10 seconds for real-time tracking
    const interval = setInterval(fetchStationData, 10000);
    
    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(4)}° ${direction}`;
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'Live Tracking': return 'bg-green-500';
      case 'Simulated': return 'bg-blue-500';
      default: return 'bg-yellow-500';
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

        <div className="flex justify-center gap-4 mb-6">
          <Button 
            onClick={fetchStationData} 
            disabled={loading}
            className="gap-2"
          >
            <Orbit className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('Updating...', '更新中...') : t('Refresh Data', '刷新数据')}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            {showMap ? t('Hide Map', '隐藏地图') : t('Show Map', '显示地图')}
          </Button>
        </div>

        {showMap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="cosmic-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t('Real-time Station Positions', '实时空间站位置')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-96 rounded-lg overflow-hidden border border-border"
                  style={{ minHeight: '400px' }}
                />
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  🟢 {t('Live ISS Position', 'ISS实时位置')} • 🔵 {t('Simulated Positions', '模拟位置')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                      if (mapInstanceRef.current && showMap) {
                        mapInstanceRef.current.setView([station.latitude, station.longitude], 5);
                        markersRef.current[station.id]?.openPopup();
                      } else {
                        setShowMap(true);
                        setTimeout(() => {
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([station.latitude, station.longitude], 5);
                            markersRef.current[station.id]?.openPopup();
                          }
                        }, 500);
                      }
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
            {t('Real-time ISS data from official APIs, updated every 10 seconds. Green markers show live positions, blue markers show simulated positions for other space stations. Click on any station card to view its location on the map.', 
               'ISS实时数据来自官方API，每10秒更新一次。绿色标记显示实时位置，蓝色标记显示其他空间站的模拟位置。点击任何空间站卡片即可在地图上查看其位置。')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceStationTracker;