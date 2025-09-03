import { fetchTransactions, FilterParams } from '@/modules/transaction/repository/fetch.api';
import { TransactionDto } from '@/modules/transaction/dto/transaction.dto';
import { logger } from '@/shared/logger';
import {generateMonthlyRanges} from "@/shared/utils/date.utils";
import type {Dayjs} from "dayjs";

export class TransactionService {
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

    async getByRange(startDate: Dayjs): Promise<TransactionDto[]> {
        logger.info({ startDate }, 'Fetching transactions by range');
        const datesRange = generateMonthlyRanges(startDate);

        let transactions: TransactionDto[] = [];

        for (const { from, to } of datesRange) {
            const transactionsQuery = await fetchTransactions({
                filter: {
                    date: {
                        from: from.format('YYYY-MM-DD') + 'T00:00:00.000Z',
                        to: to.format('YYYY-MM-DD') + 'T23:59:59.999Z',
                    },
                },
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

        return transactions
    }
}
