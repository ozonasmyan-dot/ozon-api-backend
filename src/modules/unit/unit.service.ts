import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import {PostingsService} from "@/modules/posting/posting.service";
import {TransactionService} from "@/modules/transaction/transaction.service";
import {UnitDto} from "@/modules/unit/dto/unit.dto";
import {economy} from "@/modules/unit/utils/economy.utils";
import {TransactionDto} from "@/modules/transaction/dto/transaction.dto";
import {UnitRepository} from "@/modules/unit/unit.repository";
import {PostingDto} from "@/modules/posting/dto/posting.dto";

dayjs.extend(minMax);

export class UnitService {
    constructor(
        private unitRepo = new UnitRepository(),
        private postingsService = new PostingsService(),
        private transactionsService = new TransactionService()
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

    async firstSync() {
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
        console.log('123xx');
        const lastDate = await this.unitRepo.lastPostingDate();

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

    async sync() {
        const emptyUnits = (await this.unitRepo.rowsCount()) === 0;

        if (emptyUnits) {
            const units = await this.firstSync();

            await this.unitRepo.saveMany(units);
        }

        await this.updateNotDeliveredUnitsStatus();

        await this.saveNewUnits();

        await this.combinePostingsAndTransactions();
    }

    async getAll() {
        return await this.unitRepo.getAll();
    }
}

export const unitService = new UnitService();