import { setupGlobalErrorHandling } from './errorHandler';
import { toast } from 'sonner';
import { TFunction } from 'i18next';

type NetworkInformationDetails = {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
};

type NavigatorWithNetworkInformation = Navigator & {
  connection?: NetworkInformationDetails;
  mozConnection?: NetworkInformationDetails;
  webkitConnection?: NetworkInformationDetails;
};

/**
 * Initialize global error handling for the application
 */
export function initializeGlobalErrorHandling(t?: TFunction) {
  // Set up global error handlers with localization support
  setupGlobalErrorHandling(t);

  // Handle component errors (already handled by setupGlobalErrorHandling if t is provided)
  if (!t) {
    window.addEventListener('component-error', (event: CustomEvent) => {
      const { error, component } = event.detail;
      console.error(`Component error in ${component}:`, error);

      toast.error(`Component Error`, {
        description: `An error occurred in the ${component} component. Please refresh the page if the issue persists.`,
      });
    });
  }

  // Handle WebSocket errors
  window.addEventListener('websocket-error', (event: CustomEvent) => {
    const { attempts } = event.detail;
    console.warn('WebSocket connection error, attempt:', attempts);

    if (attempts === 1) {
      const message = t
        ? t('errors.connection.websocket.disconnected', 'WebSocket disconnected. Attempting to reconnect...')
        : 'Lost connection to server. Attempting to reconnect...';
      toast.warning(t ? t('ui.connectionIssue', 'Connection Issue') : 'Connection Issue', {
        description: message,
      });
    }
  });

  // Handle WebSocket max retries
  window.addEventListener('websocket-max-retries', (event: CustomEvent) => {
    const { attempts } = event.detail;
    console.error('WebSocket max retries reached:', attempts);

    const message = t
      ? t('errors.connection.websocket.failed', 'WebSocket connection failed. Real-time updates may not work.')
      : 'Unable to connect to server after multiple attempts. Please check your internet connection and refresh the page.';
    const guidance = t
      ? t(
          'errors.guidance.websocket.connection',
          'Check your internet connection. The page will automatically reconnect when possible.',
        )
      : 'Please check your internet connection and refresh the page.';

    toast.error(t ? t('ui.connectionFailed', 'Connection Failed') : 'Connection Failed', {
      description: `${message} ${guidance}`,
      action: {
        label: t ? t('ui.refreshPage', 'Refresh Page') : 'Refresh Page',
        onClick: () => window.location.reload(),
      },
    });
  });

  // Handle WebSocket reconnection success
  window.addEventListener('websocket-reconnected', () => {
    const message = t
      ? t('errors.connection.websocket.reconnected', 'Successfully reconnected to server.')
      : 'Successfully reconnected to server.';
    toast.success(t ? t('ui.reconnected', 'Reconnected') : 'Reconnected', {
      description: message,
    });
  });

  // Handle API errors globally
  window.addEventListener('api-error', (event: CustomEvent) => {
    const { error, endpoint } = event.detail;
    console.error(`API error on ${endpoint}:`, error);

    // Don't show toast for every API error as components handle their own
    // This is mainly for logging and monitoring
  });

  // Handle validation errors
  window.addEventListener('validation-error', (event: CustomEvent) => {
    const { error, field } = event.detail;
    console.warn(`Validation error on ${field}:`, error);

    // Components should handle their own validation errors
    // This is for global validation issues
  });

  // Handle network status changes
  window.addEventListener('online', () => {
    const message = t ? t('ui.backOnline', 'Internet connection restored.') : 'Internet connection restored.';
    toast.success(t ? t('ui.online', 'Back Online') : 'Back Online', {
      description: message,
    });
  });

  window.addEventListener('offline', () => {
    const message = t
      ? t('errors.network.offline', 'You appear to be offline. Please check your internet connection.')
      : 'Internet connection lost. Some features may not work properly.';
    toast.warning(t ? t('ui.offline', 'Offline') : 'Offline', {
      description: message,
    });
  });

  console.log('Global error handling initialized');
}

/**
 * Emit a global error event
 */
export function emitGlobalError(type: string, details: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent(`${type}-error`, {
      detail: details,
    }),
  );
}

/**
 * Check if the application is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get network information if available
 */
export function getNetworkInfo() {
  const navigatorWithConnection = navigator as NavigatorWithNetworkInformation;
  const connection =
    navigatorWithConnection.connection ||
    navigatorWithConnection.mozConnection ||
    navigatorWithConnection.webkitConnection;

  if (connection) {
    const { effectiveType, downlink, rtt, saveData } = connection;
    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
    };
  }

  return null;
}
