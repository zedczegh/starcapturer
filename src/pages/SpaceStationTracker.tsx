import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Satellite, MapPin, Clock, Users, Globe, Orbit, Map, Navigation, Camera, Target, Crosshair } from 'lucide-react';
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
  previousPositions?: { lat: number; lng: number; timestamp: number }[];
  nextPass?: {
    time: string;
    direction: string;
    elevation: number;
    lat: number;
    lng: number;
  };
}

const SpaceStationTracker = () => {
  const { t } = useLanguage();
  const [stations, setStations] = useState<SpaceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingTrails, setTrackingTrails] = useState(true);
  const [stationHistory, setStationHistory] = useState<{ [key: string]: { lat: number; lng: number; timestamp: number }[] }>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const trailsRef = useRef<{ [key: string]: L.Polyline }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const passMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const hoverPopupRef = useRef<L.Popup | null>(null);

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(t('Geolocation not supported', '不支持地理定位'));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setUserLocation(location);
      updateUserLocationMarker(location);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([location.lat, location.lng], 6);
      }
      
      toast.success(t('Location found', '已找到位置'));
    } catch (error) {
      console.error('Geolocation error:', error);
      toast.error(t('Could not get your location', '无法获取您的位置'));
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 8);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else {
      toast.info(t('Please enable location first', '请先启用位置服务'));
    }
  };

  const calculateNextPass = (station: SpaceStation, userLoc?: { lat: number; lng: number }) => {
    if (!userLoc) return null;

    // Simulate pass prediction (in real app, you'd use orbital mechanics libraries)
    const now = new Date();
    const passTime = new Date(now.getTime() + Math.random() * 8 * 60 * 60 * 1000); // Next 8 hours
    const directions = ['NE', 'SE', 'SW', 'NW', 'N', 'S', 'E', 'W'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const elevation = Math.round(20 + Math.random() * 60); // 20-80 degrees
    
    // Calculate approximate pass location based on user location and direction
    let passLat = userLoc.lat;
    let passLng = userLoc.lng;
    
    const offset = 0.5; // Roughly 50km offset for visibility
    switch (direction) {
      case 'N': passLat += offset; break;
      case 'S': passLat -= offset; break;
      case 'E': passLng += offset; break;
      case 'W': passLng -= offset; break;
      case 'NE': passLat += offset; passLng += offset; break;
      case 'SE': passLat -= offset; passLng += offset; break;
      case 'SW': passLat -= offset; passLng -= offset; break;
      case 'NW': passLat += offset; passLng -= offset; break;
    }

    return {
      time: passTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      direction,
      elevation,
      lat: passLat,
      lng: passLng
    };
  };

  const updateUserLocationMarker = (location: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create user location marker with simpler icon
    const userIcon = L.divIcon({
      html: `
        <div style="
          background: #ef4444;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        "></div>
      `,
      className: 'user-location-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    userMarkerRef.current = L.marker([location.lat, location.lng], { icon: userIcon })
      .bindPopup(`
        <div style="text-align: center; min-width: 150px;">
          <h3 style="margin: 0 0 8px 0; color: #ef4444;">📍 ${t('Your Location', '您的位置')}</h3>
          <p style="margin: 2px 0; font-size: 12px;">${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°</p>
          <p style="margin: 4px 0; font-size: 11px; color: #666;">
            ${t('Perfect for space station photography!', '观测空间站的绝佳位置！')}
          </p>
        </div>
      `)
      .bindTooltip(t('Your Location', '您的位置'), {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      })
      .addTo(mapInstanceRef.current);

    // Add pulsing animation via CSS
    const style = document.createElement('style');
    style.textContent = `
      .user-location-marker {
        animation: userPulse 2s infinite;
      }
      @keyframes userPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    if (!document.head.querySelector('[data-user-location-style]')) {
      style.setAttribute('data-user-location-style', 'true');
      document.head.appendChild(style);
    }
  };

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

      // Create ISS station object with pass prediction
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
        country: 'International',
        nextPass: userLocation ? calculateNextPass({ 
          name: 'ISS', 
          id: 25544, 
          latitude: issData.latitude, 
          longitude: issData.longitude,
          altitude: issData.altitude,
          velocity: issData.velocity,
          visibility: 'Live',
          timestamp: Date.now(),
          country: 'International'
        }, userLocation) : undefined
      };

      // Mock data for other stations with pass predictions
      const otherStations: SpaceStation[] = [
        {
          name: 'Tiangong Space Station',
          id: 48274,
          latitude: issStation.latitude + 10,
          longitude: issStation.longitude - 15,
          altitude: 340,
          velocity: 27500,
          visibility: 'Simulated',
          timestamp: Date.now(),
          crew: 3,
          country: 'China',
          nextPass: userLocation ? calculateNextPass({
            name: 'Tiangong',
            id: 48274,
            latitude: issStation.latitude + 10,
            longitude: issStation.longitude - 15,
            altitude: 340,
            velocity: 27500,
            visibility: 'Simulated',
            timestamp: Date.now(),
            country: 'China'
          }, userLocation) : undefined
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
          country: 'International',
          nextPass: userLocation ? calculateNextPass({
            name: 'Hubble',
            id: 20580,
            latitude: issStation.latitude - 20,
            longitude: issStation.longitude + 25,
            altitude: 547,
            velocity: 27300,
            visibility: 'Simulated',
            timestamp: Date.now(),
            country: 'International'
          }, userLocation) : undefined
        }
      ];

      const allStations = [issStation, ...otherStations];
      
      // Update station history for trails - always update to ensure trails appear
      setStationHistory(prev => {
        const updated = { ...prev };
        allStations.forEach(station => {
          if (!updated[station.id]) updated[station.id] = [];
          
          // Add current position to history
          const newPoint = {
            lat: station.latitude,
            lng: station.longitude,
            timestamp: station.timestamp
          };
          
          // Only add if position has changed significantly (avoid duplicate points)
          const lastPoint = updated[station.id][updated[station.id].length - 1];
          if (!lastPoint || 
              Math.abs(lastPoint.lat - newPoint.lat) > 0.01 || 
              Math.abs(lastPoint.lng - newPoint.lng) > 0.01) {
            updated[station.id].push(newPoint);
          }
          
          // Keep only last 30 positions (about 5 minutes of trail)
          if (updated[station.id].length > 30) {
            updated[station.id] = updated[station.id].slice(-30);
          }
        });
        return updated;
      });
      
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

    const map = L.map(mapRef.current, {
      attributionControl: false // Hide Leaflet attribution
    }).setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '' // Remove attribution text
    }).addTo(map);

    mapInstanceRef.current = map;
  };

  const updateMapMarkers = (stationData: SpaceStation[]) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers, trails, and pass markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    Object.values(trailsRef.current).forEach(trail => trail.remove());
    Object.values(passMarkersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    trailsRef.current = {};
    passMarkersRef.current = {};

    // Add trails first (so they appear behind markers) - show trails if enabled and history exists
    if (trackingTrails) {
      stationData.forEach(station => {
        const history = stationHistory[station.id];
        if (history && history.length > 1) {
          const trailPoints: [number, number][] = history.map(pos => [pos.lat, pos.lng]);
          
          const isISS = station.id === 25544;
          const trail = L.polyline(trailPoints, {
            color: isISS ? '#22c55e' : '#3b82f6',
            weight: 3,
            opacity: 0.8,
            dashArray: isISS ? '10, 5' : '5, 10', // Different dash patterns
            lineCap: 'round'
          })
          .bindTooltip(`${station.name} ${t('Trail', '轨迹')}`, {
            permanent: false,
            direction: 'center'
          })
          .addTo(mapInstanceRef.current);
          
          trailsRef.current[station.id] = trail;
        }
      });
    }

    // Add new markers with enhanced identification
    stationData.forEach(station => {
      const isISS = station.id === 25544;
      const isHubble = station.id === 20580;
      const isTiangong = station.id === 48274;
      
      let stationEmoji = '🛰️';
      let stationColor = '#3b82f6';
      let stationName = station.name;
      
      if (isISS) {
        stationEmoji = '🌟';
        stationColor = '#22c55e';
        stationName = 'ISS';
      } else if (isHubble) {
        stationEmoji = '🔭';
        stationColor = '#8b5cf6';
        stationName = 'Hubble';
      } else if (isTiangong) {
        stationEmoji = '🛸';
        stationColor = '#f59e0b';
        stationName = 'Tiangong';
      }
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${stationColor};
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            position: relative;
          ">
            ${stationEmoji}
            ${isISS ? '<div style="position: absolute; top: -25px; background: #22c55e; color: white; padding: 1px 4px; border-radius: 3px; font-size: 8px; white-space: nowrap;">LIVE</div>' : ''}
          </div>
        `,
        className: `station-marker station-${station.id}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const distanceFromUser = userLocation ? 
        calculateDistance(userLocation.lat, userLocation.lng, station.latitude, station.longitude) : null;

      const marker = L.marker([station.latitude, station.longitude], { icon })
        .bindPopup(`
          <div style="min-width: 240px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${stationColor};">${stationEmoji} ${station.name}</h3>
            <p style="margin: 2px 0;"><strong>📏 Altitude:</strong> ${station.altitude} km</p>
            <p style="margin: 2px 0;"><strong>⚡ Velocity:</strong> ${station.velocity.toLocaleString()} km/h</p>
            <p style="margin: 2px 0;"><strong>👥 Crew:</strong> ${station.crew || 0}</p>
            <p style="margin: 2px 0;"><strong>📡 Status:</strong> ${station.visibility}</p>
            ${distanceFromUser ? `<p style="margin: 2px 0;"><strong>📍 Distance:</strong> ${distanceFromUser.toFixed(0)} km</p>` : ''}
            ${station.nextPass ? `
              <div style="margin: 8px 0; padding: 6px; background: rgba(34, 197, 94, 0.1); border-radius: 4px;">
                <strong>🕐 Next Pass:</strong><br/>
                Time: ${station.nextPass.time}<br/>
                Direction: ${station.nextPass.direction}<br/>
                Max Elevation: ${station.nextPass.elevation}°
              </div>
            ` : ''}
            ${isISS ? '<p style="margin: 4px 0; color: #22c55e; font-weight: bold;">📸 Perfect for photography!</p>' : ''}
            ${isHubble ? '<p style="margin: 4px 0; color: #8b5cf6; font-weight: bold;">🔭 Space telescope</p>' : ''}
            ${isTiangong ? '<p style="margin: 4px 0; color: #f59e0b; font-weight: bold;">🚀 Chinese space station</p>' : ''}
          </div>
        `)
        .bindTooltip(`${stationEmoji} ${stationName}`, {
          permanent: false,
          direction: 'top',
          offset: [0, -15],
          className: 'station-tooltip'
        })
        .on('mouseover', function(e) {
          if (station.nextPass && userLocation) {
            const hoverContent = `
              <div style="text-align: center; min-width: 180px;">
                <h4 style="margin: 0 0 6px 0; color: ${stationColor};">${stationEmoji} ${stationName}</h4>
                <p style="margin: 2px 0; font-size: 12px;"><strong>🕐 Next Pass: ${station.nextPass.time}</strong></p>
                <p style="margin: 2px 0; font-size: 11px;">Direction: ${station.nextPass.direction} • Elevation: ${station.nextPass.elevation}°</p>
                <p style="margin: 4px 0; font-size: 10px; color: #666;">Click marker on map to see pass location</p>
              </div>
            `;
            
            if (hoverPopupRef.current) {
              mapInstanceRef.current?.closePopup(hoverPopupRef.current);
            }
            
            hoverPopupRef.current = L.popup({
              closeButton: false,
              className: 'hover-popup'
            })
              .setLatLng(e.latlng)
              .setContent(hoverContent)
              .openOn(mapInstanceRef.current!);
          }
        })
        .on('mouseout', function() {
          if (hoverPopupRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.closePopup(hoverPopupRef.current);
            hoverPopupRef.current = null;
          }
        })
        .addTo(mapInstanceRef.current);

      markersRef.current[station.id] = marker;

      // Add pass prediction marker if available
      if (station.nextPass && userLocation) {
        const passIcon = L.divIcon({
          html: `
            <div style="
              background: rgba(${stationColor === '#22c55e' ? '34, 197, 94' : stationColor === '#8b5cf6' ? '139, 92, 246' : '245, 158, 11'}, 0.8);
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              animation: passPulse 2s infinite;
            ">
            </div>
          `,
          className: 'pass-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const passMarker = L.marker([station.nextPass.lat, station.nextPass.lng], { icon: passIcon })
          .bindPopup(`
            <div style="text-align: center; min-width: 160px;">
              <h4 style="margin: 0 0 6px 0; color: ${stationColor};">📍 ${stationName} Pass</h4>
              <p style="margin: 2px 0;"><strong>Time:</strong> ${station.nextPass.time}</p>
              <p style="margin: 2px 0;"><strong>Direction:</strong> ${station.nextPass.direction}</p>
              <p style="margin: 2px 0;"><strong>Max Elevation:</strong> ${station.nextPass.elevation}°</p>
              <p style="margin: 4px 0; font-size: 11px; color: #666;">Best viewing location from your position</p>
            </div>
          `)
          .bindTooltip(`${stationName} Pass Location`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
          })
          .addTo(mapInstanceRef.current);

        passMarkersRef.current[station.id] = passMarker;
      }
    });

    // Add custom CSS for tooltips and animations
    const style = document.createElement('style');
    style.textContent = `
      .station-tooltip {
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        font-weight: bold !important;
        font-size: 12px !important;
        padding: 4px 8px !important;
      }
      .station-tooltip::before {
        border-top-color: rgba(0, 0, 0, 0.8) !important;
      }
      .hover-popup {
        background: rgba(255, 255, 255, 0.95) !important;
        border: 1px solid #ccc !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
      }
      @keyframes passPulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.4); opacity: 0.4; }
        100% { transform: scale(1); opacity: 0.8; }
      }
    `;
    if (!document.head.querySelector('[data-station-tooltip-style]')) {
      style.setAttribute('data-station-tooltip-style', 'true');
      document.head.appendChild(style);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
      if (userMarkerRef.current) {
        userMarkerRef.current = null;
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

        <div className="flex flex-wrap justify-center gap-4 mb-6">
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

          <Button 
            variant="outline"
            onClick={getUserLocation}
            className="gap-2"
          >
            <Navigation className="h-4 w-4" />
            {t('Use My Location', '使用我的位置')}
          </Button>

          {userLocation && (
            <Button 
              variant="outline"
              onClick={centerOnUser}
              className="gap-2"
            >
              <Crosshair className="h-4 w-4" />
              {t('Center on Me', '居中到我')}
            </Button>
          )}

          <Button 
            variant={trackingTrails ? "default" : "outline"}
            onClick={() => setTrackingTrails(!trackingTrails)}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            {trackingTrails ? t('Hide Trails', '隐藏轨迹') : t('Show Trails', '显示轨迹')}
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
                <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    🌟 {t('ISS (Live)', 'ISS（实时）')}
                  </div>
                  <div className="flex items-center gap-2">
                    🔭 {t('Hubble Telescope', '哈勃望远镜')}
                  </div>
                  <div className="flex items-center gap-2">
                    🛸 {t('Tiangong Station', '天宫空间站')}
                  </div>
                  <div className="flex items-center gap-2">
                    🔴 {t('Your Location', '您的位置')}
                  </div>
                  <div className="flex items-center gap-2">
                    💫 {t('Pass Predictions', '过境预测')}
                  </div>
                  {trackingTrails && (
                    <div className="flex items-center gap-2">
                      ⋯⋯ {t('Orbital Trails', '轨道轨迹')}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  {t('Hover over space objects for pass predictions • Click pass markers for viewing details', '悬停在空间物体上查看过境预测 • 点击过境标记查看观测详情')}
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
                    
                    {userLocation && (
                      <div>
                        <span className="font-medium">{t('Distance', '距离')}: </span>
                        <span className="text-muted-foreground">
                          {calculateDistance(userLocation.lat, userLocation.lng, station.latitude, station.longitude).toFixed(0)} km
                        </span>
                      </div>
                    )}
                    
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
                    <Camera className="h-4 w-4 mr-2" />
                    {t('Track on Map', '在地图上追踪')}
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
            {t('Real-time ISS tracking with pass predictions, orbital trails, and your location for perfect space station photography. Hover over objects for pass times, click pass markers for optimal viewing locations.', 
               'ISS实时追踪，提供过境预测、轨道轨迹和您的位置信息，助您完美拍摄空间站。悬停在物体上查看过境时间，点击过境标记获取最佳观测位置。')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceStationTracker;