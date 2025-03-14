
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";

// Improve performance by prefetching popular locations
import { prefetchPopularLocations } from "./lib/queryPrefetcher";
// Improved loading component
import PageLoader from "./components/loaders/PageLoader";

// Performance improvement: Lazy-load pages with appropriate chunk names
const Index = lazy(() => import(/* webpackChunkName: "index-page" */ "./pages/Index"));
const LocationDetails = lazy(() => import(/* webpackChunkName: "location-details" */ "./pages/LocationDetails"));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ "./pages/NotFound"));
const ShareLocation = lazy(() => import(/* webpackChunkName: "share-location" */ "./pages/ShareLocation"));
const PhotoPointsNearby = lazy(() => import(/* webpackChunkName: "photo-points" */ "./pages/PhotoPointsNearby"));
const AboutSIQS = lazy(() => import(/* webpackChunkName: "about-siqs" */ "./pages/AboutSIQS"));

// Create a new QueryClient instance with optimized settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000, // 15 minutes for better caching
      gcTime: 30 * 60 * 1000,    // 30 minutes for garbage collection
    },
  },
});

// Prefetch popular location data for faster initial experience
prefetchPopularLocations(queryClient);

// Optimized page transitions component with shorter durations for better UX
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Use pathname without query params for smoother transitions
  const pathnameBase = location.pathname.split('?')[0];
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathnameBase}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }} // Faster transitions
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Main App component
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
