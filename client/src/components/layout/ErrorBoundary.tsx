import React, { ReactNode, ErrorInfo } from 'react';
import { ErrorBoundaryFallback } from '@/components/ui/error-display';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: Readonly<ErrorBoundaryProps> & Readonly<{ children?: ReactNode }>;
  declare context: unknown;
  declare setState: React.Component<ErrorBoundaryProps, ErrorBoundaryState>['setState'];
  declare forceUpdate: React.Component<ErrorBoundaryProps, ErrorBoundaryState>['forceUpdate'];
  declare refs: React.Component['refs'];

  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Emit global error event for centralized error handling
    window.dispatchEvent(
      new CustomEvent('component-error', {
        detail: {
          error,
          errorInfo,
          component: this.props.componentName || 'Unknown',
        },
      }),
    );
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error!}
          resetError={this.handleRetry}
          componentName={this.props.componentName}
        />
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}
