import dayjs from 'dayjs';
import { fetchTransactions, FilterParams } from '@/modules/transaction/repository/fetch.api';
import { TransactionDto } from '@/modules/transaction/dto/transaction.dto';
import { logger } from '@/shared/logger';
import { TransactionRepository } from '@/modules/transaction/repository/repository';
import { ApiTransactionDto } from '@/modules/transaction/dto/api-transaction.dto';

export class TransactionService {
    constructor(private txRepo: TransactionRepository = new TransactionRepository()) {}

    async get(params: FilterParams): Promise<TransactionDto[]> {
        logger.info({ params }, 'Fetching transactions');

        let transactions: TransactionDto[] = [];

        const transactionsQuery = await fetchTransactions({
            ...params,
        });

        for (const t of transactionsQuery) {
            transactions.push({
                postingNumber: t.posting.posting_number,
                operationDate: new Date(t.operation_date),
                services: t.services,
                saleCommission: t.sale_commission,
                items: t.items,
            });
        }

        return transactions;
    }

    async getByRangeMap(params: FilterParams, datesMap: { from: string, to: string }[]): Promise<TransactionDto[]> {
        logger.info({ params, datesMap }, 'Fetching transactions by range map');

        let transactions: TransactionDto[] = [];

        for (const { from, to } of datesMap) {
            const t = await this.get({
                filter: {
                    date: {
                        from,
                        to,
                    }
                }
            });

            transactions.push(...(t ?? []));
        }

        return transactions;
    }

    private buildMonthRanges(from: dayjs.Dayjs, to: dayjs.Dayjs): { from: string; to: string }[] {
        const ranges: { from: string; to: string }[] = [];
        let start = from.startOf('month');
        const end = to.endOf('month');

        while (start.isBefore(end) || start.isSame(end, 'month')) {
            let rangeStart = start;
            let rangeEnd = start.endOf('month');

            if (rangeStart.isBefore(from)) {
                rangeStart = from;
            }
            if (rangeEnd.isAfter(to)) {
                rangeEnd = to;
            }

            ranges.push({
                from: rangeStart.format('YYYY-MM-DD') + 'T00:00:00Z',
                to: rangeEnd.format('YYYY-MM-DD') + 'T23:59:59Z',
            });

            start = start.add(1, 'month');
        }

        return ranges;
    }

    async sync(): Promise<void> {
        const last = await this.txRepo.lastRow();
        const from = last ? dayjs(last.operationDate) : dayjs('2024-10-01');
        const to = dayjs();
        const ranges = this.buildMonthRanges(from, to);

        for (const { from: f, to: t } of ranges) {
            const txs = await fetchTransactions({
                filter: {
                    date: { from: f, to: t },
                },
            });

            const filtered = txs.filter(tx => !tx.posting?.posting_number);

            if (filtered.length > 0) {
                await this.txRepo.saveMany(filtered as ApiTransactionDto[]);
            }
        }
    }
}

