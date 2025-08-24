import {fetch} from "@/modules/transaction/api/fetch.api";
import {FilterParams} from "@/modules/transaction/api/fetch.api";
import {TransactionDto} from "@/modules/transaction/dto/transaction.dto";

export class TransactionService {
    async get(params: FilterParams): Promise<TransactionDto[]> {
        let transactions: TransactionDto[] = [];

        const transactionsQuery = await fetch({
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
        let transactions: TransactionDto[] = [];

        for (const {from, to} of datesMap) {
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
