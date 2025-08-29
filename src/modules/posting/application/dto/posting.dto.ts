export interface PostingDto {
    product: string; // offer_id
    orderId: string;
    orderNumber: string;
    postingNumber: string;
    statusOzon: string;
    createdAt: Date;
    inProcessAt: Date;

    deliveryType: string;
    city: string;
    isPremium: boolean; // можешь сделать boolean, если хочешь
    paymentTypeGroupName: string;
    warehouseId: string;
    warehouseName: string;

    sku: string;

    oldPrice: number; // если ты не приводишь к number
    price: number;

    currencyCode: string;

    clusterFrom: string;
    clusterTo: string;
}