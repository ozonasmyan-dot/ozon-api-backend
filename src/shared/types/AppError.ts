export class AppError<T = unknown> extends Error {
    public readonly statusCode: number;
    public readonly details?: T;

    constructor(message: string, statusCode: number, details?: T) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
