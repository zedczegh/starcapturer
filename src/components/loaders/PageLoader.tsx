
import React from 'react';
import EnhancedLoader from './EnhancedLoader';

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <EnhancedLoader 
      size="large" 
      message="Loading amazing stargazing content..."
    />
  </div>
);

export default PageLoader;
