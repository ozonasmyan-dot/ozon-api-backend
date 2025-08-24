import { AnalyticsService } from '@/modules/analytics/service/service';

describe('analyticsController.getMargin', () => {
    beforeAll(() => {
        process.env.OZON_PERFORMANCE_CLIENT_ID = '1';
        process.env.OZON_PERFORMANCE_CLIENT_SECRET = '1';
        process.env.OZON_SELLER_CLIENT_ID = '1';
        process.env.OZON_SELLER_API_KEY = '1';
        process.env.CORS_ORIGIN = '*';
        process.env.PORT = '3000';
    });

    it('parses query and returns service data', async () => {
        const { analyticsController } = await import('@/modules/analytics/controller/controller');
        const container = (await import('@/infrastructure/di/container')).default;
        const service = container.resolve(AnalyticsService);
        const mock = jest.spyOn(service, 'getMargin').mockResolvedValue([
            { month: '2024-01', items: [], totals: { totalServices: 0, totalCostPrice: 0, adSpend: 0, margin: 0 } },
        ]);

        const req: any = { query: { from: '2024-01-01', to: '2024-01-31', sku: '1' } };
        const res: any = { json: jest.fn() };

        await analyticsController.getMargin(req, res);

        expect(mock).toHaveBeenCalledWith({ from: '2024-01-01', to: '2024-01-31', sku: ['1'] });
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { month: '2024-01', items: [], totals: { totalServices: 0, totalCostPrice: 0, adSpend: 0, margin: 0 } },
            ],
        });
    });
});
