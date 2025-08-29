import {sellerClient} from '@/infrastructure/clients/ozon/seller';
import {performanceClient} from '@/infrastructure/clients/ozon/performance';
import {AdvertisingRepository} from '@/modules/advertising/infrastructure/advertising.repository';
import {AdvertisingService} from '@/modules/advertising/application/advertising.service';
import {AnalyticsService} from '@/modules/analytics/application/analytics.service';
import {UnitRepository} from '@/modules/unit/infrastructure/unit.repository';
import {PostingsService} from '@/modules/posting/application/posting.service';
import {TransactionService} from '@/modules/transaction/application/transaction.service';
import {UnitService} from '@/modules/unit/application/unit.service';

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

// Services
container.register(AdvertisingService, () => new AdvertisingService(
    container.resolve(AdvertisingRepository),
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
