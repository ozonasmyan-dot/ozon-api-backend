export interface DrrRequestDto {
    dateFrom: string;
    dateTo: string;
    sku: string[];
}

export interface DrrResponseDto {
    orders: {
        items: {
            sku: string;
            item: number;
        }[];
        totals: number;
    };
    ads: {
        items: {
            productId: string;
            moneySpent: number;
        }[];
        totals: number;
    };
}
