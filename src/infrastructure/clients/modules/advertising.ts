import {performanceClient} from "@/infrastructure/clients/ozon/performance";
import {toNumber} from "@/shared/utils/toNumber";

/**
 * Получает статистику всех кампаний
 */
export const fetchCampaignStatistics = async (params: any): Promise<any> => {
    const query = await performanceClient.get('/api/client/statistics/campaign/product/json', {
        params,
    });

    return query.data.rows;
}

/**
 * Получает список всех компаний
 */
export const fetchCampaignList = async (params: any = {}): Promise<any[]> => {
    const query = await performanceClient.get('/api/client/campaign', {
        params
    });

    return query.data.list;
}

/**
 * Получает товары которые в компании
 */
export const fetchCampaignObjects = async (params: any): Promise<[{ id: string }]> => {
    const query = await performanceClient.get(`/api/client/campaign/${params.campaignId}/objects`);

    return query.data.list;
}

/**
 * Получает дневные компании
 */
export const fetchDailyCampaignStatistics = async (params: any = {}): Promise<any[]> => {
    const query = await performanceClient.get('/api/client/statistics/daily/json', {
        params,
    });

    const data = query.data.rows as any[];

    if (data.length === 0) {
        return data.map(({id, title, date, views, clicks, moneySpent, avgBid}) => ({
            id,
            title,
            date,
            views: Number(views),
            clicks: Number(clicks),
            moneySpent: toNumber(moneySpent),
            avgBid: toNumber(avgBid),
        }));
    }


    return query.data.rows;
}