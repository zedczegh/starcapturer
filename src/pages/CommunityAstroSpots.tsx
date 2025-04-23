import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader, Telescope } from "lucide-react";
import { Link } from "react-router-dom";
import CommunityAstroSpotMarker from "@/components/photoPoints/map/CommunityAstroSpotMarker";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [30, 104];

// Custom Map that uses our telescope markers
function AstroSpotsMap({ spots, onProfile }: {
  spots: any[],
  onProfile: (spot: any) => void
}) {
  // Only render markers if Leaflet is loaded in browser
  return (
    <div className="w-full h-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
        worldCopyJump={true}
        className={"community-map"}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        {spots?.map(spot =>
          <CommunityAstroSpotMarker key={spot.id} spot={spot} onProfile={onProfile} />
        )}
      </MapContainer>
    </div>
  );
}

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
  });

  function handleMarkerProfile(spot: any) {
    // navigation handled within popup, nothing here. Could be extended to event log, etc.
  }

  return (
    <div className="relative max-w-5xl mx-auto pt-10 md:pt-14 px-2 pb-8">
      {/* Fancy header section */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="inline-flex items-center justify-center mb-2">
          <span className="p-2 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-300 shadow-lg mr-2">
            <Telescope size={32} className="text-white drop-shadow-md" />
          </span>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400">
            SIQS {t("Community Astrospots", "社区观星地")}
          </h1>
        </div>
        <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto my-3 rounded-full animate-pulse duration-300"></div>
        <p className="mb-3 text-lg text-muted-foreground max-w-xl bg-white/20 rounded-xl px-4 py-2 shadow-md">
          {t(
            "Explore astrospots shared by the community! View them on the starmap and discover new stargazing locations added by SIQS users.",
            "浏览所有SIQS用户分享的观星地点，在地图上探索社区最新的拍摄点。"
          )}
        </p>
        <div className="mb-2">
          <Link
            to="/photo-points"
            className="inline-block px-4 py-1.5 rounded-lg bg-primary font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-400 shadow hover:brightness-110 transition"
          >
            {t("See Official Photo Points", "前往官方拍摄点")}
          </Link>
        </div>
      </div>

      {/* Map container with shadow and rounded border */}
      <div className="rounded-xl overflow-hidden mb-8 border-2 border-purple-400/20 shadow-lg shadow-purple-400/10 bg-gradient-to-br from-cosmic-900 to-cosmic-950" style={{ height: 360, minHeight: 280 }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full w-full backdrop-blur bg-cosmic-800/10">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AstroSpotsMap
            spots={astrospots ?? []}
            onProfile={handleMarkerProfile}
          />
        )}
      </div>

      <h2 className="font-semibold text-lg mb-2 px-3">{t("All Community Astrospots", "全部社区观星地")}</h2>
      <ul className="grid gap-5 grid-cols-1 md:grid-cols-2">
        {astrospots?.map((spot: any) => (
          <li key={spot.id} className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-950/90 rounded-lg p-5 shadow-md border border-purple-300/20 hover:border-primary transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Telescope className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg truncate">{spot.name || t("Unnamed Location", "未命名位置")}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-0.5">
              {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
            </div>
            {typeof spot.bortleScale === "number" && (
              <div className="text-xs text-yellow-600 mt-1 mb-1">
                {t("Bortle", "博特尔")}: {spot.bortleScale}
                {typeof spot.siqs === "number" && (
                  <> &nbsp; SIQS: {Number(spot.siqs).toFixed(1)}</>
                )}
              </div>
            )}
            <div className="my-1 text-xs">{spot.description}</div>
            {spot.username && (
              <div className="flex items-center gap-1 mt-2">
                <span className="inline-block rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 px-2 py-0.5 text-white text-xs font-semibold">
                  @{spot.username}
                </span>
                <Link
                  to={`/astrospot-profile/${encodeURIComponent(spot.username)}`}
                  className="ml-2 text-xs rounded px-2 py-0.5 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition"
                >
                  {t("View Profile", "查看发布者")}
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityAstroSpots;
