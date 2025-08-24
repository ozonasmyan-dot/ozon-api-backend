import { postingsFetch } from "@/modules/posting/repository/fetch.api";
import { postingsFetchItem } from "@/modules/posting/repository/fetch-item.api";
import { PostingDto } from "@/modules/posting/dto/posting.dto";
import decimal from "decimal.js";
import { ApiPostingDto } from "@/modules/posting/dto/api-posting.dto";
import { AppError } from "@/shared/types/AppError";

export class PostingsService {
    async get(
        { since, to }:
        { since: string | Date, to: string | Date }
    ): Promise<PostingDto[]> {
        let postingsList: PostingDto[] = [];

        try {
            const postings: ApiPostingDto[] = await postingsFetch({
                filter: {
                    since,
                    to,
                },
            });

            for (const posting of postings) {
                postingsList.push({
                    product: posting?.products?.[0]?.offer_id,

                    orderId: String(posting?.order_id ?? ""),
                    orderNumber: posting?.order_number,
                    postingNumber: posting?.posting_number,
                    statusOzon: posting?.status,
                    createdAt: posting?.created_at,
                    inProcessAt: posting?.in_process_at,

                    deliveryType: posting?.analytics_data?.delivery_type,
                    city: posting?.analytics_data?.city,
                    isPremium: posting?.analytics_data?.is_premium,
                    paymentTypeGroupName: posting?.analytics_data?.payment_type_group_name,
                    warehouseId: String(posting?.analytics_data?.warehouse_id ?? ""),
                    warehouseName: posting?.analytics_data?.warehouse_name,

                    sku: String(posting?.products?.[0]?.sku ?? ""),

                    oldPrice: decimal(posting?.financial_data?.products?.[0]?.old_price ?? 0).toNumber(),
                    price: decimal(posting?.financial_data?.products?.[0]?.price ?? 0).toNumber(),
                    currencyCode: posting?.financial_data?.products?.[0]?.currency_code,

                    clusterFrom: posting?.financial_data?.cluster_from,
                    clusterTo: posting?.financial_data?.cluster_to,
                });
            }
        } catch (error) {
            throw new AppError('Failed to fetch postings', 502, error);
        }

        return postingsList ?? [];
    }

    async getItemByPostingNumber(postingNumber: string): Promise<PostingDto> {
        const postingApi: ApiPostingDto | null = await postingsFetchItem(postingNumber);

        if (!postingApi) {
            throw new AppError('Posting not found', 404);
        }

        const posting: Partial<PostingDto> = {
            product: postingApi?.products?.[0]?.offer_id,

            orderId: String(postingApi?.order_id ?? ""),
            orderNumber: postingApi?.order_number,
            postingNumber: postingApi?.posting_number,
            statusOzon: postingApi?.status,
            createdAt: postingApi?.created_at,
            inProcessAt: postingApi?.in_process_at,

            deliveryType: postingApi?.analytics_data?.delivery_type,
            city: postingApi?.analytics_data?.city,
            isPremium: postingApi?.analytics_data?.is_premium,
            paymentTypeGroupName: postingApi?.analytics_data?.payment_type_group_name,
            warehouseId: String(postingApi?.analytics_data?.warehouse_id ?? ""),
            warehouseName: postingApi?.analytics_data?.warehouse_name,

            sku: String(postingApi?.products?.[0]?.sku ?? ""),

            oldPrice: decimal(postingApi?.financial_data?.products?.[0]?.old_price ?? 0).toNumber(),
            price: decimal(postingApi?.financial_data?.products?.[0]?.price ?? 0).toNumber(),
            currencyCode: postingApi?.financial_data?.products?.[0]?.currency_code,

            clusterFrom: postingApi?.financial_data?.cluster_from,
            clusterTo: postingApi?.financial_data?.cluster_to,
        };

        return posting as PostingDto;
    }
}
