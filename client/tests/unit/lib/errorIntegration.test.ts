import type { TFunction } from 'i18next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorMessageService } from '../../../src/lib/errorMessages';
import { ErrorHandler, AppError, NetworkError, ValidationError } from '../../../src/lib/errorHandler';

type ErrorContext = Parameters<ErrorHandler['handleError']>[1];

const baseTranslations: Record<string, string> = {
  generic: 'An unexpected error occurred. Please try again.',
  fallback: 'Error details are not available.',
  'connection.failed': 'Connection failed. Please check your network and try again.',
  'connection.timeout': 'Connection timeout. Please try again.',
  'connection.websocket.failed': 'WebSocket connection failed. Real-time updates may not work.',
  'connection.websocket.reconnecting': 'Reconnecting to the server...',
  'command.unauthorized': "You don't have permission to execute this command.",
  'command.invalid': 'Invalid command. Please check the command syntax.',
  'player.trackNotFound': 'Track not found or unavailable.',
  'player.voice.notConnected': 'Bot is not connected to a voice channel.',
  'player.playbackFailed': 'Playback failed unexpectedly.',
  'upload.fileTooBig': 'File is too large. Maximum size is {{maxSize}}MB.',
  'upload.invalidFormat': 'Invalid file format. Supported formats: {{formats}}.',
  'upload.storage.full': 'Storage is full. Please remove unused files and try again.',
  'api.badRequest': 'The request could not be processed. Please verify your input.',
  'api.forbidden': 'You do not have access to perform this action.',
  'api.notFound': 'The requested resource was not found.',
  'api.serverError': 'A server error occurred. Please try again later.',
  'connection.discord.rateLimited': 'Too many requests. Please slow down.',
  'guidance.musicPlayer.play': 'Make sure the bot is connected to a voice channel and try again.',
  'guidance.commandExecutor.execute': 'Verify all required fields are filled and try again.',
};

function createMockTranslator(overrides: Record<string, string> = {}): TFunction {
  const translations = { ...baseTranslations, ...overrides };

  const translator = vi.fn<[string, Record<string, unknown>?], string>((key, options) => {
    const template = translations[key] ?? (typeof options?.defaultValue === 'string' ? options.defaultValue : key);

    if (!options) {
      return template;
    }

    return Object.entries(options).reduce((acc, [prop, value]) => {
      if (prop === 'ns') {
        return acc;
      }
      if (typeof value === 'string') {
        return acc.replace(new RegExp(`\\{\\{${prop}\\}\\}`, 'g'), value);
      }
      return acc;
    }, template);
  });
  return translator as unknown as TFunction;

}

