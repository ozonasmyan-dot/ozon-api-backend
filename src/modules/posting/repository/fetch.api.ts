import {sellerClient} from "@/api/ozon/seller";
import {ApiPostingDto} from "@/modules/posting/dto/api-posting.dto";

export async function postingsFetch(params: any = {}): Promise<ApiPostingDto[]> {
    const limit = 1000;
    let offset = 0;
    let hasMore = true;

    const allPostings = [];

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