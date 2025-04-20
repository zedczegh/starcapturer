import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import DeleteLocationButton from "@/components/collections/DeleteLocationButton";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import useEnhancedLocation from "@/hooks/useEnhancedLocation";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSiqsScore } from "@/utils/siqsHelpers";
import { getCertificationInfo, getLocalizedCertText } from "@/components/photoPoints/utils/certificationUtils";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

const Collections = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siqsScores, setSiqsScores] = useState<Record<string, number>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate('/photo-points');
      toast.error(t("Please sign in to view your collections", "请登录以查看您的收藏"));
      return;
    }

    const fetchCollections = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('saved_locations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLocations(data || []);
      } catch (error: any) {
        console.error('Error fetching collections:', error);
        toast.error(t("Failed to load your collections", "无法加载您的收藏"));
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'saved_locations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Location deleted via real-time:', payload);
          fetchCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, t]);

  const handleSiqsUpdate = (locationId: string, siqs: number | null, loading: boolean) => {
    if (siqs !== null) {
      setSiqsScores(prev => ({ ...prev, [locationId]: siqs }));
    }
    setLoadingSiqs(prev => ({ ...prev, [locationId]: loading }));
  };

  const handleLocationDelete = (deletedLocationId: string) => {
    setLocations(prevLocations => 
      prevLocations.filter(location => location.id !== deletedLocationId)
    );
  };

  const LocationCard = ({ location }: { location: any }) => {
    const { locationDetails } = useEnhancedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      skip: false
    });

    let displayName;
    if (language === 'zh') {
      displayName = locationDetails?.chineseName || locationDetails?.formattedName || location.name;
    } else {
      displayName = locationDetails?.formattedName || location.name;
    }

    const locationForCertInfo: SharedAstroSpot = {
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortlescale,
      timestamp: location.created_at || location.timestamp,
      certification: location.certification,
      isDarkSkyReserve: location.isdarkskyreserve
    };

    const certInfo = getCertificationInfo(locationForCertInfo);

    const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) {
        return; // Don't navigate if clicking on a button
      }
      navigate(`/location/${location.id}`);
    };

    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      navigate(`/location/${location.id}`);
    };

    return (
      <Card 
        className={`relative cursor-pointer border ${
          location.certification || location.isdarkskyreserve 
            ? 'border-2 border-primary/50 bg-primary/5' 
            : 'border-border'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-base line-clamp-1">{displayName}</h3>
            
            <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
              <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
              <span className="text-xs font-medium">
                {formatSiqsScore(siqsScores[location.id] || location.siqs)}
              </span>
            </div>
          </div>
          
          {certInfo && (
            <div className="my-2">
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${certInfo.color}`}>
                {React.createElement(certInfo.icon, { className: "h-4 w-4 mr-1.5" })}
                <span>{getLocalizedCertText(certInfo, language)}</span>
              </div>
            </div>
          )}
          
          <div className="mt-2 flex items-center text-muted-foreground text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <DeleteLocationButton 
              locationId={location.id} 
              userId={user.id} 
              onDelete={handleLocationDelete}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 transition-all duration-300 text-sm"
            >
              {t("View Details", "查看详情")}
            </Button>
          </div>
          
          <RealTimeSiqsProvider
            isVisible={true}
            latitude={Number(location.latitude)}
            longitude={Number(location.longitude)}
            bortleScale={location.bortlescale}
            onSiqsCalculated={(siqs, loading) => handleSiqsUpdate(location.id, siqs, loading)}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <TooltipProvider>
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <h1 className="text-2xl font-bold mb-6">{t("My Collections", "我的收藏")}</h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 text-muted-foreground">
                {t("You haven't saved any locations yet.", "您还没有保存任何位置。")}
              </div>
              <button 
                onClick={() => navigate('/photo-points')}
                className="text-primary hover:underline"
              >
                {t("Browse Photo Points", "浏览摄影点")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Collections;
