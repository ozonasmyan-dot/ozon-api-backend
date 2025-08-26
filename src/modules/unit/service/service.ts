import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import { PostingsService } from '@/modules/posting/service/service';
import { TransactionService } from '@/modules/transaction/service/service';
import { UnitDto } from '@/modules/unit/dto/unit.dto';
import { economy } from '@/modules/unit/utils/economy.utils';
import { TransactionDto } from '@/modules/transaction/dto/transaction.dto';
import { UnitRepository } from '@/modules/unit/repository/repository';
import { PostingDto } from '@/modules/posting/dto/posting.dto';
import { logger } from '@/shared/logger';

dayjs.extend(minMax);

export class UnitService {
    constructor(
        private unitRepo: UnitRepository,
        private postingsService: PostingsService,
        private transactionsService: TransactionService
    ) {
    }

    async createUnitItem(posting: PostingDto, transactions?: TransactionDto[]): Promise<UnitDto>;
    async createUnitItem(unit: UnitDto, transactions?: TransactionDto[]): Promise<UnitDto>;
    async createUnitItem(
        item: PostingDto | UnitDto,
        transactions: TransactionDto[] = [],
    ): Promise<UnitDto> {
        const latestDayjs = transactions.length
            ? dayjs.max(transactions.map(x => dayjs(x.operationDate)))
            : null;

        const unit: UnitDto = 'status' in item
            ? { ...item, services: [...item.services] }
            : {
                ...item,
                status: item.statusOzon,
                margin: 0,
                totalServices: 0,
                costPrice: 0,
                lastOperationDate: null,
                services: [],
            };

        if (latestDayjs) {
            unit.lastOperationDate = unit.lastOperationDate
                ? dayjs.max(dayjs(unit.lastOperationDate), latestDayjs).toDate()
                : latestDayjs.toDate();
        }

        const services = transactions.flatMap(t => t?.services ?? []);
        unit.services.push(...services);

        for (const tx of transactions) {
            if (tx.saleCommission) {
                unit.services.push({
                    name: "SalesCommission",
                    price: tx.saleCommission,
                });
            }
        }

        const {
            status,
            totalServices,
            margin,
            costPrice,
        } = economy(unit);

        return {
            ...unit,
            status,
            totalServices,
            costPrice,
            margin,
        };
    }

    async firstSync() {
        logger.info('Starting initial unit synchronization');

        const units: UnitDto[] = [];

        const postings = await this.postingsService.get({
            since: dayjs('2024-10-01').format('YYYY-MM-DD') + 'T00:00:00Z',
            to: dayjs(new Date()).format('YYYY-MM-DD') + 'T23:59:59Z',
        });

        for (const posting of postings) {
            const [txsByPosting, txsByOrder] = await Promise.all([
                this.transactionsService.get({filter: {posting_number: posting.postingNumber}}),
                this.transactionsService.get({filter: {posting_number: posting.orderNumber}}),
            ]);

            const unit = await this.createUnitItem(
                posting,
                [...txsByPosting, ...txsByOrder]
            );

            units.push(unit);
        }

        return units;
    }

    async updateNotDeliveredUnitsStatus() {
        const units = await this.unitRepo.notDeliveredUnits();
        const unitsPostingNumbers = units.map(p => p.postingNumber);

        await Promise.allSettled(
            unitsPostingNumbers.map(async number => {
                const newPosting = await this.postingsService.getItemByPostingNumber(number);
                return this.unitRepo.updatePostingStatus(newPosting.statusOzon, newPosting.postingNumber);
            })
        );
    }

    async saveNewUnits(): Promise<void> {
        const lastDate = await this.unitRepo.lastPostingDate();

        logger.info('Saving new units');

        const postings = await this.postingsService.get({
            since: lastDate ? dayjs(lastDate).format('YYYY-MM-DD') + 'T00:00:00Z' : dayjs('2025-08-19').format('YYYY-MM-DD') + 'T00:00:00Z',
            to: dayjs(new Date()).format('YYYY-MM-DD') + 'T23:59:59Z',
        });

        const units: UnitDto[] = [];

        for (const posting of postings) {
            const unit = await this.createUnitItem(posting);

            units.push(unit);
        }

        await this.unitRepo.saveMany(units)
    }

    async getNewTransactions() {
        const lastDate = await this.unitRepo.lastTransactionDate();

        return await this.transactionsService.get({
            filter: {
                date: {
                    from: (lastDate ? dayjs(lastDate).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD')) + 'T00:00:00Z',
                    to: dayjs(new Date()).format('YYYY-MM-DD') + 'T23:59:59Z',
                }
            },
        });
    }

    async combinePostingsAndTransactions() {
        logger.info('Combining postings and transactions');

        const transactions = await this.getNewTransactions();

        const results = await Promise.allSettled(
            transactions.map(async (transaction) => {
                const unit = await this.unitRepo.getUnitByPostingNumber(transaction.postingNumber);

                if (!unit) return null;

                const unitDto: UnitDto = {
                    ...(unit as unknown as UnitDto),
                    services: ((unit as any).services ?? []) as { name: string; price: number }[],
                };

                return await this.createUnitItem(
                    unitDto,
                    [transaction]
                );
            })
        );

        const combineUnits = results
            .filter((r): r is PromiseFulfilledResult<UnitDto> => r.status === "fulfilled" && r.value !== null)
            .map(r => r.value);

        if (combineUnits.length > 0) {
            await this.unitRepo.saveMany(combineUnits);
        }
    }

    async sync() {
        const emptyUnits = (await this.unitRepo.rowsCount()) === 0;

        if (emptyUnits) {
            logger.info('No units found, performing first sync');
            const units = await this.firstSync();

            await this.unitRepo.saveMany(units);
        }

        logger.info('Updating statuses for undelivered units');
        await this.updateNotDeliveredUnitsStatus();

        await this.saveNewUnits();

        await this.combinePostingsAndTransactions();
    }

    async getAll() {
        return await this.unitRepo.getAll();
    }
}
