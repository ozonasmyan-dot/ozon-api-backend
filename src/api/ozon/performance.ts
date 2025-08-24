import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';

// Здесь будем хранить токен и время его жизни
let performanceToken: string | null = null;
let performanceTokenExpiry: number = 0;


/**
 * Функция для получения нового Bearer-токена для Performance API
 */
const refreshPerformanceToken = async (): Promise<string> => {
    const now = Date.now();

    if (performanceToken && now < performanceTokenExpiry) {
        return performanceToken;
    }

    const response = await axios.post(
        'https://api-performance.ozon.ru:443/api/client/token',
        {
            client_id: "74593537-1751562778173@advertising.performance.ozon.ru",
            client_secret: "67pQaCy8SW5_nbmMElgAcfeCCI5VpqgtlnvjoGXPc7sZykC5R08oSLbLcLBSVpkgAZY1UqkZio81rFjkdw",
            grant_type: "client_credentials"
        },
        {
            headers: {
                'Content-Type': 'application/json'
            }
        },
    );

    const data = response.data;

    performanceToken = data.access_token;
    performanceTokenExpiry = now + data.expires_in * 1000 - 60_000;

    return performanceToken!;
}

/**
 * Создаём Axios-клиент для Performance API
 */
const performanceClient: AxiosInstance = axios.create({
    baseURL: 'https://api-performance.ozon.ru:443/',
    headers: {
        'Content-Type': 'application/json',
    },
});

performanceClient.interceptors.request.use(
    async (
        config: InternalAxiosRequestConfig
    ): Promise<InternalAxiosRequestConfig> => {
        config.headers = config.headers ?? {};
        const token = await refreshPerformanceToken();
            config.headers['Authorization'] = `Bearer ${token}`;
        return config as InternalAxiosRequestConfig;
    }
);

export {
    performanceClient
}
