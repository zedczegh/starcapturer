import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from '@/components/layout/Navbar';
import PageLoader from '@/components/loaders/PageLoader';
import { usePageTransitions } from '@/hooks/usePageTransitions';
import GlobalMapSelector from '@/components/common/GlobalMapSelector';

const HomePage = React.lazy(() => import('@/pages/Home'));
const LocationDetails = React.lazy(() => import('@/pages/LocationDetails'));
const PhotoPointsNearby = React.lazy(() => import('@/pages/PhotoPointsNearby'));
const PhotoPointsView = React.lazy(() => import('@/pages/PhotoPointsView'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const CalculatorPage = React.lazy(() => import('@/pages/CalculatorPage'));

const App = () => {
  const { toast } = useToast()
  const { PageTransition } = usePageTransitions();

  return (
    <div className="h-full bg-background font-sans antialiased">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/location/:id" element={<LocationDetails />} />
            <Route path="/photo-points" element={<PhotoPointsNearby />} />
            <Route path="/photo-points/nearby" element={<PhotoPointsNearby />} />
            <Route path="/photo-points/view" element={<PhotoPointsView />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
          </Routes>
        </PageTransition>
      </Suspense>
      <GlobalMapSelector />
      <Toaster />
    </div>
  );
};

export default App;
