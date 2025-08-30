import {logger} from '@/shared/logger';
import {
    fetchDailyCampaignStatistics,
    fetchCampaignObjects,
    fetchCampaignList,
    fetchCampaignStatistics
} from "@/modules/advertising/repository/advertising";
import {AdvertisingRepository} from "@/modules/advertising/repository/repository";
import {generateDatesFrom, parseYerevanWithCurrentTime} from "@/shared/utils/date.utils";
import {fetchApiReportData} from "@/infrastructure/clients/utils/report";
import {get62DayRanges} from '@/shared/utils/date.utils';
import dayjs, {Dayjs} from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Decimal from "decimal.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const D = (v: any) => {
    if (v == null || v === "") return new Decimal(0);
    if (typeof v === "string") {
        v = v.replace(",", "."); // заменяем , на .
    }
    return new Decimal(v);
}

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

export class AdvertisingService {
    constructor(private adsRepo: AdvertisingRepository) {
    }

    async getAll() {
        return this.adsRepo.getAll();
    }

    async buildCompany(campaign: CampaignStats): Promise<CampaignReport | null> {
        try {
            const clicks = D(campaign.clicks);
            const views = D(campaign.views);
            const moneySpent = D(campaign.moneySpent);
            const toCart = D(campaign.toCart);

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
                avgBid: D(campaign.avgBid).toNumber(),
                weeklyBudget: D(campaign.weeklyBudget).toNumber(),
                toCart: toCart.toNumber(),

                orders: D(campaign.orders).toNumber(),
                ordersMoney: D(campaign.ordersMoney).toDecimalPlaces(2).toNumber(),

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

    async fetchPpcCampaigns(date: Dayjs): Promise<CampaignStats[]> {
        logger.info(`🚀 Загружаем кампании на дату: ${date}`);

        const campaigns: CampaignStats[] = [];

        const dailyStats = await fetchDailyCampaignStatistics({
            dateFrom: date.format('YYYY-MM-DD'),
            dateTo: date.format('YYYY-MM-DD'),
        });

        const onlyPpcCampaigns = (dailyStats as CampaignStats[]).filter(
            (item) => item.title !== "Продвижение в поиске — все товары"
        );

        for (const campaign of onlyPpcCampaigns) {
            try {
                const objects = await fetchCampaignObjects({campaignId: campaign.id});
                const [{placement}] = await fetchCampaignList({
                    campaignIds: campaign.id,
                    dateFrom: date.format('YYYY-MM-DD'),
                    dateTo: date.format('YYYY-MM-DD')
                });
                const [stats] = await fetchCampaignStatistics({
                    campaignIds: campaign.id,
                    dateFrom: date.format('YYYY-MM-DD'),
                    dateTo: date.format('YYYY-MM-DD'),
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

    async fetchCpoCampaigns({from, to}: { from: Dayjs, to: Dayjs }) {
        try {
            const products = await fetchApiReportData({
                url: '/api/client/statistics/json',
                params: {
                    from: from.format('YYYY-MM-DD[T]00:00:00[Z]'),
                    to: to.format('YYYY-MM-DD[T]23:59:59[Z]'),
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
        const dateOnly = lastAd?.savedAt ? dayjs(lastAd?.savedAt) : dayjs('2025-08-26', 'YYYY-MM-DD');

        const dates = generateDatesFrom(dateOnly);
        const datesCPO = get62DayRanges(dateOnly);

        logger.info(`🗓 Начинаем синхронизацию за ${dates.length} дней:`);

        for (const date of dates) {
            logger.info(`📌 Обработка даты: ${date}`);

            const campaigns = await this.fetchPpcCampaigns(date);

            for (const campaign of campaigns) {
                const campaignBuild = await this.buildCompany(campaign);

                const dateSave = parseYerevanWithCurrentTime(date);

                await this.adsRepo.createStat(campaignBuild, dateSave.toDate());

                await this.adsRepo.create({
                    campaignId: campaign?.id,
                    productId: campaign?.sku,
                    type: campaign?.type,
                    moneySpent: campaign?.moneySpent
                }, date.toDate());
            }
        }

        for (const date of datesCPO) {
            const data = await this.fetchCpoCampaigns(date);

            if (!Array.isArray(data) || data.length === 0) continue;

            for (const cpoItem of data) {
                const campaign = await this.buildCompany({
                    id: '12950100',

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
                    moneySpent: D(cpoItem.moneySpent).toDecimalPlaces(2).toNumber(),
                    avgBid: D(cpoItem.bidValue).toDecimalPlaces(2).toNumber(),
                    weeklyBudget: 0,

                    orders: 0,
                    ordersMoney: 0,
                });

                const dateSave = parseYerevanWithCurrentTime(dayjs(cpoItem.date, 'DD.MM.YYYY'));

                await this.adsRepo.createStat(campaign, dateSave.toDate());

                await this.adsRepo.create({
                    campaignId: campaign?.id,
                    productId: campaign?.sku,
                    type: campaign?.type,
                    moneySpent: campaign?.moneySpent,
                }, dayjs.utc(cpoItem.date, 'DD.MM.YYYY').toDate());
            }
        }

        logger.info('✅ Синхронизация завершена!');

        return 'ОК';
    }
}