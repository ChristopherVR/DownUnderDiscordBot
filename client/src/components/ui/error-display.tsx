import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ErrorMessageService } from '@/lib/errorMessages';

interface ErrorDisplayProps {
  error: Error | string | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  variant?: 'default' | 'destructive' | 'inline';
  className?: string;
  showRetryCount?: boolean;
  context?: { component?: string; action?: string };
}

export function ErrorDisplay({
  error,
  title,
  description,
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  variant = 'default',
  className,
  showRetryCount = false,
  context,
}: ErrorDisplayProps) {
  const { t } = useTranslation();

  if (!error) return null;

  const messageService = new ErrorMessageService(t);
  const errorMessage = messageService.getErrorMessage(error, context);
  const guidance = messageService.getErrorGuidance(error, context);
  const canRetry = onRetry && retryCount < maxRetries;

  // Fallback message if localization fails
  const fallbackMessage = errorMessage || t('errors.fallback', 'Error details are not available');
  const displayTitle = title || t('ui.error', 'Error');

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1">
          <span>{fallbackMessage}</span>
          {guidance && <div className="text-xs text-muted-foreground mt-1">{guidance}</div>}
        </div>
        {canRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} disabled={isRetrying} className="h-6 px-2 text-xs">
            {isRetrying ? <RefreshCw className="h-3 w-3 animate-spin" /> : t('errors.retry', 'Try Again')}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant={variant === 'destructive' ? 'destructive' : 'default'} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{displayTitle}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0 hover:bg-transparent">
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          <p className="text-sm">{description || fallbackMessage}</p>
          {guidance && <p className="text-xs text-muted-foreground mt-2">{guidance}</p>}
          {showRetryCount && retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('ui.retryAttempt', 'Retry attempt {{current}} of {{max}}', { current: retryCount, max: maxRetries })}
            </p>
          )}
        </div>
        {canRetry && (
          <Button onClick={onRetry} disabled={isRetrying} variant="outline" size="sm" className="w-full">
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t('ui.retrying', 'Retrying...')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('errors.retry', 'Try Again')}
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  componentName?: string;
}

export function ErrorBoundaryFallback({ error, resetError, componentName }: ErrorBoundaryFallbackProps) {
  const { t } = useTranslation();

  const fallbackTitle = t('errors.component.crashed', `${componentName || 'Component'} Error`);
  const fallbackDescription = t(
    'errors.component.failed',
    'Something went wrong in this component. You can try reloading it.',
  );

  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <ErrorDisplay
        error={error}
        title={fallbackTitle}
        description={fallbackDescription}
        onRetry={resetError}
        variant="destructive"
        className="max-w-md"
        context={{ component: componentName }}
      />
    </div>
  );
}
