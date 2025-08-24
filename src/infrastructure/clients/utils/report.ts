import {performanceClient} from '@/infrastructure/clients/ozon/performance';
import {logger} from "@/utils/logger";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Ожидаем, пока отчёт станет готов.
 */
const waitForReportReady = async (
    uuid: string,
    attempts = 30,
    interval = 3000,
) => {
    logger.info(`🔎 Ждём готовности отчёта ${uuid} (макс ${attempts} попыток)…`);

    for (let i = 0; i < attempts; i++) {
        await delay(interval);

        const {data} = await performanceClient.get(`/api/client/statistics/${uuid}`);
        const status = data.state as string;

        logger.info(`⏳ Попытка ${i + 1}/${attempts}: state = ${status}`);

        if (status === 'OK') {
            logger.info('✅ Отчёт готов!');
            return true;
        }
    }

    throw new Error('🛑 Отчёт не готов. Превышено количество попыток.');
};

/**
 * Получаем готовый отчёт.
 */
const fetchReport = async (uuid: string) => {
    logger.info(`📥 Загружаем отчёт ${uuid}…`);
    const {data} = await performanceClient.get(
        `/api/client/statistics/report`,
        {params: {UUID: uuid}},
    );
    logger.info(`📊 Получено строк: ${data}`);

    return data;
};

/**
 * Запрашиваем генерацию отчёта.
 */
const generateReport = async ({url, params}: {
    url: string;
    params: Record<string, any>;
}): Promise<string> => {
    logger.info(`🚀 Генерируем отчёт по ${url}`);
    try {
        const {data} = await performanceClient.post(url, params);
        logger.info(`🆔 UUID отчёта: ${data.UUID}`);
        return data.UUID as string;
    } catch (error: any) {
        const status = error?.response?.status;
        const reqUrl = error?.config?.url;
        const message = error?.response?.data?.error || error?.message || 'Неизвестная ошибка';

        console.error(`❌ Ошибка запроса [${status}] ${reqUrl}: ${message}`);
        throw error;
    }
};

/**
 * Главная функция: генерирует, ждёт и возвращает строки отчёта.
 */
export const fetchApiReportData = async ({url, params}: {
    url: string;
    params: Record<string, any>;
}) => {
    logger.info('================ Начало цикла получения отчёта ================');

    const uuid = await generateReport({url, params});
    await waitForReportReady(uuid);
    const rows = await fetchReport(uuid);

    logger.info('================ Отчёт успешно получен ================');
    return rows;
};
