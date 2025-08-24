import { UnitService } from '@/modules/unit/unit.service';
import { PostingDto } from '@/modules/posting/dto/posting.dto';
import { TransactionDto } from '@/modules/transaction/dto/transaction.dto';

jest.mock('@/modules/unit/utils/economy.utils', () => ({
    economy: jest.fn().mockImplementation(unit => ({
        status: unit.status,
        totalServices: unit.services.reduce((acc: any, s: any) => acc + (s?.price || 0), 0),
        margin: 0,
        costPrice: 0,
    })),
}));

describe('UnitService - createUnitItem', () => {
    let unitService: UnitService;

    beforeEach(() => {
        unitService = new UnitService();
    });

    it('должен корректно создавать unit без транзакций', async () => {
        const mockPosting: PostingDto = {
            postingNumber: '123',
            orderNumber: 'order123',
            statusOzon: 'Ожидаем оплаты',
        } as PostingDto;

        const unit = await unitService.createUnitItem(mockPosting, []);

        expect(unit.postingNumber).toBe('123');
        expect(unit.status).toBe('Ожидаем оплаты');
        expect(unit.services.length).toBe(0);
        expect(unit.totalServices).toBe(0);
        expect(unit.margin).toBe(0);
        expect(unit.costPrice).toBe(0);
        expect(unit.lastOperationDate).toBeNull();
    });

    it('должен учитывать услуги и комиссии из транзакций', async () => {
        const mockPosting: PostingDto = {
            postingNumber: '456',
            orderNumber: 'order456',
            statusOzon: 'На доставке',
        } as PostingDto;

        const mockTransactions: TransactionDto[] = [
            {
                operationDate: new Date('2025-08-10T12:00:00Z'),
                services: [{ name: 'Logistics', price: 100 }],
                saleCommission: 50,
            } as TransactionDto,
        ];

        const unit = await unitService.createUnitItem(mockPosting, mockTransactions);

        expect(unit.services.length).toBe(2);
        expect(unit.services).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'Logistics', price: 100 }),
                expect.objectContaining({ name: 'SalesCommission', price: 50 }),
            ])
        );
        expect(unit.totalServices).toBe(150);
        expect(unit.lastOperationDate).toEqual(new Date('2025-08-10T12:00:00Z'));
    });

    it('должен установить последнюю дату операции из транзакций', async () => {
        const posting = {
            postingNumber: '789',
            orderNumber: 'order789',
            statusOzon: 'some_status',
        } as PostingDto;

        const transactions: TransactionDto[] = [
            {
                operationDate: new Date('2025-08-01T12:00:00Z'),
            } as TransactionDto,
            {
                operationDate: new Date('2025-08-15T09:30:00Z'),
            } as TransactionDto,
        ];

        const unit = await unitService.createUnitItem(posting, transactions);

        expect(unit.lastOperationDate).toEqual(new Date('2025-08-15T09:30:00Z'));
    });

    it('должен добавить только комиссию, если services пустой', async () => {
        const posting = {
            postingNumber: '000',
            orderNumber: 'order000',
            statusOzon: 'delivered',
        } as PostingDto;

        const transactions: TransactionDto[] = [
            {
                operationDate: new Date(),
                saleCommission: 70,
            } as TransactionDto,
        ];

        const unit = await unitService.createUnitItem(posting, transactions);

        expect(unit.services).toEqual([
            { name: 'SalesCommission', price: 70 },
        ]);
        expect(unit.totalServices).toBe(70);
    });

    it('должен вернуть null в lastOperationDate если транзакций нет', async () => {
        const posting = {
            postingNumber: '999',
            orderNumber: 'order999',
            statusOzon: 'canceled',
        } as PostingDto;

        const unit = await unitService.createUnitItem(posting, []);

        expect(unit.lastOperationDate).toBeNull();
    });
});
