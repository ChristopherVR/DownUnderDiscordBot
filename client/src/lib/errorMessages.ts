import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

/**
 * Maps error codes and types to localized error messages
 */
export class ErrorMessageService {
  private readonly fallbackMessages: Record<string, string> = {
    generic: 'An unexpected error occurred. Please try again.',
    fallback: 'Error details are not available.',
  };

  private normalizeErrorKey(key: string) {
    return key.startsWith('errors.') ? key.slice('errors.'.length) : key;
  }

  private t: TFunction;

  constructor(t: TFunction) {
    this.t = t;
  }

  private tErrors(key: string, options?: unknown) {
    const normalizedKey = this.normalizeErrorKey(key);

    const baseOptions: Record<string, unknown> = { ns: 'errors' };
    let result: unknown;

    if (typeof options === 'string') {
      result = this.t(normalizedKey, { ...baseOptions, defaultValue: options });
    } else if (options && typeof options === 'object') {
      result = this.t(normalizedKey, { ...baseOptions, ...(options as Record<string, unknown>) });
    } else {
      result = this.t(normalizedKey, baseOptions);
    }

    if (typeof result === 'string' && result.trim().length > 0) {
      return result;
    }

    const fallbackTemplate = this.fallbackMessages[normalizedKey];
    if (fallbackTemplate) {
      return this.applyInterpolation(fallbackTemplate, options);
    }

    if (typeof options === 'object' && options && 'defaultValue' in options && typeof options.defaultValue === 'string') {
      return this.applyInterpolation(options.defaultValue, options);
    }

    return normalizedKey;
  }

  private applyInterpolation(template: string, options?: unknown): string {
    if (!options || typeof options !== 'object') {
      return template;
    }

    return Object.entries(options as Record<string, unknown>).reduce((acc, [prop, value]) => {
      if (prop === 'ns') {
        return acc;
      }
      if (typeof value === 'string') {
        return acc.replace(new RegExp(`\\{\\{${prop}\\}\\}`, 'g'), value);
      }
      return acc;
    }, template);
  }

  /**
   * Get localized error message based on error code or type
   */
  getErrorMessage(error: unknown, context?: { component?: string; action?: string }): string {
    if (typeof error === 'string') {
      return this.getMessageByKey(error, context);
    }

    if (error instanceof Error) {
      return this.getMessageByError(error, context);
    }

    return this.tErrors('generic');
  }

  private getMessageByKey(key: string, context?: { component?: string; action?: string }): string {
    const normalizedKey = this.normalizeErrorKey(key);
    const message = this.tErrors(key);

    if (message !== normalizedKey) {
      return message;
    }

    if (context?.component) {
      const componentKey = `${context.component.toLowerCase()}.${normalizedKey}`;
      const componentMessage = this.tErrors(componentKey);
      if (componentMessage !== this.normalizeErrorKey(componentKey)) {
        return componentMessage;
      }
    }

    return this.tErrors('generic');
  }


  private getMessageByError(error: Error, context?: { component?: string; action?: string }): string {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return this.tErrors('connection.failed');
    }

    if (message.includes('timeout')) {
      return this.tErrors('connection.timeout');
    }

    if (message.includes('websocket')) {
      return this.tErrors('connection.websocket.failed');
    }

    // HTTP status errors
    if (message.includes('400') || message.includes('bad request')) {
      return this.tErrors('api.badRequest');
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      return this.tErrors('command.unauthorized');
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return this.tErrors('api.forbidden');
    }

    if (message.includes('404') || message.includes('not found')) {
      return this.tErrors('api.notFound');
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return this.tErrors('connection.discord.rateLimited');
    }

    if (message.includes('500') || message.includes('server error')) {
      return this.tErrors('api.serverError');
    }

    // Component-specific errors
    if (context?.component) {
      const componentMessage = this.getComponentSpecificMessage(error, context.component, context.action);
      if (componentMessage) {
        return componentMessage;
      }
    }

    // Use the original error message if it's user-friendly
    if (this.isUserFriendlyMessage(error.message)) {
      return error.message;
    }

    return this.tErrors('generic');
  }

  private getComponentSpecificMessage(error: Error, component: string, _action?: string): string | null {
    const message = error.message.toLowerCase();
    const comp = component.toLowerCase();

    switch (comp) {
      case 'musicplayer':
        if (message.includes('track') || message.includes('song')) {
          return this.tErrors('player.trackNotFound');
        }
        if (message.includes('voice') || message.includes('channel')) {
          return this.tErrors('player.voice.notConnected');
        }
        if (message.includes('playback')) {
          return this.tErrors('player.playbackFailed');
        }
        break;

      case 'commandexecutor':
        if (message.includes('permission')) {
          return this.tErrors('command.unauthorized');
        }
        if (message.includes('validation')) {
          return this.tErrors('command.invalid');
        }
        if (message.includes('timeout')) {
          return this.tErrors('command.execution.timeout');
        }
        break;

      case 'fileuploader':
        if (message.includes('size') || message.includes('large')) {
          return this.tErrors('upload.fileTooBig', { maxSize: '50' });
        }
        if (message.includes('format') || message.includes('type')) {
          return this.tErrors('upload.invalidFormat', {
            formats: 'MP3, WAV, FLAC, OGG, M4A',
          });
        }
        if (message.includes('storage') || message.includes('space')) {
          return this.tErrors('upload.storage.full');
        }
        break;

      case 'websocket':
        if (message.includes('connection')) {
          return this.tErrors('connection.websocket.failed');
        }
        if (message.includes('reconnect')) {
          return this.tErrors('connection.websocket.reconnecting');
        }
        break;
    }

    return null;
  }

  private isUserFriendlyMessage(message: string): boolean {
    // Check if the message looks like a user-friendly error message
    // (not a technical error with stack traces, etc.)
    const technicalPatterns = [
      /at\s+\w+\s*\(/, // Stack trace
      /Error:\s*\w+Error/, // Technical error types
      /\w+Exception/, // Exception names
      /\d{3}\s+\w+/, // HTTP status codes
      /\w+:\d+:\d+/, // File:line:column
    ];

    return (
      !technicalPatterns.some((pattern) => pattern.test(message)) && message.length < 200 && !message.includes('\n')
    );
  }

  /**
   * Get contextual error guidance for users
   */
  getErrorGuidance(error: unknown, context?: { component?: string; action?: string }): string | null {
    if (!context?.component || !context?.action) {
      return null;
    }

    const comp = context.component.toLowerCase();
    const action = context.action.toLowerCase();

    switch (comp) {
      case 'musicplayer':
        switch (action) {
          case 'play':
            return this.tErrors('guidance.musicPlayer.play', {
              default: 'Make sure the bot is connected to a voice channel and try again.',
            });
          case 'upload':
            return this.tErrors('guidance.musicPlayer.upload', {
              default: 'Check that your file is a supported audio format and under 50MB.',
            });
        }
        break;

      case 'commandexecutor':
        switch (action) {
          case 'execute':
            return this.tErrors('guidance.commandExecutor.execute', {
              default: 'Verify all required fields are filled and try again.',
            });
        }
        break;

      case 'websocket':
        return this.tErrors('guidance.websocket.connection', {
          default: 'Check your internet connection. The page will automatically reconnect when possible.',
        });
    }

    return null;
  }
}

/**
 * Hook to get error message service with current translation function
 */
export function useErrorMessages() {
  const { t } = useTranslation();
  return new ErrorMessageService(t);
}
