export interface BuyoutRequestDto {
    from: string;
    to: string;
    sku: string[];
}

export interface BuyoutItemDto {
    sku: string;
    statuses: Record<string, number>;
    total: number;
    buyout: number;
}

export interface BuyoutMonthDto {
    month: string;
    items: BuyoutItemDto[];
}
