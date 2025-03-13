
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";
import LocationDetails from "./pages/LocationDetails";
import NotFound from "./pages/NotFound";
import ShareLocation from "./pages/ShareLocation";
import PhotoPointsNearby from "./pages/PhotoPointsNearby";
import AboutSIQS from "./pages/AboutSIQS";

// Create a new QueryClient instance with performance optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5 for better caching
      gcTime: 15 * 60 * 1000, // 15 minutes - replaced cacheTime with gcTime
    },
  },
});

// Optimized animated page transitions with shorter durations
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.15 }} // Reduced for faster transitions
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="sci-fi-scrollbar">
              <Routes>
                <Route path="/" element={
                  <PageTransition>
                    <Index />
                  </PageTransition>
                } />
                <Route path="/location/:id" element={
                  <PageTransition>
                    <LocationDetails />
                  </PageTransition>
                } />
                <Route path="/share" element={
                  <PageTransition>
                    <ShareLocation />
                  </PageTransition>
                } />
                <Route path="/photo-points" element={
                  <PageTransition>
                    <PhotoPointsNearby />
                  </PageTransition>
                } />
                <Route path="/about" element={
                  <PageTransition>
                    <AboutSIQS />
                  </PageTransition>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={
                  <PageTransition>
                    <NotFound />
                  </PageTransition>
                } />
              </Routes>
            </div>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
