import {sellerClient} from '@/infrastructure/clients/ozon/seller';
import {performanceClient} from '@/infrastructure/clients/ozon/performance';
import {AdvertisingRepository} from '@/modules/advertising/repository/repository';
import {AdvertisingService} from '@/modules/advertising/service/service';
import {AdvertisingHourlyRepository} from '@/modules/advertising-hourly/repository/repository';
import {AdvertisingHourlyService} from '@/modules/advertising-hourly/service/service';
import {AnalyticsService} from '@/modules/analytics/service/service';
import {UnitRepository} from '@/modules/unit/repository/repository';
import {PostingsService} from '@/modules/posting/service/service';
import {TransactionService} from '@/modules/transaction/service/service';
import {UnitService} from '@/modules/unit/service/service';

type Token<T> = string | symbol | { new(...args: any[]): T };

// Simple dependency injection container
class Container {
    private providers = new Map<Token<unknown>, () => unknown>();
    private singletons = new Map<Token<unknown>, unknown>();

    register<T>(token: Token<T>, provider: () => T): void {
        this.providers.set(token, provider);
    }

    resolve<T>(token: Token<T>): T {
        if (!this.singletons.has(token)) {
            const provider = this.providers.get(token) as (() => T) | undefined;
            if (!provider) {
                throw new Error(`No provider for token ${String(token)}`);
            }
            this.singletons.set(token, provider());
        }
        return this.singletons.get(token) as T;
    }
}

export const container = new Container();

// Clients
container.register('sellerClient', () => sellerClient);
container.register('performanceClient', () => performanceClient);

// Repositories
container.register(AdvertisingRepository, () => new AdvertisingRepository());
container.register(UnitRepository, () => new UnitRepository());
container.register(AdvertisingHourlyRepository, () => new AdvertisingHourlyRepository());

// Services
container.register(AdvertisingService, () => new AdvertisingService(
    container.resolve(AdvertisingRepository),
));
container.register(AdvertisingHourlyService, () => new AdvertisingHourlyService(
    container.resolve(AdvertisingService),
    container.resolve(AdvertisingHourlyRepository),
));

container.register(PostingsService, () => new PostingsService());
container.register(TransactionService, () => new TransactionService());

container.register(UnitService, () => new UnitService(
    container.resolve(UnitRepository),
    container.resolve(PostingsService),
    container.resolve(TransactionService),
));

container.register(AnalyticsService, () => new AnalyticsService(
    container.resolve(UnitRepository),
    container.resolve(AdvertisingRepository),
));

export default container;
