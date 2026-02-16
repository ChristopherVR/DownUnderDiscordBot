import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from './logger';

// Type for async route handlers
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

// Enhanced router that automatically wraps handlers with error handling
export class EnhancedRouter {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  /**
   * Universal handler wrapper that works for both sync and async functions
   * This approach eliminates the need for async function detection by handling
   * both cases at runtime based on the actual return value
   */
  private wrapHandler(handler: RequestHandler | AsyncRequestHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = handler(req, res, next);

        // If result is Promise-like, handle async errors
        if (result && typeof result === 'object' && 'catch' in result && typeof result.catch === 'function') {
          (result as Promise<unknown>).catch((error: Error) => {
            logger.error(
              {
                error: error.message,
                stack: error.stack,
                method: req.method,
                url: req.url,
                ip: req.ip,
              },
              'Async route handler error',
            );
            next(error);
          });
        }
      } catch (error) {
        // Handle synchronous errors
        logger.error(
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            method: req.method,
            url: req.url,
            ip: req.ip,
          },
          'Sync route handler error',
        );
        next(error);
      }
    };
  }

  /**
   * GET route with automatic error handling
   */
  get(path: string, ...handlers: Array<RequestHandler | AsyncRequestHandler>): this {
    const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
    this.router.get(path, ...wrappedHandlers);
    return this;
  }

  /**
   * POST route with automatic error handling
   */
  post(path: string, ...handlers: Array<RequestHandler | AsyncRequestHandler>): this {
    const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
    this.router.post(path, ...wrappedHandlers);
    return this;
  }

  /**
   * PUT route with automatic error handling
   */
  put(path: string, ...handlers: Array<RequestHandler | AsyncRequestHandler>): this {
    const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
    this.router.put(path, ...wrappedHandlers);
    return this;
  }

  /**
   * DELETE route with automatic error handling
   */
  delete(path: string, ...handlers: Array<RequestHandler | AsyncRequestHandler>): this {
    const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
    this.router.delete(path, ...wrappedHandlers);
    return this;
  }

  /**
   * PATCH route with automatic error handling
   */
  patch(path: string, ...handlers: Array<RequestHandler | AsyncRequestHandler>): this {
    const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
    this.router.patch(path, ...wrappedHandlers);
    return this;
  }

  /**
   * Use middleware with automatic error handling
   */
  use(
    pathOrHandler: string | RequestHandler | AsyncRequestHandler,
    ...handlers: Array<RequestHandler | AsyncRequestHandler>
  ): this {
    if (typeof pathOrHandler === 'string') {
      const wrappedHandlers = handlers.map((handler) => this.wrapHandler(handler));
      this.router.use(pathOrHandler, ...wrappedHandlers);
    } else {
      const handler = pathOrHandler;
      this.router.use(this.wrapHandler(handler));
    }
    return this;
  }

  /**
   * Get the underlying Express router
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Factory function to create an enhanced router
 */
export function expressRouter(): EnhancedRouter {
  return new EnhancedRouter();
}
