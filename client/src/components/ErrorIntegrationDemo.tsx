import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wifi, WifiOff, Upload, Music, Terminal } from 'lucide-react';

/**
 * Demo component showcasing integrated localized error handling
 * This component demonstrates all the error handling features working together
 */
export function ErrorIntegrationDemo() {
  const { t } = useTranslation();
  const [selectedComponent, setSelectedComponent] = useState<string>('MusicPlayer');

  const { error, isRetrying, retryCount, handleError, retry, clearError, withErrorHandling } = useErrorHandling({
    component: selectedComponent,
  });

  const simulateErrors = {
    networkError: () => {
      handleError(new Error('fetch failed'), { action: 'networkRequest' });
    },

    validationError: () => {
      handleError(new Error('validation failed'), { action: 'validateInput' });
    },

    componentSpecificError: () => {
      const errors = {
        MusicPlayer: new Error('track not found'),
        CommandExecutor: new Error('permission denied'),
        FileUploader: new Error('file too large'),
        WebSocket: new Error('connection failed'),
      };
      handleError(errors[selectedComponent as keyof typeof errors] || new Error('generic error'), {
        action: 'componentAction',
      });
    },

    httpStatusError: () => {
      const statusCodes = ['400', '401', '404', '429', '500'];
      const randomStatus = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      handleError(new Error(`${randomStatus} error occurred`), { action: 'apiRequest' });
    },

    asyncOperationError: async () => {
      await withErrorHandling(
        async () => {
          // Simulate async operation that fails
          await new Promise((_, reject) => setTimeout(() => reject(new Error('async operation failed')), 1000));
        },
        { action: 'asyncOperation' },
        { maxAttempts: 3, delay: 1000, backoff: 'exponential' },
      );
    },
  };

  const componentOptions = [
    { value: 'MusicPlayer', label: 'Music Player', icon: Music },
    { value: 'CommandExecutor', label: 'Command Executor', icon: Terminal },
    { value: 'FileUploader', label: 'File Uploader', icon: Upload },
    { value: 'WebSocket', label: 'WebSocket', icon: Wifi },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="border rounded-lg">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t('ui.common.error', 'Error')} Integration Demo</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Demonstrates localized error handling with contextual guidance and fallback mechanisms
          </p>
          <div className="space-y-4">
            {/* Component Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Component Context:</label>
              <div className="flex flex-wrap gap-2">
                {componentOptions.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={selectedComponent === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedComponent(value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Error Simulation Buttons */}
            <div>
              <label className="text-sm font-medium mb-2 block">Simulate Error Types:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateErrors.networkError}
                  className="flex items-center gap-2"
                >
                  <WifiOff className="h-4 w-4" />
                  Network Error
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateErrors.validationError}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Validation Error
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateErrors.componentSpecificError}
                  className="flex items-center gap-2"
                >
                  <Music className="h-4 w-4" />
                  Component Error
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateErrors.httpStatusError}
                  className="flex items-center gap-2"
                >
                  <Terminal className="h-4 w-4" />
                  HTTP Status Error
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={simulateErrors.asyncOperationError}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Async Error (Retry)
                </Button>

                <Button variant="outline" size="sm" onClick={clearError} disabled={!error}>
                  Clear Error
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Error Display (Default):</label>
                  <ErrorDisplay
                    error={error}
                    onRetry={() => retry()}
                    onDismiss={clearError}
                    isRetrying={isRetrying}
                    retryCount={retryCount}
                    showRetryCount={true}
                    context={{ component: selectedComponent }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Error Display (Inline):</label>
                  <ErrorDisplay
                    error={error}
                    variant="inline"
                    onRetry={() => retry()}
                    onDismiss={clearError}
                    isRetrying={isRetrying}
                    context={{ component: selectedComponent }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Error Display (Destructive):</label>
                  <ErrorDisplay
                    error={error}
                    variant="destructive"
                    onRetry={() => retry()}
                    onDismiss={clearError}
                    isRetrying={isRetrying}
                    context={{ component: selectedComponent }}
                  />
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Current Status:</h4>
              <div className="text-sm space-y-1">
                <div>
                  Component Context: <code>{selectedComponent}</code>
                </div>
                <div>
                  Has Error: <code>{error ? 'true' : 'false'}</code>
                </div>
                <div>
                  Is Retrying: <code>{isRetrying ? 'true' : 'false'}</code>
                </div>
                <div>
                  Retry Count: <code>{retryCount}</code>
                </div>
                {error && (
                  <div>
                    Error Type: <code>{error.constructor.name}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Integration Features */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Integration Features Demonstrated:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✅ Localized error messages with i18next</li>
                <li>✅ Component-specific error handling</li>
                <li>✅ Contextual error guidance</li>
                <li>✅ Fallback mechanisms for missing translations</li>
                <li>✅ HTTP status code recognition</li>
                <li>✅ Retry logic with exponential backoff</li>
                <li>✅ Multiple error display variants</li>
                <li>✅ Toast notifications (check top-right)</li>
                <li>✅ Global error event handling</li>
                <li>✅ Template variable replacement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorIntegrationDemo;
