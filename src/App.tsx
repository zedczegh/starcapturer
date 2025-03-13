
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        {/* Using regular Toaster without className */}
        <Toaster />
        <Sonner className="z-tooltip" position="top-right" expand={false} closeButton />
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

export default App;
