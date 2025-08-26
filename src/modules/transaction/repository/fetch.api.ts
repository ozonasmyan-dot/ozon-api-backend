import { sellerClient } from "@/infrastructure/clients/ozon/seller";
import { ApiTransactionDto } from '@/modules/transaction/dto/api-transaction.dto';

export interface FilterParams {
    filter: {
        date?: {
            from?: string,
            to?: string
        },
        posting_number?: string,
    },
}

/**
 * Fetches transactions from the Ozon API.
 * The API is paginated; this function iterates through all pages
 * and returns a consolidated array of ApiTransactionDto objects.
 */
export async function fetchTransactions(params: FilterParams): Promise<ApiTransactionDto[]> {
    const pageSize = 1000;
    let page = 1;
    const allOperations: ApiTransactionDto[] = [];
    const parseParams: FilterParams = {
        filter: {},
    };

    if (params.filter.date) {
        parseParams.filter.date = params.filter.date;
    }

    if (params.filter.posting_number) {
        parseParams.filter.posting_number = params.filter.posting_number;
    }

    let pageCount: number | null = null;

    while (pageCount === null || page <= pageCount) {
        const response = await sellerClient.post('/v3/finance/transaction/list', {
            ...parseParams,
            page,
            page_size: pageSize,
        });

        const {operations, page_count} = response.data.result;

        if (!operations || operations.length === 0) break;

        allOperations.push(...operations);

        pageCount = page_count;
        page++;

    }

    return allOperations;
}