export interface TransactionDto {
    saleCommission: number,
    operationDate: Date,
    postingNumber: string,
    services: {
        name: string,
        price: number,
    }[],
    items: [],
}