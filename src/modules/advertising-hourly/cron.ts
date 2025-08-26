import container from '@/infrastructure/di/container';
import {AdvertisingHourlyService} from '@/modules/advertising-hourly/service/service';
import {logger} from '@/shared/logger';
import {Telegraf} from 'telegraf';
import {BOT_TOKEN, CRON_CHAT_ID} from '@/config';
import dayjs from 'dayjs';

const service = container.resolve(AdvertisingHourlyService);
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

        const headers = [
            'campaignId','productId','type','moneySpent','views','clicks','toCart','ctr','weeklyBudget','status','avgBid','crToCart','costPerCart','orders','ordersMoney','savedAt','updatedAt'
        ];

        const csvRows = [headers.join(',')];
        for (const row of rows) {
            csvRows.push(headers.map((h) => String((row as any)[h] ?? '')).join(','));
        }

        const csv = csvRows.join('\n');
        await telegram.sendDocument(CRON_CHAT_ID, {
            source: Buffer.from(csv),
            filename: `ads-${date}.csv`,
        });
    } catch (err) {
        logger.error({err}, 'Failed to send CSV report');
    }
};

const FIVE_MINUTES = 2 * 60 * 1000;

const run = async () => {
    try {
        await service.sync();
        logger.info('✅ Hourly advertising snapshot saved');
        await notify('✅ Hourly advertising snapshot saved');
        await sendCsv();
    } catch (error) {
        logger.error({err: error}, '❌ Failed to save hourly advertising snapshot');
        await notify('❌ Failed to save hourly advertising snapshot');
    }
};

run();
setInterval(run, FIVE_MINUTES);
