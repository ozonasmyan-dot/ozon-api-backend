export interface DrrRequestDto {
    date: string
    sku?: string[];
}
export interface DrrProductDto {
    sku: string;
    orders: {
        count: number;
        money: number;
    };
    ads: {
        items: { type: string; money: number }[];
        totals: number;
    };
    drr: number;
}

export interface DrrTotalsDto {
    orders: {
        count: number;
        money: number;
    };
    ads: {
        items: { type: string; money: number }[];
        totals: number;
    };
    drr: number;
}

export interface DrrResponseDto {
    products: DrrProductDto[];
    totals: DrrTotalsDto;
}
