import { sellerClient } from "@/infrastructure/clients/ozon/seller";
import { ApiPostingDto } from "@/modules/posting/dto/api-posting.dto";

export interface PostingFetchParams {
    filter?: {
        since?: string | Date;
        to?: string | Date;
        status?: string;
        posting_number?: string;
        order_number?: string;
    };
}

export async function postingsFetch(
    params: PostingFetchParams = {},
): Promise<ApiPostingDto[]> {
    const limit = 1000;
    let offset = 0;
    let hasMore = true;

    const allPostings: ApiPostingDto[] = [];

    while (hasMore) {
        const response = await sellerClient.post(
            '/v2/posting/fbo/list',
            {
                limit,
                offset,
                ...params,
                with: {
                    analytics_data: true,
                    financial_data: true,
                    legal_info: true,
                },
            },
        );

        const items = response.data.result;
        allPostings.push(...items);

        offset += limit;
        hasMore = items.length === limit;
    }

    return allPostings;
}
