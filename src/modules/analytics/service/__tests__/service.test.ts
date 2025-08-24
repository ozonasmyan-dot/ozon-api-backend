import { AnalyticsService } from '@/modules/analytics/service/service';
import { UnitRepository } from '@/modules/unit/repository/repository';
import { AdvertisingRepository } from '@/modules/advertising/repository/repository';

describe('AnalyticsService.getMargin', () => {
    beforeAll(() => {
        // @ts-ignore
        global.logger = { info: jest.fn() };
    });

    it('aggregates margins by month and sku and subtracts ad spend', async () => {
        const unitRepo = {
            getEconomyBySku: jest.fn().mockResolvedValue([
                { createdAt: new Date('2024-01-15'), sku: '1', statusOzon: 'delivered', margin: 100, costPrice: 50, totalServices: 10 },
                { createdAt: new Date('2024-01-20'), sku: '1', statusOzon: 'cancelled', margin: 0, costPrice: 0, totalServices: 0 },
                { createdAt: new Date('2024-02-05'), sku: '1', statusOzon: 'delivered', margin: 200, costPrice: 100, totalServices: 20 },
                { createdAt: new Date('2024-02-10'), sku: '2', statusOzon: 'delivered', margin: 300, costPrice: 150, totalServices: 30 },
            ]),
        } as unknown as UnitRepository;

        const adsRepo = {
            getAdsAggByProductType: jest.fn((start: string) => {
                if (start.startsWith('2024-01')) {
                    return Promise.resolve({ items: [{ productId: '1', type: 't', moneySpent: 30 }], totals: 30 });
                }
                return Promise.resolve({ items: [
                    { productId: '1', type: 't', moneySpent: 50 },
                    { productId: '2', type: 't', moneySpent: 70 },
                ], totals: 120 });
            }),
        } as unknown as AdvertisingRepository;

        const service = new AnalyticsService(unitRepo, adsRepo);

        const data = await service.getMargin({ from: '2024-01-01', to: '2024-02-29', sku: [] });

        expect(data).toEqual([
            {
                month: '2024-01',
                items: [
                    {
                        sku: '1',
                        statuses: { delivered: 1, cancelled: 1 },
                        totalServices: 10,
                        totalCostPrice: 50,
                        margin: 70,
                    },
                ],
            },
            {
                month: '2024-02',
                items: [
                    {
                        sku: '1',
                        statuses: { delivered: 1 },
                        totalServices: 20,
                        totalCostPrice: 100,
                        margin: 150,
                    },
                    {
                        sku: '2',
                        statuses: { delivered: 1 },
                        totalServices: 30,
                        totalCostPrice: 150,
                        margin: 230,
                    },
                ],
            },
        ]);
    });
});
