import container from '@/infrastructure/di/container';
import {AdvertisingHourlyService} from '@/modules/advertising-hourly/service/service';
import {logger} from '@/shared/logger';

const service = container.resolve(AdvertisingHourlyService);

const FIVE_MINUTES = 2 * 60 * 1000;

const run = async () => {
    try {
        await service.sync();
        logger.info('✅ Hourly advertising snapshot saved');
    } catch (error) {
        logger.error({err: error}, '❌ Failed to save hourly advertising snapshot');
    }
};

run();
setInterval(run, FIVE_MINUTES);
