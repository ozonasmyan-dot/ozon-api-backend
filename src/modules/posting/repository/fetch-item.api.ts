import {sellerClient} from "@/api/ozon/seller";
import {ApiPostingDto} from "@/modules/posting/dto/api-posting.dto";

export async function postingsFetchItem(postingNumber: string): Promise<ApiPostingDto> {
    const response = await sellerClient.post(
        'v2/posting/fbo/get',
        {
            posting_number: postingNumber,
            with: {
                analytics_data: true,
                financial_data: true,
                legal_info: true,
            },
        },
    );

    return response.data.result;
}