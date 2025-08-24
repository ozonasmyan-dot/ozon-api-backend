import dayjs from "dayjs";
import {UnitRepository} from "@/modules/unit/unit.repository";
import {AdvertisingRepository} from "@/modules/advertising/advertising.repository";

export class AnalyticsService {
    constructor(
        private unitRepo = new UnitRepository(),
        private adsRepo = new AdvertisingRepository(),
    ) {
    }

    async getDrrByDate(date: string) {
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
}

export const analyticsService = new AnalyticsService();