import { fetchTransactions, FilterParams } from '@/modules/transaction/infrastructure/transaction.api';
import { TransactionDto } from '@/modules/transaction/application/dto/transaction.dto';
import { logger } from '@/shared/logger';

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
