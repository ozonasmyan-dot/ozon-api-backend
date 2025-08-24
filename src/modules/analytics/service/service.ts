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

        const adsTotals = sku.length ? filteredAdsItems.reduce((acc: number, i: any) => acc + i.moneySpent, 0) : ads.totals;
        const ordersTotals = sku.length ? filteredOrdersItems.reduce((acc: number, i: any) => acc + i.item, 0) : orders.totals;

        return {
            ads: { items: filteredAdsItems, totals: adsTotals },
            orders: { items: filteredOrdersItems, totals: ordersTotals },
        };
    }
}
