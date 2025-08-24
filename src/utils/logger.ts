import pino from 'pino';

export const logger = pino({
    transport: {
        targets: [
            {
                target: 'pino-pretty', // для читаемого вывода в консоли
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss dd-mm-yyyy',
                    ignore: 'pid,hostname',
                },
                level: 'info',
            },
        ],
    },
});
