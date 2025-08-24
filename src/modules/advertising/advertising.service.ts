import {logger} from '@/utils/logger';
import {
    fetchDailyCampaignStatistics,
    fetchCampaignObjects,
    fetchCampaignList,
    fetchCampaignStatistics
} from "@/api/modules/advertising";
import {toNumber} from "@/utils/toNumber";
import {AdvertisingRepository} from "@/modules/advertising/advertising.repository";
import {generateDatesFrom} from "@/utils/date.utils";
import {fetchApiReportData} from "@/api/utils/report";
import {get62DayRanges} from '@/utils/date.utils';


const parseDDMMYYYYToISO = (ddmmyyyy: string): string => {
    const [dd, mm, yyyy] = ddmmyyyy.split('.');
    return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
};

const safeNumber = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    return Number(String(val).replace(/\s+/g, '').replace(',', '.'));
};

export class AdvertisingService {
    constructor(private adsRepo = new AdvertisingRepository()) {
    }

    async buildCompany(campaign: any) {
        try {
            const safeNumber = (value: any): number => Number(value) || 0;
            const safeToNumber = (value: any): number =>
                toNumber(typeof value === 'string' ? value : String(value)) || 0;
            const safeDivide = (a: number, b: number): number =>
                b > 0 ? Number((a / b).toFixed(2)) : 0;

            return {
                id: campaign.id,
                title: campaign.title ?? '',
                status: campaign.status ?? '',
                sku: campaign.sku,

                ctr: safeDivide(safeNumber(campaign.clicks), safeNumber(campaign.views)) * 100,
                toCartPrice: safeDivide(safeToNumber(campaign.moneySpent), safeNumber(campaign.toCart)),

                type: campaign.type,
                clicks: safeNumber(campaign.clicks),
                moneySpent: Number(safeToNumber(campaign.moneySpent).toFixed(2)),
                views: safeNumber(campaign.views),
                avgBid: Number(safeNumber(campaign.avgBid).toFixed(2)),
                weeklyBudget: safeToNumber(campaign.weeklyBudget),
                toCart: safeNumber(campaign.toCart),

                orders: Number(campaign.orders),
                ordersMoney: Number(safeToNumber(campaign.ordersMoney).toFixed(2)),

                crToCart: safeDivide(safeNumber(campaign.toCart), safeNumber(campaign.clicks)) * 100,
                costPerCart: safeDivide(safeToNumber(campaign.moneySpent), safeNumber(campaign.toCart)),
            };
        } catch (error) {
            console.error('❌ Ошибка в buildCompany:', error);
            return null;
        }
    };

    async fetchPpcCampaigns(date: string) {
        logger.info(`🚀 Загружаем кампании на дату: ${date}`);

        const campaigns: any = [];

        const dailyStats = await fetchDailyCampaignStatistics({
            dateFrom: date,
            dateTo: date,
        });

        const onlyPpcCampaigns = dailyStats.filter(
            (item) => item.title !== "Продвижение в поиске — все товары"
        );

        for (const campaign of onlyPpcCampaigns) {
            try {
                const objects = await fetchCampaignObjects({campaignId: campaign.id});
                const [{placement}] = await fetchCampaignList({
                    campaignIds: campaign.id,
                    dateFrom: date,
                    dateTo: date
                });
                const [stats] = await fetchCampaignStatistics({
                    campaignIds: campaign.id,
                    dateFrom: date,
                    dateTo: date,
                });

                if (objects[0]) {
                    campaigns.push({
                        ...stats,
                        orders: 0,
                        ordersMoney: '0,00',
                        type: placement[0] ?? '',
                        sku: objects[0]?.id ?? '',
                    });
                }

                logger.info(`✅ Кампания ${campaign.id} успешно загружена`);
            } catch (error) {
                logger.error({err: error, campaignId: campaign.id}, '⚠️ Ошибка при загрузке кампании');
            }
        }

        return campaigns;
    }

    async fetchCpoCampaigns({from, to}: { from: string, to: string }) {
        try {
            const products = await fetchApiReportData({
                url: '/api/client/statistics/json',
                params: {
                    from: `${from}T00:00:00Z`,
                    to: `${to}T23:59:59Z`,
                    campaigns: ["12950100"]
                },
            });


            const rows = products?.['12950100']?.report?.rows ?? [];
            return rows as any[];
        } catch (error: any) {
            const status = error?.response?.status;
            const url = error?.config?.url;
            const message = error?.response?.data?.message || error?.message || 'Неизвестная ошибка';

            console.error(`❌ Ошибка запроса [${status}] ${url}: ${message}`);
        }
    };

    async sync() {
        const lastAd = await this.adsRepo.lastRow();
        const dateOnly = lastAd?.savedAt ? lastAd?.savedAt.toISOString().split("T")[0] : '2024-10-01';

        const dates = generateDatesFrom(dateOnly);
        const datesCPO = get62DayRanges(dateOnly);

        logger.info(`🗓 Начинаем синхронизацию за ${dates.length} дней:`);

        for (const date of dates) {
            logger.info(`📌 Обработка даты: ${date}`);

            const campaigns = await this.fetchPpcCampaigns(date);
            // const campaignsCPO = await this.fetchCpoCampaigns(date);

            for (const campaign of campaigns) {
                const campaignBuild = await this.buildCompany(campaign);

                await this.adsRepo.create(campaignBuild, date);
            }
        }

        for (const date of datesCPO) {
            const data = await this.fetchCpoCampaigns(date);
            if (!Array.isArray(data) || data.length === 0) continue;

            for (const cpoItem of data) {
                // обязательно прокидываем campaignId, иначе upsert по уникальному (savedAt, campaignId) не сработает
                const campaign = await this.buildCompany({
                    id: `12950100-${cpoItem.orderId}`,

                    // Остальные поля
                    title: cpoItem.title ?? '',
                    status: 'active',

                    // sku / productId
                    sku: String(cpoItem.sku ?? ''),
                    productId: String(cpoItem.sku ?? ''),

                    type: 'CPO',
                    views: 0,
                    clicks: 0,
                    toCart: 0,
                    ctr: 0,
                    crToCart: 0,
                    toCartPrice: 0,
                    costPerCart: 0,

                    // Числовые поля: приводим с запятых к числу
                    moneySpent: Number(safeNumber(cpoItem.moneySpent).toFixed(2)),
                    avgBid: Number(safeNumber(cpoItem.bidValue).toFixed(2)),
                    weeklyBudget: 0,

                    orders: 0,
                    ordersMoney: 0,
                });

                // Дата из отчёта часто в формате "DD.MM.YYYY" — нельзя парсить через new Date(...)
                const savedAtISO = parseDDMMYYYYToISO(String(cpoItem.date));
                await this.adsRepo.create(campaign, savedAtISO);
            }
        }

        logger.info('✅ Синхронизация завершена!');

        return 'ОК';
    }
}

export const advertisingService = new AdvertisingService();