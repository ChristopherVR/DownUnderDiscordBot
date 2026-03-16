import { Request, Response, NextFunction } from 'express';
import { tErrors } from 'discord-dashboard-shared/localization';
import { enhancedLogger } from './logger/logger';
import { LogLevel } from '../types/logging';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  guildId?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    context?: ErrorContext,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = isOperational;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'UNAUTHORIZED', 401, context);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'CONFLICT', 409, context);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'RATE_LIMIT', 429, context);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'SERVER_ERROR', 500, context);
    this.name = 'ServerError';
  }
}

/**
 * Server-side error handler with localization support
 */
export class ErrorHandler {
  private readonly locale: string;

  constructor(locale: string = 'en') {
    this.locale = locale;
  }

  private translate(key: string, options?: Record<string, unknown>): string {
    return tErrors(key, { ...(options ?? {}), lng: this.locale });
  }

  /**
   * Get localized error message
   */
  private getLocalizedMessage(error: AppError): string {
    const baseKey = `${error.code.toLowerCase().replace(/_/g, '.')}`;
    const localizedMessage = this.translate(baseKey);

    // If localization exists and is different from the key, use it
    if (localizedMessage && localizedMessage !== baseKey) {
      return localizedMessage;
    }

    // Try component-specific error
    if (error.context?.component) {
      const componentKey = `${error.context.component.toLowerCase()}.${error.code.toLowerCase()}`;
      const componentMessage = this.translate(componentKey);
      if (componentMessage && componentMessage !== componentKey) {
        return componentMessage;
      }
    }

    // Fallback to generic error or original message
    const genericMessage = this.translate('generic');
    return genericMessage || error.message;
  }

  /**
   * Get contextual error guidance
   */
  private getErrorGuidance(error: AppError): string | null {
    if (!error.context?.component || !error.context?.action) {
      return null;
    }

    const comp = error.context.component.toLowerCase();
    const action = error.context.action.toLowerCase();

    const guidanceKey = `guidance.${comp}.${action}`;
    const guidance = this.translate(guidanceKey);

    return guidance && guidance !== guidanceKey ? guidance : null;
  }

