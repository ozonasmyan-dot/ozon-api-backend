import container from '@/infrastructure/di/container';
import {UnitRepository} from '@/modules/unit/repository/repository';
import {logger} from '@/shared/logger';
import { stringify } from "csv-stringify/sync";
import {Telegraf} from 'telegraf';
import {BOT_TOKEN, CRON_CHAT_ID} from '@/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {AdvertisingRepository} from "@/modules/advertising/repository/repository";
import {AdvertisingService} from "@/modules/advertising/service/service";

dayjs.extend(utc);
dayjs.extend(timezone);

const productsSku: Record<string, string> = {
    '2586085325': 'Шапка беж',
    '2586059276': 'Шапка хаки',
    '1763835247': 'Шапка черная',
    '1828048543': 'Сумка черная',
    '1828048513': 'Сумка серая',
    '1828048540': 'Сумка бордовая',
};

const adsRepo = container.resolve(AdvertisingRepository);
const service = container.resolve(AdvertisingService);
const unitRepo = container.resolve(UnitRepository);
const telegram = new Telegraf(BOT_TOKEN).telegram;


const sendCsv = async (): Promise<void> => {
    try {
        const resultMap: Record<string, any> = {};
        const cpoAgg = await adsRepo.getCPOAgg();
        const otherAds = await adsRepo.otherAds();
        const units = await unitRepo.getTodayUnitBySku();
        const headers = [
            'productId', 'moneySpent', 'views', 'clicks', 'toCart', 'savedAt', 'unitCount', 'unitMoney', 'drr'
        ];

        for (const c of cpoAgg) {
            resultMap[c.productId] = {
                productId: c.productId,
                ads: [
                    {
                        type: "CPO",
                        moneySpent: c._sum.moneySpent ?? 0,
                        views: c._sum.views ?? 0,
                        clicks: c._sum.clicks ?? 0,
                        toCart: c._sum.toCart ?? 0,
                        ctr: c._sum.ctr ?? 0,
                        avgBid: c._sum.avgBid ?? 0,
                        crToCart: c._sum.crToCart ?? 0,
                        costPerCart: c._sum.costPerCart ?? 0,
                    },
                ],
                totals: {moneyCount: 0, count: 0},
            };
        }

        for (const ad of otherAds) {
            if (!resultMap[ad.productId]) {
                resultMap[ad.productId] = {
                    productId: ad.productId,
                    ads: [],
                    totals: {moneyCount: 0, count: 0},
                };
            }
            resultMap[ad.productId].ads.push(ad);
        }

        for (const u of units) {
            if (!resultMap[u.sku]) {
                resultMap[u.sku] = {
                    productId: u.sku,
                    ads: [],
                    totals: { moneyCount: 0, count: 0 },
                };
            }
            resultMap[u.sku].totals = {
                moneyCount: u._sum.price ?? 0,
                count: u._count.id,
            };
        }

        const finalArray = Object.values(resultMap);

        for (const product of finalArray) {
            let rows: any[] = [];

            // строки по рекламе
            for (const ad of product.ads) {
                rows.push({
                    productId: productsSku[product.productId],
                    type: ad.type,
                    moneySpent: ad.moneySpent,
                    views: ad.views,
                    clicks: ad.clicks,
                    toCart: ad.toCart,
                    ctr: ad.ctr,
                    avgBid: ad.avgBid,
                    crToCart: ad.crToCart,
                    costPerCart: ad.costPerCart,
                    soldCount: product.totals.count,
                    soldAmount: product.totals.moneyCount,
                });
            }

            // сортировка по moneySpent (DESC)
            rows = rows.sort((a, b) => (b.moneySpent ?? 0) - (a.moneySpent ?? 0));

            // считаем DRR
            const totalAdsSpent = rows.reduce((sum, r) => sum + (Number(r.moneySpent) || 0), 0);
            const soldAmount = product.totals.moneyCount;
            const soldCount = product.totals.count;
            const drr = soldAmount > 0 ? ((totalAdsSpent / soldAmount) * 100).toFixed(1) : "0";

            // нижняя строка TOTAL
            rows.push({
                productId: "TOTAL",
                type: "",
                moneySpent: "",
                views: "",
                clicks: "",
                toCart: "",
                ctr: "",
                avgBid: "",
                crToCart: "",
                costPerCart: "",
                soldCount,
                soldAmount,
                drr,
            });

            // превращаем в CSV
            const csv = stringify(rows, {
                header: true,
                columns: [
                    "productId",
                    "type",
                    "moneySpent",
                    "views",
                    "clicks",
                    "toCart",
                    "ctr",
                    "avgBid",
                    "crToCart",
                    "costPerCart",
                    "soldCount",
                    "soldAmount",
                    "drr",
                ],
            });

            // отправляем файл
            await telegram.sendDocument(CRON_CHAT_ID, {
                source: Buffer.from(csv),
                filename: `${productsSku[product.productId]}.csv`,
            });
        }
    } catch (err) {
        logger.error({err}, 'Failed to send CSV report');
    }
}

const FIVE_MINUTES = 5 * 60 * 1000;

const run = async () => {
    try {
        const dateStr = dayjs().format("YYYY-MM-DD - HH:mm:ss");

        // await service.sync();

        await telegram.sendMessage(
            CRON_CHAT_ID,
            `✅ Получен репорт ${dateStr}`
        );

        await sendCsv();
    } catch (error) {
        logger.error({err: error}, '❌ Failed to save hourly advertising snapshot');
    }
};

run();
setInterval(run, FIVE_MINUTES);
