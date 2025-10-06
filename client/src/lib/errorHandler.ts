import { useMemo } from 'react';
import { toast } from 'sonner';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ErrorMessageService } from './errorMessages';

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number) => void;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly isRetryable: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', context?: ErrorContext, isRetryable: boolean = false) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.isRetryable = isRetryable;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', context, true);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', context, false);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'AUTH_ERROR', context, false);
    this.name = 'AuthError';
  }
}

export class ErrorHandler {
  private t: TFunction;
  private messageService: ErrorMessageService;

  constructor(t: TFunction) {
    this.t = t;
    this.messageService = new ErrorMessageService(t);
  }

  private tErrors(key: string, options?: unknown) {
    const normalizedKey = key.startsWith('errors.') ? key.slice('errors.'.length) : key;

    if (typeof options === 'string') {
      return this.t(normalizedKey, { ns: 'errors', defaultValue: options });
    }

    if (options && typeof options === 'object') {
      return this.t(normalizedKey, { ns: 'errors', ...(options as Record<string, unknown>) });
    }

    return this.t(normalizedKey, { ns: 'errors' });
  }

  /**
   * Handle and display errors with appropriate user feedback
   */
  handleError(error: unknown, context?: ErrorContext): void {
    const appError = this.normalizeError(error, context);

    // Log error for debugging
    console.error('Error handled:', appError, { context });

    // Show user-friendly message
    this.showErrorToast(appError);
  }

  /**
   * Convert any error to AppError with proper context
   */
  private normalizeError(error: unknown, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('fetch')) {
        return new NetworkError(this.tErrors('connection.failed'), context);
      }

      if (error.message.includes('WebSocket')) {
        return new NetworkError(this.tErrors('connection.websocket.failed'), context);
      }

      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return new AuthError(this.tErrors('command.unauthorized'), context);
      }

      if (error.message.includes('404')) {
        return new AppError(this.tErrors('command.notFound'), 'NOT_FOUND', context);
      }

      if (error.message.includes('timeout')) {
        return new NetworkError(this.tErrors('connection.timeout'), context);
      }

      return new AppError(error.message, 'UNKNOWN_ERROR', context, true);
    }

    return new AppError(this.tErrors('generic'), 'UNKNOWN_ERROR', context);
  }

  /**
   * Show error toast with appropriate styling and actions
   */
  private showErrorToast(error: AppError): void {
    const message = this.messageService.getErrorMessage(error, error.context);
    const guidance = this.messageService.getErrorGuidance(error, error.context);

    // Fallback message if localization fails
    const fallbackMessage = message || this.tErrors('fallback', 'Error details are not available');

    const description =
      guidance ||
      (error.context?.component ? `${this.t('ui.component', 'Component')}: ${error.context.component}` : undefined);

    toast.error(fallbackMessage, {
      description,
      action: error.isRetryable
        ? {
            label: this.tErrors('retry', 'Try Again'),
            onClick: () => {
              // Emit retry event that components can listen to
              window.dispatchEvent(
                new CustomEvent('error-retry', {
                  detail: { error, context: error.context },
                }),
              );
            },
          }
        : undefined,
    });
  }

  /**
   * Wrap async operations with error handling and retry logic
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    retryOptions?: RetryOptions,
  ): Promise<T> {
    const maxAttempts = retryOptions?.maxAttempts ?? 1;
    const delay = retryOptions?.delay ?? 1000;
    const backoff = retryOptions?.backoff ?? 'linear';

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const appError = this.normalizeError(error, context);
        if (!appError.isRetryable) {
          break;
        }

        // Calculate delay for next attempt
        const nextDelay = backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay * attempt;

        retryOptions?.onRetry?.(attempt);

        await new Promise((resolve) => setTimeout(resolve, nextDelay));
      }
    }

    // Handle the final error
    this.handleError(lastError, context);
    throw lastError;
  }

  /**
   * Create error handler for specific API endpoints
   */
  createApiErrorHandler(endpoint: string) {
    return (error: unknown) => {
      this.handleError(error, {
        component: 'API',
        action: endpoint,
      });
    };
  }

  /**
   * Create error handler for specific components
   */
  createComponentErrorHandler(componentName: string) {
    return (error: unknown, action?: string) => {
      this.handleError(error, {
        component: componentName,
        action,
      });
    };
  }
}

/**
 * Hook to get error handler with current translation function
 */
export function useErrorHandler() {
  const { t } = useTranslation();
  return useMemo(() => new ErrorHandler(t), [t]);
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandling(t?: TFunction) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Show user-friendly error message if translation function is available
    if (t) {
      const errorHandler = new ErrorHandler(t);
      errorHandler.handleError(event.reason, {
        component: 'Global',
        action: 'unhandledRejection',
      });
    }

    // Prevent the default browser error handling
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Show user-friendly error message if translation function is available
    if (t) {
      const errorHandler = new ErrorHandler(t);
      errorHandler.handleError(event.error, {
        component: 'Global',
        action: 'globalError',
      });
    }
  });

  // Listen for component errors from ErrorBoundary
  window.addEventListener('component-error', (event: CustomEvent) => {
    console.error('Component error:', event.detail);

    if (t) {
      const errorHandler = new ErrorHandler(t);
      errorHandler.handleError(event.detail.error, {
        component: event.detail.component,
        action: 'componentCrash',
        metadata: event.detail.errorInfo,
      });
    }
  });
}
