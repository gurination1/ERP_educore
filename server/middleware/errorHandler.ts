import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('API Error:', err);

  const statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
