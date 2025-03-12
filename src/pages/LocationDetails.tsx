
import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/components/NavBar";
import ReviewSection from "@/components/ReviewSection";
import ShareLocationForm from "@/components/ShareLocationForm";
import { siqsToColor } from "@/lib/calculateSIQS";
import { generateBaiduMapsUrl } from "@/lib/api";
import {
  Cloud,
  ThermometerSun,
  Wind,
  Droplets,
  MoonStar,
  Clock,
  ExternalLink,
  ArrowLeft,
  Info,
  MapPin,
  Moon,
  Telescope,
  Share2,
  NavigationIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const LocationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationData = location.state;
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  useEffect(() => {
    // If we don't have location data in the state, we should redirect back to home
    // In a real app, we would fetch the location data from an API using the ID
    if (!locationData && id) {
      navigate("/");
    }
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [locationData, id, navigate]);
  
  if (!locationData) {
    return null;
  }
  
  const {
    name,
    latitude,
    longitude,
    bortleScale,
    seeingConditions,
    weatherData,
    siqsResult,
    timestamp,
    moonPhase = 0.3, // Default moon phase if not provided
  } = locationData;
  
  const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const formattedTime = new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const baiduMapsUrl = generateBaiduMapsUrl(latitude, longitude);
  const scoreColor = siqsToColor(siqsResult.score, siqsResult.isViable);
  
  // Format moon phase for display
  const getMoonPhaseText = (phase = moonPhase) => {
    if (phase < 0.05) return "New Moon";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.3) return "First Quarter";
    if (phase < 0.45) return "Waxing Gibbous";
    if (phase < 0.55) return "Full Moon";
    if (phase < 0.7) return "Waning Gibbous";
    if (phase < 0.8) return "Last Quarter";
    return "Waning Crescent";
  };

  // Format moon percentage
  const moonPercentage = Math.round(moonPhase * 100);
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{name}</h1>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">Analyzed on</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-end">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {formattedDate}, {formattedTime}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="glassmorphism rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div 
                        className="rounded-full h-44 w-44 flex items-center justify-center"
                        style={{ backgroundColor: scoreColor, opacity: 0.1 }}
                      >
                        <div 
                          className="rounded-full h-32 w-32 flex items-center justify-center"
                          style={{ backgroundColor: scoreColor, opacity: 0.2 }}
                        >
                          <div 
                            className="rounded-full h-24 w-24 flex items-center justify-center" 
                            style={{ backgroundColor: scoreColor, opacity: 0.3 }}
                          />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold">{siqsResult.score.toFixed(1)}</span>
                        <span className="text-sm mt-1">SIQS</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {siqsResult.isViable ? (
                          <Badge className="mb-2" style={{ backgroundColor: scoreColor }}>
                            Viable for Imaging
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="mb-2">
                            Not Viable for Imaging
                          </Badge>
                        )}
                      </h3>
                      <p>{siqsResult.qualitativeFeedback}</p>
                      {siqsResult.idealFor && (
                        <p className="mt-2 text-sm font-medium flex items-center">
                          <Telescope className="h-4 w-4 mr-1.5 text-primary" />
                          {siqsResult.idealFor}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <ScoreItem 
                        label="Cloud Cover" 
                        score={siqsResult.cloudCoverScore} 
                        value={`${weatherData.cloudCover}%`}
                        icon={<Cloud className="h-4 w-4" />}
                        weight={35}
                      />
                      <ScoreItem 
                        label="Light Pollution (Bortle)" 
                        score={siqsResult.bortleScore} 
                        value={`Class ${bortleScale}`}
                        icon={<MoonStar className="h-4 w-4" />}
                        weight={25}
                      />
                      <ScoreItem 
                        label="Seeing Conditions" 
                        score={siqsResult.seeingScore} 
                        value={`${seeingConditions} arcsec`}
                        icon={<ThermometerSun className="h-4 w-4" />}
                        weight={15}
                      />
                      <ScoreItem 
                        label="Wind Speed" 
                        score={siqsResult.windScore} 
                        value={`${weatherData.windSpeed} mph`}
                        icon={<Wind className="h-4 w-4" />}
                        weight={10}
                      />
                      <ScoreItem 
                        label="Humidity/Dew Risk" 
                        score={siqsResult.humidityScore} 
                        value={`${weatherData.humidity}%`}
                        icon={<Droplets className="h-4 w-4" />}
                        weight={5}
                      />
                      <ScoreItem 
                        label="Moon Phase" 
                        score={siqsResult.moonPhaseScore || 5} 
                        value={getMoonPhaseText()}
                        icon={<Moon className="h-4 w-4" />}
                        weight={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recommended Targets Card */}
              {siqsResult.recommendedTargets && siqsResult.recommendedTargets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Telescope className="h-5 w-5 mr-2" />
                      Recommended Targets
                    </CardTitle>
                    <CardDescription>
                      Astronomical objects well-positioned for imaging tonight
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {siqsResult.recommendedTargets.map((target, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {target}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => window.open(baiduMapsUrl, '_blank')}
                >
                  <NavigationIcon className="mr-2 h-4 w-4" />
                  Navigate to Location
                </Button>
                
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share This Spot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <ShareLocationForm 
                      userLocation={{
                        latitude,
                        longitude,
                        name
                      }}
                      siqs={siqsResult.score}
                      isViable={siqsResult.isViable}
                      onClose={() => setShareDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <ReviewSection locationId={id || "1"} />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weather Conditions</CardTitle>
                <CardDescription>
                  Current weather data at this location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Cloud className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Cloud Cover</span>
                  </div>
                  <span className="font-medium">{weatherData.cloudCover}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Wind Speed</span>
                  </div>
                  <span className="font-medium">{weatherData.windSpeed} mph</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Humidity</span>
                  </div>
                  <span className="font-medium">{weatherData.humidity}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ThermometerSun className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Temperature</span>
                  </div>
                  <span className="font-medium">{weatherData.temperature}°C</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Moon className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>Moon Phase</span>
                  </div>
                  <span className="font-medium">{getMoonPhaseText()} ({moonPercentage}%)</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User-Provided Inputs</CardTitle>
                <CardDescription>
                  Parameters you entered for this location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TooltipProvider>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MoonStar className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span>Bortle Scale</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <p>The Bortle scale measures light pollution from 1 (darkest skies) to 9 (bright urban skies).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium">Class {bortleScale}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ThermometerSun className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span>Seeing Conditions</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="w-80">
                          <p>Atmospheric stability measured in arcseconds. Lower values (1-2) indicate better seeing conditions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium">{seeingConditions} arcsec</span>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>About SIQS</CardTitle>
                <CardDescription>
                  Understanding the Stellar Imaging Quality Score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The SIQS is calculated based on six key factors with the following weights:
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cloud Cover</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Light Pollution (Bortle)</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seeing Conditions</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moon Phase</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity/Dew Risk</span>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/about">
                    Learn More About SIQS
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

interface ScoreItemProps {
  label: string;
  score: number;
  value: string;
  icon: React.ReactNode;
  weight: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, score, value, icon, weight }) => {
  const normalizedScore = Math.min(10, Math.max(0, score));
  const percentage = normalizedScore * 10;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">{value}</span>
          <Badge variant="outline" className="text-xs">
            {weight}%
          </Badge>
        </div>
      </div>
      <div className="w-full bg-cosmic-800 rounded-full h-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: siqsToColor(normalizedScore, true),
          }}
        />
      </div>
    </div>
  );
};

export default LocationDetails;
