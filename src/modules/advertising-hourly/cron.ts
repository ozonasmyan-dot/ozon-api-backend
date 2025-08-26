import container from '@/infrastructure/di/container';
import {AdvertisingHourlyService} from '@/modules/advertising-hourly/service/service';
import {logger} from '@/shared/logger';
import {Telegraf} from 'telegraf';
import {BOT_TOKEN, CRON_CHAT_ID} from '@/config';

const service = container.resolve(AdvertisingHourlyService);
const telegram = new Telegraf(BOT_TOKEN).telegram;

const notify = async (text: string): Promise<void> => {
    try {
        await telegram.sendMessage(CRON_CHAT_ID, text);
    } catch (err) {
        logger.error({err}, 'Failed to send Telegram notification');
    }
};

const FIVE_MINUTES = 2 * 60 * 1000;

const run = async () => {
    try {
        await service.sync();
        logger.info('✅ Hourly advertising snapshot saved');
        await notify('✅ Hourly advertising snapshot saved');
    } catch (error) {
        logger.error({err: error}, '❌ Failed to save hourly advertising snapshot');
        await notify('❌ Failed to save hourly advertising snapshot');
    }
};

run();
setInterval(run, FIVE_MINUTES);
