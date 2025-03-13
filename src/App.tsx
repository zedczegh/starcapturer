
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { prefetchPopularLocations } from "./lib/queryPrefetcher";

// Lazy load pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const LocationDetails = lazy(() => import("./pages/LocationDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShareLocation = lazy(() => import("./pages/ShareLocation"));
const PhotoPointsNearby = lazy(() => import("./pages/PhotoPointsNearby"));
const AboutSIQS = lazy(() => import("./pages/AboutSIQS"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Create a new QueryClient instance with performance optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    },
  },
});

// Prefetch data for popular locations
prefetchPopularLocations(queryClient);

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
        transition={{ duration: 0.12 }} // Reduced for faster transitions
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
              <Suspense fallback={<PageLoader />}>
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
                  {/* Catch-all route */}
                  <Route path="*" element={
                    <PageTransition>
                      <NotFound />
                    </PageTransition>
                  } />
                </Routes>
              </Suspense>
            </div>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
