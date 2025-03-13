
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import LocationDetails from "./pages/LocationDetails";
import NotFound from "./pages/NotFound";
import ShareLocation from "./pages/ShareLocation";
import PhotoPointsNearby from "./pages/PhotoPointsNearby";
import AboutSIQS from "./pages/AboutSIQS";

// Create a new QueryClient instance with custom error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Check for online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for location permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          setHasLocationPermission(permissionStatus.state === 'granted');
          
          permissionStatus.onchange = () => {
            setHasLocationPermission(permissionStatus.state === 'granted');
          };
        })
        .catch(err => {
          console.error("Error checking geolocation permission:", err);
          setHasLocationPermission(null);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner className="z-tooltip" position="top-right" expand={false} closeButton />
          <BrowserRouter>
            <div className="sci-fi-scrollbar min-h-screen">
              {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-[100]">
                  You are currently offline. Some features may not work properly.
                </div>
              )}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/location/:id" element={<LocationDetails />} />
                <Route path="/share" element={<ShareLocation />} />
                <Route path="/photo-points" element={<PhotoPointsNearby />} />
                <Route path="/about" element={<AboutSIQS />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
