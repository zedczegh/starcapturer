
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useCallback } from "react";
import { HelmetProvider } from "react-helmet-async";

// Improved loading component
import PageLoader from "./components/loaders/PageLoader";

// Optimize chunks for better performance
const Index = lazy(() => import(/* webpackChunkName: "index-page" */ "./pages/Index"));
const LocationDetails = lazy(() => import(/* webpackChunkName: "location-details" */ "./pages/LocationDetails"));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ "./pages/NotFound"));
const ShareLocation = lazy(() => import(/* webpackChunkName: "share-location" */ "./pages/ShareLocation"));
const PhotoPointsNearby = lazy(() => import(/* webpackChunkName: "photo-points" */ "./pages/PhotoPointsNearby"));
const AboutSIQS = lazy(() => import(/* webpackChunkName: "about-siqs" */ "./pages/AboutSIQS"));

// Create a new QueryClient instance with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

// Optimized animated page transitions with shorter durations for better performance
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
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
  // Better error handling for route loading
  const handleError = useCallback((error: Error) => {
    console.error("Application route error:", error);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <HelmetProvider context={helmetContext}>
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
                        <LocationDetails />
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
        </HelmetProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
