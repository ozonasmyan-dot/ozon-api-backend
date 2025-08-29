export interface MarginRequestDto {
    from: string;
    to: string;
    sku: string[];
}

export interface MarginItemDto {
    sku: string;
    statuses: Record<string, number>;
    totalServices: number;
    totalCostPrice: number;
    adSpend: number;
    margin: number;
}

export interface MarginTotalsDto {
    totalServices: number;
    totalCostPrice: number;
    adSpend: number;
    margin: number;
}

export interface MarginMonthDto {
    month: string;
    items: MarginItemDto[];
    totals: MarginTotalsDto;
}