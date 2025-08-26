import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler and forwards errors to the next middleware.
 */
const asyncHandler = <T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): RequestHandler => {
    const handler = (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<T> => fn(req, res, next).catch(next) as Promise<T>;

    return handler as unknown as RequestHandler;
};

export default asyncHandler;