describe('Error Message Integration', () => {
  let translate: TFunction;
  let messageService: ErrorMessageService;
  let errorHandler: ErrorHandler;

  const normalizeError = (error: unknown, context?: ErrorContext): AppError =>
    (errorHandler as unknown as {
      normalizeError: (err: unknown, ctx?: ErrorContext) => AppError;
    }).normalizeError(error, context);

  const getMessageByError = (error: Error): string =>
    (messageService as unknown as { getMessageByError: (err: Error) => string }).getMessageByError(error);

  const getComponentSpecificMessage = (error: Error, component: string): string | null =>
    (messageService as unknown as {
      getComponentSpecificMessage: (err: Error, component: string, action?: string) => string | null;
    }).getComponentSpecificMessage(error, component);

  const isUserFriendlyMessage = (message: string): boolean =>
    (messageService as unknown as { isUserFriendlyMessage: (msg: string) => boolean }).isUserFriendlyMessage(message);

  beforeEach(() => {
    translate = createMockTranslator();
    messageService = new ErrorMessageService(translate);
    errorHandler = new ErrorHandler(translate);
  });

  describe('ErrorMessageService', () => {
    it('returns localized message for string keys', () => {
      const result = messageService.getErrorMessage('connection.failed');
      expect(result).toBe('Connection failed. Please check your network and try again.');
    });

    it('normalizes network errors', () => {
      const error = new Error('fetch failed');
      const result = messageService.getErrorMessage(error);
      expect(result).toBe('Connection failed. Please check your network and try again.');
    });

    it('provides component specific messages', () => {
      const error = new Error('track playback issue');
      const result = messageService.getErrorMessage(error, { component: 'MusicPlayer' });
      expect(result).toBe('Track not found or unavailable.');
    });

    it('falls back to generic message for unknown errors', () => {
      const error = new Error('unknown technical error');
      const result = messageService.getErrorMessage(error);
      expect(result).toBe('unknown technical error');
    });

    it('provides contextual guidance when available', () => {
      const guidance = messageService.getErrorGuidance('play_failed', {
        component: 'MusicPlayer',
        action: 'play',
      });
      expect(guidance).toBe('Make sure the bot is connected to a voice channel and try again.');
    });

    it('handles template variables through component context', () => {
      const result = messageService.getErrorMessage(new Error('file size exceeded'), {
        component: 'FileUploader',
      });
      expect(result).toContain('Maximum size is 50MB');
    });
  });

  describe('ErrorHandler Integration', () => {
    it('normalizes network failures to retryable errors', () => {
      const appError = normalizeError(new Error('fetch failed'), { component: 'API' }) as NetworkError;

      expect(appError).toBeInstanceOf(NetworkError);
      expect(appError.context?.component).toBe('API');
      expect(appError.isRetryable).toBe(true);
    });

    it('normalizes validation errors with context', () => {
      const appError = normalizeError(new Error('validation failed'), { component: 'CommandExecutor' });

      expect(appError).toBeInstanceOf(AppError);
      expect(appError.context?.component).toBe('CommandExecutor');
    });

    it('preserves existing AppError instances', () => {
            const originalError = new ValidationError('test error', { component: 'Test' });
      const result = normalizeError(originalError) as ValidationError;

      expect(result).toBe(originalError);
      expect(result.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Fallback behaviour', () => {
    it('uses generic message when translation is missing', () => {
      const missingTranslator = createMockTranslator({});
      const service = new ErrorMessageService(missingTranslator);
      const result = service.getErrorMessage('unknown.error');
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('handles failing translators gracefully', () => {
            const failingTranslator = vi.fn<[string, Record<string, unknown>?], string | null>(() => null) as unknown as TFunction;
            const service = new ErrorMessageService(failingTranslator);
      const result = service.getErrorMessage('generic.error');
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('returns null guidance when component or action is missing', () => {
      const guidance = messageService.getErrorGuidance('anything');
      expect(guidance).toBeNull();
    });
  });

  describe('HTTP status handling', () => {
    const cases: Array<{ error: Error; expected: string }> = [
      { error: new Error('400 bad request'), expected: 'The request could not be processed. Please verify your input.' },
      { error: new Error('401 unauthorized'), expected: "You don't have permission to execute this command." },
      { error: new Error('404 not found'), expected: 'The requested resource was not found.' },
      { error: new Error('429 rate limit'), expected: 'Too many requests. Please slow down.' },
      { error: new Error('500 server error'), expected: 'A server error occurred. Please try again later.' },
    ];

    it('produces localized messages for well known statuses', () => {
      cases.forEach(({ error, expected }) => {
        const result = getMessageByError(error);
        expect(result).toBe(expected);
      });
    });
  });

  describe('User friendly detection', () => {
    it('identifies user friendly messages', () => {
      const values = ['Connection failed', 'Invalid input provided', 'Please try again later'];
      values.forEach((value) => {
        expect(isUserFriendlyMessage(value)).toBe(true);
      });
    });

    it('flags technical messages', () => {
      const values = [
        'Error: TypeError at line 123',
        'NetworkException: Connection refused',
        'at Component.render (Component.tsx:45:12)',
        '500 Internal Server Error',
      ];
      values.forEach((value) => {
        expect(isUserFriendlyMessage(value)).toBe(false);
      });
    });
  });

  describe('Component specific helpers', () => {
    it('matches component specific rules when available', () => {
      const message = getComponentSpecificMessage(new Error('voice connection lost'), 'MusicPlayer');
      expect(message).toBe('Bot is not connected to a voice channel.');
    });

    it('returns null for unknown components', () => {
      const message = getComponentSpecificMessage(new Error('any error'), 'UnknownComponent');
      expect(message).toBeNull();
    });
  });
});













