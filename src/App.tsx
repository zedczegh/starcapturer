
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";

// Improve performance by prefetching popular locations
import { prefetchPopularLocations } from "./lib/queryPrefetcher";
// Improved loading component
import PageLoader from "./components/loaders/PageLoader";

// Lazily load pages with improved chunking for faster initial load
const IndexPage = lazy(() => import(/* webpackChunkName: "index-page" */ "./pages/Index"));
const LocationDetails = lazy(() => import(/* webpackChunkName: "location-details" */ "./pages/LocationDetails"));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ "./pages/NotFound"));
const ShareLocation = lazy(() => import(/* webpackChunkName: "share-location" */ "./pages/ShareLocation"));
const PhotoPointsNearby = lazy(() => import(/* webpackChunkName: "photo-points" */ "./pages/PhotoPointsNearby"));
const AboutSIQS = lazy(() => import(/* webpackChunkName: "about-siqs" */ "./pages/AboutSIQS"));
const About = lazy(() => import(/* webpackChunkName: "about" */ "./pages/About"));
const UsefulLinks = lazy(() => import(/* webpackChunkName: "useful-links" */ "./pages/UsefulLinks"));

// Create a new QueryClient instance with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000, // Increased to 15 minutes for better caching
      gcTime: 30 * 60 * 1000,    // Increased to 30 minutes
    },
  },
});

// Prefetch data for popular locations
prefetchPopularLocations(queryClient);

// Optimized animated page transitions with shorter durations
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Use key based on pathname without query parameters for smoother transitions
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

// Create helmet context once to prevent re-creation
const helmetContext = {};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="sci-fi-scrollbar">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={
                  <PageTransition>
                    <IndexPage />
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
                <Route path="/siqs" element={
                  <PageTransition>
                    <AboutSIQS />
                  </PageTransition>
                } />
                <Route path="/about" element={
                  <PageTransition>
                    <About />
                  </PageTransition>
                } />
                <Route path="/useful-links" element={
                  <PageTransition>
                    <UsefulLinks />
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
    </QueryClientProvider>
  );
};

export default App;
