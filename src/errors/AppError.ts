export class AppError extends Error {
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
