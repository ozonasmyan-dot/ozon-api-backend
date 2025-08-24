export interface DrrRequestDto {
    dateFrom: string;
    dateTo: string;
    sku: string[];
}
export interface DrrProductDto {
    sku: string;
    orders: {
        count: number;
        sum: number;
    };
    ads: {
        cpo: number;
        other: number;
        total: number;
    };
    drr: number;
}

export interface DrrTotalsDto {
    orders: {
        count: number;
        sum: number;
    };
    ads: {
        cpo: number;
        other: number;
        total: number;
    };
    drr: number;
}

export interface DrrResponseDto {
    products: DrrProductDto[];
    totals: DrrTotalsDto;
}
