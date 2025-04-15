
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapCenterHandler } from './MapCenterHandler';
import * as L from 'leaflet';

interface MapBaseProps {
  center: [number, number];
  zoom: number;
  children: React.ReactNode;
  onMapReady: (map: L.Map) => void;
}

export const MapBase: React.FC<MapBaseProps> = ({
  center,
  zoom,
  children,
  onMapReady
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenReady={({ target }) => {
        (window as any).leafletMap = target;
        onMapReady(target);
      }}
      scrollWheelZoom={true}
      minZoom={2}
    >
      <MapCenterHandler center={center} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
      />
      
      {children}
    </MapContainer>
  );
};
