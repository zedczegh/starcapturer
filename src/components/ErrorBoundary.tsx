import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950 flex items-center justify-center p-4">
          <Card className="max-w-md w-full glassmorphism border-cosmic-700/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-lg text-white">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-300 text-center">
                The page encountered an unexpected error. You can try refreshing or go back to the previous page.
              </p>
              
              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-500 bg-cosmic-800/50 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = "/photo-points"}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;