export interface ApiPostingDto {
    order_id: number;
    order_number: string;
    posting_number: string;
    status: string;
    cancel_reason_id: number;
    created_at: Date;
    in_process_at: Date;
    legal_info: {
        company_name: string;
        inn: string;
        kpp: string;
    };
    products: {
        sku: number;
        name: string;
        quantity: number;
        offer_id: string;
        price: string;
        is_marketplace_buyout: boolean;
        digital_codes: string[];
        currency_code: string;
    }[];
    analytics_data: {
        city: string;
        delivery_type: string;
        is_premium: boolean;
        payment_type_group_name: string;
        warehouse_id: number;
        warehouse_name: string;
        is_legal: boolean;
    };
    financial_data: {
        products: {
            commission_amount: number;
            commission_percent: number;
            payout: number;
            product_id: number;
            currency_code: string;
            old_price: number;
            price: number;
            total_discount_value: number;
            total_discount_percent: number;
            actions: string[];
            quantity: number;
        }[];
        cluster_from: string,
        cluster_to: string,
    };
    additional_data: any[];
}
