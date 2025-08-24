import {Request, Response, NextFunction} from 'express';
import {logger} from '@/shared/logger';
import {AppError} from '@/shared/types/AppError';

/**
 * Global error handling middleware. Transforms any thrown error into a
 * unified JSON response and logs the error using the application logger.
 */
export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (err instanceof AppError) {
        logger.warn({err}, 'Handled application error');
        res.status(err.statusCode).json({error: err.message, details: err.details});
        return;
    }

    const message = err instanceof Error ? err.message : 'Internal Server Error';
    logger.error({err}, 'Unhandled error');
    res.status(500).json({error: message});
}

export default errorHandler;

