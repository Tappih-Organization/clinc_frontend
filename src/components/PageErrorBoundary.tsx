import React from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides error boundary for individual pages
 * This ensures that if one page crashes, it doesn't affect the entire app
 */
const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary;

