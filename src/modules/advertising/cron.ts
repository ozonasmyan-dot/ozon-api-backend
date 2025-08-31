import container from '@/infrastructure/di/container';
import {logger} from '@/shared/logger';
import {stringify} from "csv-stringify/sync";
import {Telegraf} from 'telegraf';
import {BOT_TOKEN, CRON_CHAT_ID} from '@/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {AdvertisingService} from "@/modules/advertising/service/service";
import prisma from "@/infrastructure/database/prismaClient";
import prismaClient from "@/infrastructure/database/prismaClient";
import {UnitService} from "@/modules/unit/service/service";
import Decimal from "decimal.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const productsSku: Record<string, string> = {
    '2586085325': 'шапка_флисовая_бежевая',
    '2586059276': 'шапка_флисовая_хаки',
    '1763835247': 'шапка_флисовая_черная',
    '1828048543': 'сумка_кросбоди_черная',
    '1828048513': 'сумка_кросбоди_светло_серая',
    '1828048540': 'сумка_кросбоди_Бордовая',
};

const adTypes = {
    'PLACEMENT_TOP_PROMOTION': 'Вывод в топ',
    'CPO': 'Оплата за клик',
    'PLACEMENT_SEARCH_AND_CATEGORY': 'Трафареты',
}

const unitService = container.resolve(UnitService);
const service = container.resolve(AdvertisingService);
const telegram = new Telegraf(BOT_TOKEN).telegram;

const sendCsv = async (): Promise<void> => {
    try {
        const todayStartUnits = dayjs().subtract(1, 'day').format('YYYY-MM-DD[T]21:00:00[Z]');
        const todayEndUnits = dayjs().format('YYYY-MM-DD[T]20:59:59[Z]');

        const todayStart = dayjs().startOf('day').format('YYYY-MM-DD[T]00:00:00[Z]');
        const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD[T]23:59:59[Z]');

        const resultMap: Record<string, any> = {};

        const ads = await prisma.advertisingStat.findMany({
            where: {
                savedAt: {
                    gte: todayStart,
                    lte: todayEnd
                },
            },
            select: {
                productId: true,
                type: true,
                moneySpent: true,
                views: true,
                clicks: true,
                toCart: true,
                ctr: true,
                avgBid: true,
                crToCart: true,
                costPerCart: true,
            },
        });

        const units = await prisma.unitNew.groupBy({
            by: ["sku"],
            where: {
                createdAt: {
                    gte: todayStartUnits,
                    lte: todayEndUnits
                },
            },
            _count: {id: true},
            _sum: {price: true},
        });


        for (const ad of ads) {
            if (!resultMap[ad.productId]) {
                resultMap[ad.productId] = {
                    productId: ad.productId,
                    ads: [],
                    totals: {
                        moneyCount: 0, count: 0
                    },
                };
            }
            resultMap[ad.productId].ads.push(ad);
        }

        for (const u of units) {
            if (!resultMap[u.sku]) {
                resultMap[u.sku] = {
                    productId: u.sku,
                    ads: [],
                    totals: {moneyCount: 0, count: 0},
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

            const soldAmount = product.totals.moneyCount;
            const soldCount = product.totals.count;
            const moneySpent = await prismaClient.advertising.aggregate({
                where: {
                    productId: product.productId,
                    savedAt: {
                        gte: todayStart,
                        lte: todayEnd
                    },
                },
                _sum: {
                    moneySpent: true,
                }
            });
            const drr = soldCount !== 0 && moneySpent._sum.moneySpent != null ? Decimal(((moneySpent._sum.moneySpent ?? 0) / soldAmount) * 100).toDecimalPlaces(0) : '';

            // строки по рекламе
            for (const ad of product.ads) {
                rows.push({
                    //@ts-ignore
                    "Тип кампании": adTypes[ad.type],
                    "Расход": ad.moneySpent,
                    "Просмотры": ad.views,
                    "Клики": ad.clicks,
                    "В корзину": ad.toCart,
                    "CTR": ad.ctr,
                    "Цена за клик": ad.avgBid,
                    "Конверсия в корзину": ad.crToCart,
                    "Цена корзины": ad.costPerCart,
                });
            }

            // сортировка по moneySpent (DESC)
            rows = rows.sort((a, b) => (b.Расход ?? 0) - (a.Расход ?? 0));

            // превращаем в CSV
            const csv = stringify(rows, {
                header: true,
                columns: [
                    "Тип кампании",
                    "Расход",
                    "Просмотры",
                    "Клики",
                    "В корзину",
                    "CTR",
                    "Цена за клик",
                    "Конверсия в корзину",
                    "Цена корзины",
                ],
            });

            await telegram.sendDocument(CRON_CHAT_ID, {
                source: Buffer.from(csv),
                filename: `${productsSku[product.productId]}.csv`,
            }, {
                caption: `*DRR:* ${drr ? drr : 0}%
*Количество продаж:* ${soldCount} шт.
*Сумма продаж:* ${soldAmount} руб.
*Расход:* ${moneySpent._sum.moneySpent !== null ? Decimal(moneySpent._sum.moneySpent).toDecimalPlaces(2) : 0} руб.`,
                parse_mode: 'Markdown',
            });
        }
    } catch (err) {
        logger.error({err}, 'Failed to send CSV report');
    }
}

const FIVE_MINUTES = 2 * 60 * 60 * 1000;

const run = async () => {
    try {
        const dateStr = dayjs().format("YYYY-MM-DD - HH:mm:ss");

        await unitService.sync();
        await service.sync();

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
