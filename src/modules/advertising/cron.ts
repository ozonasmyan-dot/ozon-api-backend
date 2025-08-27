import container from '@/infrastructure/di/container';
import {AdvertisingService} from '@/modules/advertising/service/service';
import {UnitRepository} from '@/modules/unit/repository/repository';
import {logger} from '@/shared/logger';
import {Telegraf} from 'telegraf';
import {BOT_TOKEN, CRON_CHAT_ID} from '@/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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

const service = container.resolve(AdvertisingService);
const unitRepo = container.resolve(UnitRepository);
const telegram = new Telegraf(BOT_TOKEN).telegram;

const notify = async (text: string): Promise<void> => {
    try {
        await telegram.sendMessage(CRON_CHAT_ID, text);
    } catch (err) {
        logger.error({err}, 'Failed to send Telegram notification');
    }
};

const sendCsv = async (): Promise<void> => {
    try {
        const date = dayjs().format('YYYY-MM-DD');
        const rows = await service.getByDate(date);
        if (!rows.length) return;

        const start = dayjs.tz(date, 'Asia/Yerevan').startOf('day');
        const end = dayjs.tz(date, 'Asia/Yerevan').endOf('day');
        const {items: unitOrders} = await unitRepo.getUnitsRevenueBySku(
            start.format('YYYY-MM-DD[T]HH:mm:ss[Z]'),
            end.format('YYYY-MM-DD[T]HH:mm:ss[Z]'),
        );
        const unitMap = new Map(unitOrders.map(o => [o.sku, o]));

        const grouped: Record<string, typeof rows> = {};
        for (const row of rows) {
            grouped[row.productId] = grouped[row.productId] || [];
            grouped[row.productId].push(row);
        }

        const headers = [
            'productId','moneySpent','views','clicks','toCart','savedAt','unitCount','unitMoney','drr'
        ];
        for (const [sku, items] of Object.entries(grouped)) {
            const agg = items.reduce((acc, curr) => {
                acc.moneySpent += Number(curr.moneySpent) || 0;
                acc.views += Number(curr.views) || 0;
                acc.clicks += Number(curr.clicks) || 0;
                acc.toCart += Number(curr.toCart) || 0;
                const upd = dayjs(curr.savedAt);
                if (!acc.savedAt || upd.isAfter(acc.savedAt)) acc.savedAt = upd;
                return acc;
            }, {
                moneySpent: 0,
                views: 0,
                clicks: 0,
                toCart: 0,
                savedAt: null as dayjs.Dayjs | null,
            });

            const unit = unitMap.get(sku);
            const drr = unit?.money ? Math.floor((agg.moneySpent / unit.money) * 100) : 0;
            const csvRows = [
                headers.join(','),
                [
                    sku,
                    agg.moneySpent,
                    agg.views,
                    agg.clicks,
                    agg.toCart,
                    agg.savedAt ? agg.savedAt.format('YYYY-MM-DD HH mm ss') : '',
                    unit?.count ?? 0,
                    unit?.money ?? 0,
                    drr,
                ].join(','),
            ];

            const csv = csvRows.join('\n');
            const productName = (productsSku[sku] || sku).replace(/\s+/g, '_');
            await telegram.sendDocument(CRON_CHAT_ID, {
                source: Buffer.from(csv),
                filename: `${productName}-${date}.csv`,
            });
        }
    } catch (err) {
        logger.error({err}, 'Failed to send CSV report');
    }
}

const FIVE_MINUTES = 5 * 60 * 1000;

const run = async () => {
    try {
        await service.sync();
        await sendCsv();
    } catch (error) {
        logger.error({err: error}, '❌ Failed to save hourly advertising snapshot');
    }
};

run();
setInterval(run, FIVE_MINUTES);
