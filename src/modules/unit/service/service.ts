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

    async createUnitItem(posting: PostingDto, transactions: TransactionDto[] = []) {
        const latestDayjs = dayjs.max(transactions.map(x => dayjs(x.operationDate)));

        const unit: UnitDto = {
            ...posting,
            status: posting.statusOzon,
            margin: 0,
            totalServices: 0,
            costPrice: 0,
            lastOperationDate: latestDayjs ? latestDayjs.toDate() : null,
            services: [],
        };

        const services = transactions.flatMap(t => t?.services ?? []);

        unit.services.push(...services);

        for (const tx of transactions) {
            if (tx.saleCommission) {
                unit.services.push({
                    name: "SalesCommission",
                    price: tx.saleCommission
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
        }
    }

    /**
     * Performs the initial synchronization by fetching postings and their related
     * transactions to build unit entities.
     *
     * @returns {Promise<UnitDto[]>} Array of newly created unit items.
     * @remarks Side effects: Reads data from posting and transaction services
     * and writes log messages.
     */
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

    /**
     * Saves units for postings that have not yet been stored.
     *
     * @returns {Promise<void>} Resolves when new units are persisted.
     * @remarks Side effects: Fetches postings from an external service,
     * persists units in the repository, and writes log messages.
     */
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

    /**
     * Merges new transactions with existing units and stores the updated
     * unit data.
     *
     * @returns {Promise<void>} Resolves after combined units are saved.
     * @remarks Side effects: Fetches transactions, queries and updates the
     * repository, and writes log messages.
     */
    async combinePostingsAndTransactions() {
        logger.info('Combining postings and transactions');

        const transactions = await this.getNewTransactions();

        const results = await Promise.allSettled(
            transactions.map(async (transaction) => {
                const unit = await this.unitRepo.getUnitByPostingNumber(transaction.postingNumber);

                if (!unit) return null;

                return await this.createUnitItem(
                    // @ts-ignore
                    unit,
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

    /**
     * Orchestrates full unit synchronization including initial sync,
     * status updates, saving new units, and transaction merging.
     *
     * @returns {Promise<void>} Resolves when synchronization completes.
     * @remarks Side effects: Interacts with the repository and external
     * services and writes log messages.
     */
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

    /**
     * Retrieves all units from the repository.
     *
     * @returns {Promise<UnitDto[]>} Array of units ordered by creation date.
     * @remarks Side effects: Reads data from the unit repository.
     */
    async getAll() {
        return await this.unitRepo.getAll();
    }
}
