import pino from 'pino';

/**
 * Global application logger. Uses human readable formatting in development
 * and defaults to JSON logs in production. Logging level is controlled by
 * the NODE_ENV environment variable.
 */
export const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'production' ? undefined : {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss dd-mm-yyyy',
            ignore: 'pid,hostname',
        },
    },
});

export default logger;

