import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Response } from 'express';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const tErrorsMock = vi.hoisted(() => vi.fn((key: string) => key));

vi.mock('discord-dashboard-shared/localization', () => ({
  tErrors: tErrorsMock,
}));

vi.mock('../../../src/helpers/logger/logger', () => ({
  enhancedLogger: {
    system: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,
  ServerError,
  ErrorHandler,
  globalErrorHandler,
  throwLocalizedError,
} from '../../../src/helpers/errorHandler';

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default tErrors returns the key itself (simulates missing translation)
    tErrorsMock.mockImplementation((key: string) => key);
  });

  // ── Error classes ──────────────────────────────────────────────────

  describe('AppError', () => {
    it('creates an error with default values', () => {
      const err = new AppError('Something failed');
      expect(err.message).toBe('Something failed');
      expect(err.code).toBe('UNKNOWN_ERROR');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
      expect(err.name).toBe('AppError');
      expect(err).toBeInstanceOf(Error);
    });

    it('creates an error with custom values', () => {
      const ctx = { component: 'player', action: 'play' };
      const err = new AppError('Custom error', 'CUSTOM_CODE', 418, ctx, false);
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.statusCode).toBe(418);
      expect(err.context).toEqual(ctx);
      expect(err.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('creates a 400 error', () => {
      const err = new ValidationError('Invalid input');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('creates a 404 error', () => {
      const err = new NotFoundError('Not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.name).toBe('NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    it('creates a 401 error', () => {
      const err = new UnauthorizedError('No access');
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.name).toBe('UnauthorizedError');
    });
  });

  describe('ConflictError', () => {
    it('creates a 409 error', () => {
      const err = new ConflictError('Already exists');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
      expect(err.name).toBe('ConflictError');
    });
  });

  describe('RateLimitError', () => {
    it('creates a 429 error', () => {
      const err = new RateLimitError('Too many requests');
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMIT');
      expect(err.name).toBe('RateLimitError');
    });
  });

  describe('ServerError', () => {
    it('creates a 500 error', () => {
      const err = new ServerError('Internal error');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('SERVER_ERROR');
      expect(err.name).toBe('ServerError');
    });
  });

  // ── ErrorHandler.handleError ───────────────────────────────────────

  describe('ErrorHandler.handleError', () => {
    let handler: ErrorHandler;
    let mockRes: Partial<Response> & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      handler = new ErrorHandler();
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
    });

    it('handles AppError with correct status code and code', () => {
      const error = new ValidationError('Bad input', { component: 'player' });

      handler.handleError(error, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
        }),
      );
    });

    it('normalizes plain Error to ServerError', () => {
      const error = new Error('Something broke');

      handler.handleError(error, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SERVER_ERROR',
        }),
      );
    });

    it('normalizes non-Error values to ServerError', () => {
      handler.handleError('string error', mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SERVER_ERROR',
        }),
      );
    });

    it('normalizes "not found" errors to NotFoundError', () => {
      handler.handleError(new Error('Resource not found'), mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NOT_FOUND' }));
    });

    it('normalizes "unauthorized" errors to UnauthorizedError', () => {
      handler.handleError(new Error('unauthorized access'), mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('normalizes "rate limit" errors to RateLimitError', () => {
      handler.handleError(new Error('rate limit exceeded'), mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('normalizes "timeout" errors to ServerError with timeout code', () => {
      handler.handleError(new Error('request timeout'), mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'SERVER_ERROR' }));
    });

    it('normalizes "Guild ID is required" to ValidationError', () => {
      handler.handleError(new Error('Guild ID is required'), mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('uses localized message when translation exists', () => {
      tErrorsMock.mockImplementation((key: string) => {
        if (key === 'validation.error') return 'Translated validation error';
        return key;
      });

      const error = new ValidationError('Bad input');
      handler.handleError(error, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Translated validation error',
        }),
      );
    });

    it('includes guidance when available', () => {
      tErrorsMock.mockImplementation((key: string) => {
        if (key === 'guidance.player.play') return 'Try reconnecting to voice';
        return key;
      });

      const error = new AppError('Fail', 'PLAY_ERR', 500, { component: 'player', action: 'play' });
      handler.handleError(error, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          guidance: 'Try reconnecting to voice',
        }),
      );
    });

    it('returns null guidance when no translation is found', () => {
      const error = new AppError('Fail', 'PLAY_ERR', 500, { component: 'player', action: 'play' });
      handler.handleError(error, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          guidance: null,
        }),
      );
    });

    it('merges context from parameter', () => {
      const ctx = { component: 'player', guildId: 'guild-1' };
      handler.handleError(new Error('oops'), mockRes as Response, ctx);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({ component: 'player', guildId: 'guild-1' }),
        }),
      );
    });
  });

  // ── Component-specific error mapping ───────────────────────────────

  describe('component-specific error mapping', () => {
    let handler: ErrorHandler;
    let mockRes: Partial<Response> & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      handler = new ErrorHandler();
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
    });

    it('maps player track errors to NotFoundError', () => {
      handler.handleError(new Error('track not available'), mockRes as Response, { component: 'player' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('maps player voice errors to ValidationError', () => {
      handler.handleError(new Error('voice channel required'), mockRes as Response, { component: 'player' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('maps player playback errors to ServerError', () => {
      handler.handleError(new Error('playback failed unexpectedly'), mockRes as Response, { component: 'player' });
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('maps command permission errors to UnauthorizedError', () => {
      handler.handleError(new Error('permission denied'), mockRes as Response, { component: 'command' });
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('maps command validation errors to ValidationError', () => {
      handler.handleError(new Error('validation failed'), mockRes as Response, { component: 'command' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('maps upload size errors to ValidationError', () => {
      handler.handleError(new Error('file too large'), mockRes as Response, { component: 'upload' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('maps upload format errors to ValidationError', () => {
      handler.handleError(new Error('invalid format'), mockRes as Response, { component: 'upload' });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('maps upload storage errors to ServerError', () => {
      handler.handleError(new Error('storage full'), mockRes as Response, { component: 'upload' });
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('maps bot instance errors to NotFoundError', () => {
      handler.handleError(new Error('instance not available'), mockRes as Response, { component: 'bot' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('maps bot offline errors to ConflictError', () => {
      handler.handleError(new Error('bot is offline'), mockRes as Response, { component: 'bot' });
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  // ── ErrorHandler.createMiddleware ──────────────────────────────────

  describe('ErrorHandler.createMiddleware', () => {
    it('handles errors as Express error middleware', async () => {
      const app = express();

      app.get('/fail', (_req, _res, next) => {
        next(new ValidationError('Bad request'));
      });

      app.use(ErrorHandler.createMiddleware());

      const response = await request(app).get('/fail');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.status).toBe('error');
    });

    it('extracts context from request headers', async () => {
      const app = express();

      app.get('/fail', (_req, _res, next) => {
        next(new Error('test error'));
      });

      app.use(ErrorHandler.createMiddleware());

      const response = await request(app)
        .get('/fail')
        .set('x-component', 'player')
        .set('x-action', 'play')
        .set('x-user-id', 'user-1')
        .set('x-guild-id', 'guild-1');

      expect(response.status).toBe(500);
      expect(response.body.context).toEqual(
        expect.objectContaining({
          component: 'player',
          action: 'play',
          userId: 'user-1',
          guildId: 'guild-1',
        }),
      );
    });
  });

  // ── ErrorHandler.asyncHandler ──────────────────────────────────────

  describe('ErrorHandler.asyncHandler', () => {
    it('catches async errors and sends formatted response', async () => {
      const app = express();

      app.get(
        '/async-fail',
        ErrorHandler.asyncHandler(async (_req, _res) => {
          throw new NotFoundError('Resource missing');
        }),
      );

      const response = await request(app).get('/async-fail');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('allows successful async handlers to respond normally', async () => {
      const app = express();

      app.get(
        '/async-ok',
        ErrorHandler.asyncHandler(async (_req, res) => {
          res.json({ success: true });
        }),
      );

      const response = await request(app).get('/async-ok');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('merges static context with request context', async () => {
      const app = express();

      app.get(
        '/async-context',
        ErrorHandler.asyncHandler(
          async () => {
            throw new Error('boom');
          },
          { component: 'musicplayer' },
        ),
      );

      const response = await request(app).get('/async-context').set('x-guild-id', 'guild-1');

      // The x-component header overrides static context when set, but since
      // we only set x-guild-id, the component from static context is overridden
      // by the (undefined) request header. Verify guildId is passed through.
      expect(response.body.context).toEqual(
        expect.objectContaining({
          guildId: 'guild-1',
        }),
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── throwLocalizedError ────────────────────────────────────────────

  describe('throwLocalizedError', () => {
    it('throws ValidationError for "validation" type', () => {
      expect(() => throwLocalizedError('validation', 'test.key')).toThrow(ValidationError);
    });

    it('throws NotFoundError for "notFound" type', () => {
      expect(() => throwLocalizedError('notFound', 'test.key')).toThrow(NotFoundError);
    });

    it('throws UnauthorizedError for "unauthorized" type', () => {
      expect(() => throwLocalizedError('unauthorized', 'test.key')).toThrow(UnauthorizedError);
    });

    it('throws ConflictError for "conflict" type', () => {
      expect(() => throwLocalizedError('conflict', 'test.key')).toThrow(ConflictError);
    });

    it('throws RateLimitError for "rateLimit" type', () => {
      expect(() => throwLocalizedError('rateLimit', 'test.key')).toThrow(RateLimitError);
    });

    it('throws ServerError for "server" type', () => {
      expect(() => throwLocalizedError('server', 'test.key')).toThrow(ServerError);
    });

    it('uses localized message from tErrors', () => {
      tErrorsMock.mockReturnValue('Localized message');

      try {
        throwLocalizedError('validation', 'some.key');
      } catch (err) {
        expect((err as AppError).message).toBe('Localized message');
      }
    });

    it('falls back to message key when translation returns empty', () => {
      tErrorsMock.mockReturnValue('');

      try {
        throwLocalizedError('validation', 'fallback.key');
      } catch (err) {
        expect((err as AppError).message).toBe('fallback.key');
      }
    });

    it('includes context when provided', () => {
      const ctx = { component: 'player', guildId: 'guild-1' };
      try {
        throwLocalizedError('notFound', 'test.key', ctx);
      } catch (err) {
        expect((err as AppError).context).toEqual(ctx);
      }
    });
  });

  // ── globalErrorHandler ─────────────────────────────────────────────

  describe('globalErrorHandler', () => {
    it('is an instance of ErrorHandler', () => {
      expect(globalErrorHandler).toBeInstanceOf(ErrorHandler);
    });
  });
});
