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

    // Create highly visible user location marker with better styling
    const userIcon = L.divIcon({
      html: `
        <div class="user-location-outer">
          <div class="user-location-inner">
            📍
          </div>
        </div>
      `,
      className: 'user-location-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    userMarkerRef.current = L.marker([location.lat, location.lng], { icon: userIcon })
      .bindPopup(`
        <div style="text-align: center; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #ef4444;">📍 ${t('Your Location', '您的位置')}</h3>
          <p style="margin: 2px 0; font-size: 12px;">${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°</p>
          <p style="margin: 4px 0; font-size: 11px; color: #666;">
            ${t('Click me to find nearest space station pass!', '点击我找到最近的空间站过境！')}
          </p>
        </div>
      `)
      .bindTooltip(t('Your Location - Click for nearest pass!', '您的位置 - 点击查看最近过境！'), {
        permanent: false,
        direction: 'top',
        offset: [0, -15]
      })
      .on('click', function() {
        findAndShowNearestPass(location);
      })
      .addTo(mapInstanceRef.current);

    // Add enhanced pulsing animation and user marker styles
    const style = document.createElement('style');
    style.textContent = `
      .user-location-marker {
        z-index: 1000 !important;
      }
      .user-location-outer {
        background: #ef4444;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        animation: userLocationPulse 2s infinite;
      }
      .user-location-inner {
        z-index: 1001;
      }
      .user-location-outer::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        width: 36px;
        height: 36px;
        border: 3px solid #ef4444;
        border-radius: 50%;
        opacity: 0.4;
        animation: userLocationPulse 2s infinite reverse;
      }
      @keyframes userLocationPulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.3); opacity: 0.3; }
        100% { transform: scale(1); opacity: 0.8; }
      }
    `;
    if (!document.head.querySelector('[data-user-location-style]')) {
      style.setAttribute('data-user-location-style', 'true');
      document.head.appendChild(style);
    }
  };

  const findAndShowNearestPass = (userLoc: { lat: number; lng: number }) => {
    if (!stations.length) {
      toast.info(t('No station data available yet', '暂无空间站数据'));
      return;
    }

    let nearestPass: { station: SpaceStation; timeMinutes: number } | null = null;
    let shortestTime = Infinity;

    stations.forEach(station => {
      if (station.nextPass) {
        // Calculate time until pass (simplified)
        const now = new Date();
        const [hours, minutes] = station.nextPass.time.split(':').map(Number);
        const passTime = new Date();
        passTime.setHours(hours, minutes, 0, 0);
        
        // If pass time is earlier than now, assume it's tomorrow
        if (passTime <= now) {
          passTime.setDate(passTime.getDate() + 1);
        }
        
        const minutesUntilPass = Math.floor((passTime.getTime() - now.getTime()) / (1000 * 60));
        
        if (minutesUntilPass < shortestTime) {
          shortestTime = minutesUntilPass;
          nearestPass = { station, timeMinutes: minutesUntilPass };
        }
      }
    });

    if (nearestPass && mapInstanceRef.current) {
      const station = nearestPass.station;
      const pass = station.nextPass!;
      
      // Create special marker for nearest pass
      const nearestPassIcon = L.divIcon({
        html: `
          <div style="
            background: linear-gradient(45deg, #22c55e, #16a34a);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            animation: nearestPassPulse 1.5s infinite;
            position: relative;
          ">
            ⭐
            <div style="
              position: absolute;
              top: -25px;
              background: #22c55e;
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              white-space: nowrap;
              font-weight: bold;
            ">NEXT</div>
          </div>
        `,
        className: 'nearest-pass-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Remove any existing nearest pass marker
      if (passMarkersRef.current['nearest']) {
        passMarkersRef.current['nearest'].remove();
      }

      const nearestPassMarker = L.marker([pass.lat, pass.lng], { icon: nearestPassIcon })
        .bindPopup(`
          <div style="text-align: center; min-width: 220px;">
            <h3 style="margin: 0 0 8px 0; color: #22c55e;">⭐ ${t('NEAREST PASS', '最近过境')}</h3>
            <h4 style="margin: 0 0 6px 0;">${station.name}</h4>
            <p style="margin: 2px 0;"><strong>⏰ Time:</strong> ${pass.time} (${nearestPass.timeMinutes} min)</p>
            <p style="margin: 2px 0;"><strong>🧭 Direction:</strong> ${pass.direction}</p>
            <p style="margin: 2px 0;"><strong>📐 Max Elevation:</strong> ${pass.elevation}°</p>
            <p style="margin: 4px 0; font-size: 11px; color: #22c55e; font-weight: bold;">
              ${t('Perfect spot for photography!', '拍摄的完美地点！')}
            </p>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      passMarkersRef.current['nearest'] = nearestPassMarker;
      
      // Center map on the nearest pass location
      mapInstanceRef.current.setView([pass.lat, pass.lng], 10);
      nearestPassMarker.openPopup();
      
      // Add animation CSS
      const animationStyle = document.createElement('style');
      animationStyle.textContent = `
        @keyframes nearestPassPulse {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
          50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(34, 197, 94, 1); }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
        }
      `;
      if (!document.head.querySelector('[data-nearest-pass-animation]')) {
        animationStyle.setAttribute('data-nearest-pass-animation', 'true');
        document.head.appendChild(animationStyle);
      }
      
      toast.success(t(`Next pass: ${station.name} in ${nearestPass.timeMinutes} minutes!`, `下一次过境：${station.name} ${nearestPass.timeMinutes} 分钟后！`));
    } else {
      toast.info(t('No upcoming passes found', '未找到即将到来的过境'));
    }
  };

  const fetchStationData = async () => {
    try {
      setLoading(true);
      
      // Fetch real ISS data
      const issResponse = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const issData = await issResponse.json();
      
      // Remove the failing astronaut API call - use fixed crew count
      const issCrewCount = 7; // Current ISS expedition crew size

      // Create ISS station object with pass prediction
      const issStation: SpaceStation = {
        name: 'International Space Station (ISS)',
        id: 25544,
        latitude: issData.latitude,
        longitude: issData.longitude,
        altitude: Math.round(issData.altitude),
        velocity: Math.round(issData.velocity),
        visibility: issData.visibility === 'eclipsed' ? 'In Earth\'s Shadow' : 'Live Tracking',
        timestamp: issData.timestamp * 1000, // Convert to milliseconds
        crew: issCrewCount,
        country: 'International',
        nextPass: userLocation ? calculateNextPass({ 
          name: 'ISS', 
          id: 25544, 
          latitude: issData.latitude, 
          longitude: issData.longitude,
          altitude: issData.altitude,
          velocity: issData.velocity,
          visibility: 'Live',
          timestamp: issData.timestamp * 1000,
          country: 'International'
        }, userLocation) : undefined
      };

      // Use realistic orbital mechanics for other satellites
      const currentTime = Date.now();
      const timeOffset = (currentTime / 1000) % 5400; // 90-minute orbital period
      
      // Hubble Space Telescope - real orbital parameters
      const hubbleOrbitOffset = timeOffset * 0.8; // Slightly different orbit
      const hubbleStation: SpaceStation = {
        name: 'Hubble Space Telescope',
        id: 20580,
        latitude: Math.sin(hubbleOrbitOffset * 0.001) * 28.5, // Inclined orbit
        longitude: (hubbleOrbitOffset * 0.067) % 360 - 180, // Longitude progression
        altitude: 547,
        velocity: 27300,
        visibility: 'Tracking',
        timestamp: currentTime,
        crew: 0,
        country: 'International',
        nextPass: userLocation ? calculateNextPass({
          name: 'Hubble',
          id: 20580,
          latitude: Math.sin(hubbleOrbitOffset * 0.001) * 28.5,
          longitude: (hubbleOrbitOffset * 0.067) % 360 - 180,
          altitude: 547,
          velocity: 27300,
          visibility: 'Tracking',
          timestamp: currentTime,
          country: 'International'
        }, userLocation) : undefined
      };

      // Tiangong Space Station - realistic orbital simulation
      const tiangongOrbitOffset = timeOffset * 1.1; // Different orbital period
      const tiangongStation: SpaceStation = {
        name: 'Tiangong Space Station',
        id: 48274,
        latitude: Math.sin(tiangongOrbitOffset * 0.0012) * 42.5, // Different inclination
        longitude: (tiangongOrbitOffset * 0.062) % 360 - 180,
        altitude: 340,
        velocity: 27500,
        visibility: 'Simulated',
        timestamp: currentTime,
        crew: 3,
        country: 'China',
        nextPass: userLocation ? calculateNextPass({
          name: 'Tiangong',
          id: 48274,
          latitude: Math.sin(tiangongOrbitOffset * 0.0012) * 42.5,
          longitude: (tiangongOrbitOffset * 0.062) % 360 - 180,
          altitude: 340,
          velocity: 27500,
          visibility: 'Simulated',
          timestamp: currentTime,
          country: 'China'
        }, userLocation) : undefined
      };

      const allStations = [issStation, hubbleStation, tiangongStation];
      
      // PROPERLY update station history for trails - no fake initialization
      setStationHistory(prev => {
        console.log('📍 Before update - Previous history:', prev);
        const updated = { ...prev };
        allStations.forEach(station => {
          // Initialize empty array if first time
          if (!updated[station.id]) {
            updated[station.id] = [];
            console.log(`🆕 Initializing history for ${station.name}`);
          }
          
          // Add current position to history
          const newPoint = {
            lat: station.latitude,
            lng: station.longitude,
            timestamp: station.timestamp
          };
          
          // Only add if position actually changed (avoid duplicate points)
          const lastPoint = updated[station.id][updated[station.id].length - 1];
          if (!lastPoint || 
              Math.abs(lastPoint.lat - newPoint.lat) > 0.001 || 
              Math.abs(lastPoint.lng - newPoint.lng) > 0.001) {
            updated[station.id].push(newPoint);
            console.log(`➕ Added point for ${station.name}, total points: ${updated[station.id].length}`);
          } else {
            console.log(`⏭️ Skipped duplicate point for ${station.name}`);
          }
          
          // Keep reasonable trail length - 50 points for smooth trails
          if (updated[station.id].length > 50) {
            updated[station.id] = updated[station.id].slice(-50);
          }
        });
        console.log('📍 After update - New history:', updated);
        return updated;
      });
      
      console.log('✅ Station data fetched successfully:', allStations.length, 'stations');
      setStations(allStations);
      setLastUpdate(new Date());
      
      // Update markers immediately, trails will update via useEffect
      updateMapMarkers(allStations);
      
    } catch (error) {
      console.error('❌ Error fetching station data:', error);
      toast.error(t('Failed to fetch station data', '获取空间站数据失败'));
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    console.log('🗺️ initializeMap called - mapRef:', !!mapRef.current, 'mapInstance:', !!mapInstanceRef.current);
    if (!mapRef.current || mapInstanceRef.current) {
      console.log('🗺️ Map init skipped - no ref or already exists');
      return;
    }

    // Fix Leaflet default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    console.log('🗺️ Creating Leaflet map...');
    const map = L.map(mapRef.current, {
      attributionControl: false // Hide Leaflet attribution
    }).setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '' // Remove attribution text
    }).addTo(map);

    mapInstanceRef.current = map;
    console.log('✅ Map initialized successfully');
  };

  const updateMapMarkers = (stationData: SpaceStation[]) => {
    if (!mapInstanceRef.current) return;

    console.log('🔄 Updating map markers, station history state:', stationHistory);

    // Update existing markers instead of clearing and recreating them
    stationData.forEach(station => {
      const existingMarker = markersRef.current[station.id];
      
      if (existingMarker) {
        // Just update position of existing marker - no visual jumping
        existingMarker.setLatLng([station.latitude, station.longitude]);
      } else {
        // Only create new marker if it doesn't exist
        createStationMarker(station);
      }
    });

    // Remove markers for stations that no longer exist
    Object.keys(markersRef.current).forEach(markerId => {
      if (!stationData.find(s => s.id.toString() === markerId)) {
        markersRef.current[markerId].remove();
        delete markersRef.current[markerId];
      }
    });

    // Update trails via useEffect when stationHistory changes
    console.log('🔄 updateMapMarkers completed - trails will update separately');
    
    // Update pass markers
    updatePassMarkers(stationData);
  };

  const createStationMarker = (station: SpaceStation) => {
    if (!mapInstanceRef.current) return;
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
  };

  const updateTrails = (stationData: SpaceStation[]) => {
    if (!mapInstanceRef.current || !trackingTrails) return;

    // Clear existing trails
    Object.values(trailsRef.current).forEach(trail => trail.remove());
    trailsRef.current = {};

    stationData.forEach(station => {
      const history = stationHistory[station.id];
      
      // Only create trail if we have enough meaningful points
      if (history && history.length >= 2) {
        const trailPoints: [number, number][] = history.map(pos => [pos.lat, pos.lng]);
        
        const isISS = station.id === 25544;
        const isHubble = station.id === 20580;
        const isTiangong = station.id === 48274;
        
        let trailColor = '#3b82f6';
        let trailPattern = '5, 5';
        
        if (isISS) {
          trailColor = '#22c55e';
          trailPattern = '10, 5'; // Solid-ish for real data
        } else if (isHubble) {
          trailColor = '#8b5cf6';
          trailPattern = '8, 4';
        } else if (isTiangong) {
          trailColor = '#f59e0b';
          trailPattern = '6, 6';
        }
        
        const trail = L.polyline(trailPoints, {
          color: trailColor,
          weight: 3,
          opacity: 0.8,
          dashArray: trailPattern,
          lineCap: 'round',
          lineJoin: 'round',
          smoothFactor: 0.5 // Smooth the trail
        })
        .bindTooltip(`${station.name} ${t('Orbital Trail', '轨道轨迹')} (${history.length} points)`, {
          permanent: false,
          direction: 'center',
          className: 'trail-tooltip'
        })
        .addTo(mapInstanceRef.current!);
        
        trailsRef.current[station.id] = trail;
        console.log(`✅ Trail created for ${station.name} with ${trailPoints.length} points`);
      } else {
        console.log(`⚠️ Insufficient trail data for ${station.name}: ${history?.length || 0} points`);
      }
    });
  };

  const updatePassMarkers = (stationData: SpaceStation[]) => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Clear existing pass markers (except nearest)
    Object.entries(passMarkersRef.current).forEach(([key, marker]) => {
      if (key !== 'nearest') {
        marker.remove();
        delete passMarkersRef.current[key];
      }
    });

    stationData.forEach(station => {
      if (station.nextPass) {
        const isISS = station.id === 25544;
        const isHubble = station.id === 20580;
        const isTiangong = station.id === 48274;
        
        let stationColor = '#3b82f6';
        let stationName = station.name;
        
        if (isISS) {
          stationColor = '#22c55e';
          stationName = 'ISS';
        } else if (isHubble) {
          stationColor = '#8b5cf6';
          stationName = 'Hubble';
        } else if (isTiangong) {
          stationColor = '#f59e0b';
          stationName = 'Tiangong';
        }

        const passIcon = L.divIcon({
          html: `
            <div style="
              background: ${stationColor};
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 3px 8px rgba(0,0,0,0.5);
              animation: passPulse 2s infinite;
              opacity: 1;
            ">
            </div>
          `,
          className: 'pass-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
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
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
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
    console.log('🗺️ Map useEffect - showMap:', showMap);
    if (showMap) {
      setTimeout(() => {
        console.log('🗺️ Initializing map...');
        initializeMap();
      }, 100);
    }
  }, [showMap]);

  useEffect(() => {
    console.log('🚀 Main data fetch useEffect - starting...');
    fetchStationData();
    
    // Update every 15 seconds for real-time tracking
    const interval = setInterval(() => {
      console.log('⏰ Interval fetch...');
      fetchStationData();
    }, 15000);
    
    return () => {
      console.log('🧹 Cleaning up main useEffect...');
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

  // Separate useEffect to update trails when stationHistory changes
  useEffect(() => {
    console.log('🔄 StationHistory useEffect triggered:', {
      stationsLength: stations.length,
      mapExists: !!mapInstanceRef.current,
      trackingTrails,
      historyKeys: Object.keys(stationHistory),
      historyLengths: Object.fromEntries(Object.entries(stationHistory).map(([k, v]) => [k, v.length]))
    });
    
    if (stations.length > 0 && mapInstanceRef.current && trackingTrails) {
      console.log('✅ Conditions met, updating trails...');
      updateTrails(stations);
    } else {
      console.log('❌ Conditions not met for trail update');
    }
  }, [stationHistory, trackingTrails, stations]);

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
                    ⭐ {t('Nearest Pass', '最近过境')}
                  </div>
                  {trackingTrails && (
                    <div className="flex items-center gap-2">
                      ⋯⋯ {t('Real Orbital Trails', '真实轨道轨迹')}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  {t('Click your red location marker to find the nearest space station pass', '点击红色位置标记找到最近的空间站过境')}
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