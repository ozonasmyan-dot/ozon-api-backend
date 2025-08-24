import dayjs from "dayjs";
import {UnitRepository} from '@/modules/unit/repository/repository';
import {AdvertisingRepository} from '@/modules/advertising/repository/repository';
import {logger} from '@/shared/logger';
import {DrrRequestDto, DrrResponseDto} from "@/modules/analytics/dto/drr.dto";
import {AdItem, OrderItem} from "@/modules/analytics/dto/items.dto";

export class AnalyticsService {
    constructor(
        private unitRepo: UnitRepository,
        private adsRepo: AdvertisingRepository,
    ) {
    }

    async getDrr({date, sku}: DrrRequestDto): Promise<DrrResponseDto> {
        logger.info({date, sku}, 'Получение DRR');

        const ads = await this.adsRepo.getAdsAggByProductType(
            dayjs(date).format('YYYY-MM-DD[T]00:00:00[Z]'),
            dayjs(date).format('YYYY-MM-DD[T]23:59:59[Z]'),
        );

        const orders = await this.unitRepo.getUnitsRevenueBySku(
            dayjs(date).subtract(1, 'day').format('YYYY-MM-DD[T]20:59:59[Z]'),
            dayjs(date).format('YYYY-MM-DD[T]21:00:00[Z]'),
        );

        const filteredAdsItems = sku.length ? ads.items.filter((i: AdItem) => sku.includes(i.productId)) : ads.items;
        const filteredOrdersItems = sku.length ? orders.items.filter((i: OrderItem) => sku.includes(i.sku)) : orders.items;

        const skuSet = new Set<string>([
            ...filteredOrdersItems.map((o: OrderItem) => o.sku),
            ...filteredAdsItems.map((a: AdItem) => a.productId),
        ]);

        const products = Array.from(skuSet).map((id) => {
            const order = filteredOrdersItems.find((o: OrderItem) => o.sku === id);
            const adsForSku = filteredAdsItems.filter((a: AdItem) => a.productId === id);

            const adsItems = adsForSku.map((a: any) => ({
                type: a.type,
                money: a.moneySpent,
            }));
            const adsTotal = adsItems.reduce((acc: number, curr: any) => acc + curr.money, 0);

            const ordersMoney = order?.money || 0;
            const ordersCount = order?.count || 0;
            const drr = ordersMoney ? adsTotal / ordersMoney : 0;

            return {
                sku: id,
                orders: {
                    money: ordersMoney,
                    count: ordersCount,
                },
                ads: {
                    items: adsItems,
                    totals: adsTotal,
                },
                drr,
            };
        });

        const totals = products.reduce(
            (acc, p) => {
                acc.orders.money += p.orders.money;
                acc.orders.count += p.orders.count;
                acc.ads.totals += p.ads.totals;
                p.ads.items.forEach((item) => {
                    const existing = acc.ads.items.find((i) => i.type === item.type);
                    if (existing) {
                        existing.money += item.money;
                    } else {
                        acc.ads.items.push({...item});
                    }
                });
                return acc;
            },
            {
                orders: {money: 0, count: 0},
                ads: {items: [] as { type: string; money: number }[], totals: 0},
                drr: 0,
            }
        );

        totals.drr = totals.orders.money ? totals.ads.totals / totals.orders.money : 0;

        return {
            products,
            totals,
        };
    }
}
