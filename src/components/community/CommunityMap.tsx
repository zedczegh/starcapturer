
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";

interface CommunityMapProps {
  spots: SharedAstroSpot[];
  center: [number, number];
  zoom?: number;
  height?: string | number;
}

const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const CommunityMap: React.FC<CommunityMapProps> = ({
  spots,
  center,
  zoom = 3,
  height = 380
}) => (
  <MapContainer
    center={center}
    zoom={zoom}
    scrollWheelZoom={true}
    style={{ width: "100%", height, borderRadius: 12, minHeight: 275 }}
    attributionControl={false}
    worldCopyJump
  >
    <TileLayer url={tileUrl} attribution={attribution} maxZoom={19} />
    {spots.map((spot) =>
      spot.latitude && spot.longitude ? (
        <CommunityMapMarker key={spot.id} spot={spot} />
      ) : null
    )}
  </MapContainer>
);

export default CommunityMap;

