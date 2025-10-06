import { useCallback, useEffect, useState } from 'react';
import { useErrorHandler, ErrorContext, RetryOptions } from '@/lib/errorHandler';

interface UseErrorHandlingOptions {
  component?: string;
  onError?: (error: unknown) => void;
  enableRetry?: boolean;
}

interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { component, onError, enableRetry = true } = options;
  const errorHandler = useErrorHandler();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const handleError = useCallback(
    (error: unknown, context?: Partial<ErrorContext>) => {
      const fullContext: ErrorContext = {
        component,
        ...context,
      };

      setErrorState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }));

      errorHandler.handleError(error, fullContext);
      onError?.(error);
    },
    [errorHandler, component, onError],
  );

  const retry = useCallback(
    (operation?: () => void | Promise<void>) => {
      if (!enableRetry) return;

      setErrorState((prev) => ({
        ...prev,
        isRetrying: true,
        retryCount: prev.retryCount + 1,
      }));

      if (operation) {
        Promise.resolve(operation())
          .catch(handleError)
          .finally(() => {
            setErrorState((prev) => ({
              ...prev,
              isRetrying: false,
            }));
          });
      } else {
        // Clear error state for manual retry
        setErrorState({
          error: null,
          isRetrying: false,
          retryCount: 0,
        });
      }
    },
    [enableRetry, handleError],
  );

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  // Listen for global retry events
  useEffect(() => {
    const handleRetryEvent = (event: CustomEvent) => {
      const { context } = event.detail;
      if (context?.component === component) {
        retry();
      }
    };

    window.addEventListener('error-retry', handleRetryEvent as EventListener);
    return () => {
      window.removeEventListener('error-retry', handleRetryEvent as EventListener);
    };
  }, [component, retry]);

  // Wrapper for async operations with error handling
  const withErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: Partial<ErrorContext>,
      retryOptions?: RetryOptions,
    ): Promise<T | null> => {
      try {
        setErrorState((prev) => ({ ...prev, error: null }));
        return await errorHandler.withErrorHandling(operation, { component, ...context }, retryOptions);
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [errorHandler, component, handleError],
  );

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasError: !!errorState.error,
    handleError,
    retry,
    clearError,
    withErrorHandling,
  };
}

/**
 * Hook for handling WebSocket connection errors
 */
export function useWebSocketErrorHandling() {
  const { handleError } = useErrorHandling({ component: 'WebSocket' });

  useEffect(() => {
    const handleWebSocketError = (event: CustomEvent) => {
      handleError(new Error('WebSocket connection failed'), {
        action: 'connection',
        metadata: { attempts: event.detail.attempts },
      });
    };

    const handleMaxRetries = (event: CustomEvent) => {
      handleError(new Error('WebSocket connection failed after maximum retry attempts'), {
        action: 'max_retries',
        metadata: { attempts: event.detail.attempts },
      });
    };

    window.addEventListener('websocket-error', handleWebSocketError as EventListener);
    window.addEventListener('websocket-max-retries', handleMaxRetries as EventListener);

    return () => {
      window.removeEventListener('websocket-error', handleWebSocketError as EventListener);
      window.removeEventListener('websocket-max-retries', handleMaxRetries as EventListener);
    };
  }, [handleError]);
}

/**
 * Hook for handling API errors with automatic retry
 */
export function useApiErrorHandling(_endpoint?: string) {
  return useErrorHandling({
    component: 'API',
    enableRetry: true,
  });
}
