import {logger} from '@/shared/logger';
import {
    fetchDailyCampaignStatistics,
    fetchCampaignObjects,
    fetchCampaignList,
    fetchCampaignStatistics
} from "@/modules/advertising/repository/advertising";
import {AdvertisingRepository} from "@/modules/advertising/repository/repository";
import {generateDatesFrom} from "@/shared/utils/date.utils";
import {fetchApiReportData} from "@/infrastructure/clients/utils/report";
import {get62DayRanges} from '@/shared/utils/date.utils';
import decimal from 'decimal.js';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

interface CampaignStats {
    id: string;
    title?: string;
    status?: string;
    sku?: string;
    type?: string;
    clicks?: number | string;
    views?: number | string;
    moneySpent?: number | string;
    avgBid?: number | string;
    weeklyBudget?: number | string;
    toCart?: number | string;
    orders?: number | string;
    ordersMoney?: number | string;

    [key: string]: unknown;
}

interface CampaignReport {
    id: string;
    title: string;
    status: string;
    sku: string;
    ctr: number;
    toCartPrice: number;
    type: string;
    clicks: number;
    moneySpent: number;
    views: number;
    avgBid: number;
    weeklyBudget: number;
    toCart: number;
    orders: number;
    ordersMoney: number;
    crToCart: number;
    costPerCart: number;
}

const toDecimal = (val: unknown) =>
    decimal(String(val ?? 0).replace(/\s+/g, '').replace(',', '.'));

export class AdvertisingService {
    constructor(private adsRepo: AdvertisingRepository) {
    }

    async getAll() {
        return this.adsRepo.getAll();
    }

    async getByDate(date: string) {
        const start = dayjs(date).format('YYYY-MM-DD[T]00:00:00[Z]');
        const end = dayjs(date).format('YYYY-MM-DD[T]23:59:59[Z]');
        return this.adsRepo.getByDate(start, end);
    }

    async buildCompany(campaign: CampaignStats): Promise<CampaignReport | null> {
        try {
            const clicks = toDecimal(campaign.clicks);
            const views = toDecimal(campaign.views);
            const moneySpent = toDecimal(campaign.moneySpent);
            const toCart = toDecimal(campaign.toCart);

            return {
                id: campaign.id,
                title: campaign.title ?? '',
                status: campaign.status ?? '',
                sku: campaign.sku ?? '',

                ctr: views.gt(0)
                    ? clicks.div(views).mul(100).toDecimalPlaces(2).toNumber()
                    : 0,
                toCartPrice: toCart.gt(0)
                    ? moneySpent.div(toCart).toDecimalPlaces(2).toNumber()
                    : 0,

                type: campaign.type ?? '',
                clicks: clicks.toNumber(),
                moneySpent: moneySpent.toDecimalPlaces(2).toNumber(),
                views: views.toNumber(),
                avgBid: toDecimal(campaign.avgBid).toDecimalPlaces(2).toNumber(),
                weeklyBudget: toDecimal(campaign.weeklyBudget).toNumber(),
                toCart: toCart.toNumber(),

                orders: toDecimal(campaign.orders).toNumber(),
                ordersMoney: toDecimal(campaign.ordersMoney).toDecimalPlaces(2).toNumber(),

                crToCart: clicks.gt(0)
                    ? toCart.div(clicks).mul(100).toDecimalPlaces(2).toNumber()
                    : 0,
                costPerCart: toCart.gt(0)
                    ? moneySpent.div(toCart).toDecimalPlaces(2).toNumber()
                    : 0,
            };
        } catch (error) {
            logger.error({err: error}, '❌ Ошибка в buildCompany');
            return null;
        }
    };

    async fetchPpcCampaigns(date: string): Promise<CampaignStats[]> {
        logger.info(`🚀 Загружаем кампании на дату: ${date}`);

        const campaigns: CampaignStats[] = [];

        const dailyStats = await fetchDailyCampaignStatistics({
            dateFrom: date,
            dateTo: date,
        });

        const onlyPpcCampaigns = (dailyStats as CampaignStats[]).filter(
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
                        ...(stats as CampaignStats),
                        orders: 0,
                        ordersMoney: '0,00',
                        type: placement[0] ?? '',
                        sku: objects[0]?.id ?? '',
                    } as CampaignStats);
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

            logger.error({err: error, status, url}, `❌ Ошибка запроса: ${message}`);
        }
    };

    async sync() {
        const lastAd = await this.adsRepo.lastRow();
        const dateOnly = lastAd?.savedAt ? lastAd?.savedAt.toISOString().split("T")[0] : '2025-08-20';

        const dates = generateDatesFrom(dateOnly);
        const datesCPO = get62DayRanges(dateOnly);

        logger.info(`🗓 Начинаем синхронизацию за ${dates.length} дней:`);

        for (const date of dates) {
            logger.info(`📌 Обработка даты: ${date}`);
            const yerevan = dayjs(date).tz("Asia/Yerevan");
            const fakeUtc = dayjs.utc(yerevan.format("YYYY-MM-DDTHH:mm:ss.SSS"));
            const now = dayjs();

            const dateSave = fakeUtc
                .hour(now.hour())
                .minute(now.minute())
                .second(now.second())
                .millisecond(now.millisecond());

            const campaigns = await this.fetchPpcCampaigns(date);

            for (const campaign of campaigns) {
                const campaignBuild = await this.buildCompany(campaign);

                await this.adsRepo.create(campaignBuild, dateSave.toDate());
            }
        }

        for (const date of datesCPO) {
            const data = await this.fetchCpoCampaigns(date);
            if (!Array.isArray(data) || data.length === 0) continue;

            for (const cpoItem of data) {
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
                    moneySpent: toDecimal(cpoItem.moneySpent).toDecimalPlaces(2).toNumber(),
                    avgBid: toDecimal(cpoItem.bidValue).toDecimalPlaces(2).toNumber(),
                    weeklyBudget: 0,

                    orders: 0,
                    ordersMoney: 0,
                });

                const yerevan = dayjs.tz(cpoItem.date, "DD.MM.YYYY", "Asia/Yerevan");
                const fakeUtc = dayjs.utc(yerevan.format("YYYY-MM-DDTHH:mm:ss.SSS"));
                const now = dayjs();

                const dateSave = fakeUtc
                    .hour(now.hour())
                    .minute(now.minute())
                    .second(now.second())
                    .millisecond(now.millisecond());

                await this.adsRepo.create(campaign, dateSave.toDate());
            }
        }

        logger.info('✅ Синхронизация завершена!');

        return 'ОК';
    }
}


const savedAtISO = dayjs(String('2025.08.27'), '"DD.MM.YYYY"').format('YYYY-MM-DD[T]00:00:00.000[Z]');

console.log(savedAtISO)