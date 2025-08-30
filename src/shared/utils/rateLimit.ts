let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

export const waitRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const diff = now - lastRequestTime;
    if (diff < MIN_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - diff));
    }
    lastRequestTime = Date.now();
};