  /**
   * Handle error and send appropriate response
   */
  handleError(error: unknown, res: Response, context?: ErrorContext): void {
    const appError = this.normalizeError(error, context);

    // Log error for debugging
    enhancedLogger.system(LogLevel.ERROR, 'Error handled', {
      error: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      context: appError.context,
      stack: appError.stack,
    });

    // Get localized message and guidance
    const message = this.getLocalizedMessage(appError);
    const guidance = this.getErrorGuidance(appError);

    // Send error response
    res.status(appError.statusCode).json({
      status: 'error',
      code: appError.code,
      message,
      guidance,
      context: appError.context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convert any error to AppError
   */
  private normalizeError(error: unknown, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('Guild ID is required')) {
        return new ValidationError(this.translate('command.validation.required') || 'Guild ID is required', context);
      }

      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return new NotFoundError(this.translate('command.notFound') || 'Resource not found', context);
      }

      if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        return new UnauthorizedError(this.translate('command.unauthorized') || 'Unauthorized', context);
      }

      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        return new RateLimitError(this.translate('connection.discord.rateLimited') || 'Rate limited', context);
      }

      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        return new ServerError(this.translate('connection.timeout') || 'Request timeout', context);
      }

      // Component-specific errors
      if (context?.component) {
        const componentError = this.getComponentSpecificError(error, context);
        if (componentError) {
          return componentError;
        }
      }

      return new ServerError(error.message, context);
    }

    return new ServerError(this.translate('generic') || 'An unexpected error occurred', context);
  }

  /**
   * Get component-specific error
   */
  private getComponentSpecificError(error: Error, context: ErrorContext): AppError | null {
    const message = error.message.toLowerCase();
    const comp = context.component?.toLowerCase();

    switch (comp) {
      case 'musicplayer':
      case 'player':
        if (message.includes('track') || message.includes('song')) {
          return new NotFoundError(this.translate('player.trackNotFound') || 'Track not found', context);
        }
        if (message.includes('voice') || message.includes('channel')) {
          return new ValidationError(
            this.translate('player.voice.notConnected') || 'Bot is not connected to voice channel',
            context,
          );
        }
        if (message.includes('playback')) {
          return new ServerError(this.translate('player.playbackFailed') || 'Playback failed', context);
        }
        break;

      case 'command':
      case 'commandexecutor':
        if (message.includes('permission')) {
          return new UnauthorizedError(this.translate('command.unauthorized') || 'Permission denied', context);
        }
        if (message.includes('validation')) {
          return new ValidationError(this.translate('command.invalid') || 'Invalid command', context);
        }
        if (message.includes('timeout')) {
          return new ServerError(this.translate('command.execution.timeout') || 'Command timeout', context);
        }
        break;

      case 'upload':
      case 'fileuploader':
        if (message.includes('size') || message.includes('large')) {
          return new ValidationError(this.translate('upload.fileTooBig') || 'File too large', context);
        }
        if (message.includes('format') || message.includes('type')) {
          return new ValidationError(this.translate('upload.invalidFormat') || 'Invalid file format', context);
        }
        if (message.includes('storage') || message.includes('space')) {
          return new ServerError(this.translate('upload.storage.full') || 'Storage full', context);
        }
        break;

      case 'bot':
      case 'botmanagement':
        if (message.includes('instance')) {
          return new NotFoundError(this.translate('bot.instanceNotFound') || 'Bot instance not found', context);
        }
        if (message.includes('offline')) {
          return new ConflictError(
            this.translate('bot.management.instanceOffline') || 'Bot instance is offline',
            context,
          );
        }
        break;
    }

    return null;
  }

  /**
   * Create error handler middleware
   */
  static createMiddleware(locale: string = 'en') {
    const handler = new ErrorHandler(locale);

    return (error: unknown, req: Request, res: Response, _next: NextFunction) => {
      // Extract context from request
      const context: ErrorContext = {
        component: req.headers['x-component'] as string,
        action: req.headers['x-action'] as string,
        userId: req.headers['x-user-id'] as string,
        guildId: req.headers['x-guild-id'] as string,
        metadata: {
          method: req.method,
          path: req.path,
          userAgent: req.headers['user-agent'],
        },
      };

      handler.handleError(error, res, context);
    };
  }

  /**
   * Create async error wrapper for route handlers
   */
  static asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
    context?: Partial<ErrorContext>,
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      const locale = req.headers['accept-language']?.split(',')[0] || 'en';
      const handler = new ErrorHandler(locale);

      Promise.resolve(fn(req, res, next)).catch((error) => {
        const fullContext: ErrorContext = {
          ...context,
          component: req.headers['x-component'] as string,
          action: req.headers['x-action'] as string,
          userId: req.headers['x-user-id'] as string,
          guildId: req.headers['x-guild-id'] as string,
        };

        handler.handleError(error, res, fullContext);
      });
    };
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Helper function to throw localized errors
 */
export function throwLocalizedError(
  errorType: 'validation' | 'notFound' | 'unauthorized' | 'conflict' | 'rateLimit' | 'server',
  messageKey: string,
  context?: ErrorContext,
  locale: string = 'en',
): never {
  const message = tErrors(messageKey, { lng: locale }) || messageKey;

  switch (errorType) {
    case 'validation':
      throw new ValidationError(message, context);
    case 'notFound':
      throw new NotFoundError(message, context);
    case 'unauthorized':
      throw new UnauthorizedError(message, context);
    case 'conflict':
      throw new ConflictError(message, context);
    case 'rateLimit':
      throw new RateLimitError(message, context);
    case 'server':
    default:
      throw new ServerError(message, context);
  }
}
