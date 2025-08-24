import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { AppError } from '@/errors/AppError';

export default function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error(err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message, details: err.details });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
}
