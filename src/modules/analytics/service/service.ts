import dayjs from "dayjs";
import { UnitRepository } from '@/modules/unit/repository/repository';
import { AdvertisingRepository } from '@/modules/advertising/repository/repository';
import { logger } from '@/shared/logger';
import { DrrRequestDto, DrrResponseDto } from "@/modules/analytics/dto/drr.dto";

export class AnalyticsService {
    constructor(
        private unitRepo: UnitRepository,
        private adsRepo: AdvertisingRepository,
    ) {
    }

    async getDrrByDate(date: string) {
        logger.info({ date }, 'Получение DRR по дате');

        const ads = await this.adsRepo.getAdsAggByProductType(
            dayjs(date).format('YYYY-MM-DD[T]00:00:00[Z]'),
            dayjs(date).format('YYYY-MM-DD[T]23:59:59[Z]'),
        );

        const orders = await this.unitRepo.getUnitsRevenueBySku(
            dayjs(date).subtract(1, 'day').format('YYYY-MM-DD[T]20:59:59[Z]'),
            dayjs(date).format('YYYY-MM-DD[T]21:00:00[Z]'),
        );

        return {
            orders,
            ads,
        }
    }

    async getDrr({ dateFrom, dateTo, sku }: DrrRequestDto): Promise<DrrResponseDto> {
        logger.info({ dateFrom, dateTo, sku }, 'Получение DRR');

        const ads = await this.adsRepo.getAdsAggByProductType(
            dayjs(dateFrom).format('YYYY-MM-DD[T]00:00:00[Z]'),
            dayjs(dateTo).format('YYYY-MM-DD[T]23:59:59[Z]'),
        );

        const orders = await this.unitRepo.getUnitsRevenueBySku(
            dayjs(dateFrom).subtract(1, 'day').format('YYYY-MM-DD[T]20:59:59[Z]'),
            dayjs(dateTo).format('YYYY-MM-DD[T]21:00:00[Z]'),
        );

        const filteredAdsItems = sku.length ? ads.items.filter((i: any) => sku.includes(i.productId)) : ads.items;
        const filteredOrdersItems = sku.length ? orders.items.filter((i: any) => sku.includes(i.sku)) : orders.items;

        const skuSet = new Set<string>([
            ...filteredOrdersItems.map((o: any) => o.sku),
            ...filteredAdsItems.map((a: any) => a.productId),
        ]);

        const products = Array.from(skuSet).map((id) => {
            const order = filteredOrdersItems.find((o: any) => o.sku === id);
            const adsForSku = filteredAdsItems.filter((a: any) => a.productId === id);

            const cpo = adsForSku
                .filter((a: any) => a.type === 'CPO')
                .reduce((acc: number, curr: any) => acc + curr.moneySpent, 0);
            const other = adsForSku
                .filter((a: any) => a.type !== 'CPO')
                .reduce((acc: number, curr: any) => acc + curr.moneySpent, 0);
            const adsTotal = cpo + other;

            const ordersSum = order?.item || 0;
            const ordersCount = order?.count || 0;
            const drr = ordersSum ? adsTotal / ordersSum : 0;

            return {
                sku: id,
                orders: {
                    sum: ordersSum,
                    count: ordersCount,
                },
                ads: {
                    cpo,
                    other,
                    total: adsTotal,
                },
                drr,
            };
        });

        const totals = products.reduce(
            (acc, p) => {
                acc.orders.sum += p.orders.sum;
                acc.orders.count += p.orders.count;
                acc.ads.cpo += p.ads.cpo;
                acc.ads.other += p.ads.other;
                acc.ads.total += p.ads.total;
                return acc;
            },
            {
                orders: { sum: 0, count: 0 },
                ads: { cpo: 0, other: 0, total: 0 },
                drr: 0,
            }
        );

        totals.drr = totals.orders.sum ? totals.ads.total / totals.orders.sum : 0;

        return {
            products,
            totals,
        };
    }
}
