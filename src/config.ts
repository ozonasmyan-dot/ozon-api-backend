import dotenv from 'dotenv';
import * as process from "node:process";

dotenv.config();

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
};

export const PERFORMANCE_CLIENT_ID = requireEnv('OZON_PERFORMANCE_CLIENT_ID');
export const PERFORMANCE_CLIENT_SECRET = requireEnv('OZON_PERFORMANCE_CLIENT_SECRET');
export const SELLER_CLIENT_ID = requireEnv('OZON_SELLER_CLIENT_ID');
export const SELLER_API_KEY = requireEnv('OZON_SELLER_API_KEY');
export const CORS_ORIGIN = requireEnv('CORS_ORIGIN');
export const PORT = parseInt(requireEnv('PORT'), 10);
export const BOT_TOKEN = requireEnv('BOT_TOKEN');

