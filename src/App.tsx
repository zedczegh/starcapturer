
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
const Index = lazy(() => import("./pages/Index"));
const LocationDetails = lazy(() => import("./pages/LocationDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShareLocation = lazy(() => import("./pages/ShareLocation"));
const AboutSIQS = lazy(() => import("./pages/AboutSIQS"));
const About = lazy(() => import("./pages/About"));
const UsefulLinks = lazy(() => import("./pages/UsefulLinks"));

// Load PhotoPointsNearby with better error handling
const PhotoPointsNearby = lazy(() => {
  // Add a console message for debugging
  console.log('Loading PhotoPointsNearby component');
  return import("./pages/PhotoPointsNearby")
    .catch(error => {
      console.error("Error loading PhotoPointsNearby:", error);
      // This ensures React doesn't break when the module fails to load
      return { default: () => <PageErrorBoundary /> };
    });
});

// Error boundary component for page-level errors
const PageErrorBoundary = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <h1 className="text-xl font-bold mb-4">Failed to load page</h1>
    <p className="mb-6 text-center">There was an error loading this page. Please try refreshing.</p>
    <button 
      className="px-4 py-2 bg-primary text-primary-foreground rounded"
      onClick={() => window.location.reload()}
    >
      Refresh Page
    </button>
  </div>
);

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

// App-level error boundary
class AppErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, info: any) {
    console.error("App-level error:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6">The application encountered an error. Please try refreshing.</p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => window.location.reload()}
          >
            Refresh App
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="sci-fi-scrollbar">
            <AppErrorBoundary>
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
            </AppErrorBoundary>
          </div>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
