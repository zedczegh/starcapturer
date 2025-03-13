
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useIsMobile } from "./hooks/use-mobile";
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
  const isMobile = useIsMobile();
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          {/* Using regular Toaster without className */}
          <Toaster />
          <Sonner 
            position={isMobile ? "top-center" : "bottom-right"}
            expand={true} 
            closeButton 
            richColors 
            toastOptions={{
              style: { 
                fontSize: '0.95rem',
                borderRadius: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                border: '1px solid rgba(64, 64, 86, 0.1)'
              },
              duration: 4000
            }}
          />
          <BrowserRouter>
            <div className="sci-fi-scrollbar min-h-screen">
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
