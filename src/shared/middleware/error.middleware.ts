import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/shared/types/AppError';

export default function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    logger.error(err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message, details: err.details });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
}
