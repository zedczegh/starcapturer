
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";
import { HelmetProvider } from "react-helmet-async";

// Improve performance by prefetching popular locations
import { prefetchPopularLocations } from "./lib/queryPrefetcher";
// Improved loading component
import PageLoader from "./components/loaders/PageLoader";

// Import the Index page directly instead of lazily loading it to prevent the dynamic import error
import Index from "./pages/Index";

// Lazily load other pages with improved chunking for faster initial load
const LocationDetails = lazy(() => import("./pages/LocationDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShareLocation = lazy(() => import("./pages/ShareLocation"));
const PhotoPointsNearby = lazy(() => import("./pages/PhotoPointsNearby"));
const AboutSIQS = lazy(() => import("./pages/AboutSIQS"));

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
      <LanguageProvider>
        <HelmetProvider context={helmetContext}>
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
                      <Suspense fallback={<PageLoader />}>
                        <LocationDetails />
                      </Suspense>
                    </PageTransition>
                  } />
                  <Route path="/share" element={
                    <PageTransition>
                      <Suspense fallback={<PageLoader />}>
                        <ShareLocation />
                      </Suspense>
                    </PageTransition>
                  } />
                  <Route path="/photo-points" element={
                    <PageTransition>
                      <Suspense fallback={<PageLoader />}>
                        <PhotoPointsNearby />
                      </Suspense>
                    </PageTransition>
                  } />
                  <Route path="/about" element={
                    <PageTransition>
                      <Suspense fallback={<PageLoader />}>
                        <AboutSIQS />
                      </Suspense>
                    </PageTransition>
                  } />
                  {/* Catch-all route */}
                  <Route path="*" element={
                    <PageTransition>
                      <Suspense fallback={<PageLoader />}>
                        <NotFound />
                      </Suspense>
                    </PageTransition>
                  } />
                </Routes>
              </div>
              <Toaster />
            </BrowserRouter>
          </TooltipProvider>
        </HelmetProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
