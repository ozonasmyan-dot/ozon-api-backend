export interface ApiTransactionDto {
    operation_id: number;
    operation_type: string;
    operation_date: string;
    operation_type_name: string;
    delivery_charge: number;
    return_delivery_charge: number;
    accruals_for_sale: number;
    sale_commission: number;
    amount: number;
    type: string;
    posting: {
        delivery_schema: string;
        order_date: string;
        posting_number: string;
        warehouse_id: number;
    };
    items: [];
    services: {
        name: string,
        price: number,
    }[];
}
