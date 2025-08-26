import {AdvertisingService} from '@/modules/advertising/service/service';
import {AdvertisingHourlyRepository} from '@/modules/advertising-hourly/repository/repository';
import dayjs from 'dayjs';

export class AdvertisingHourlyService {
    constructor(
        private adsService: AdvertisingService,
        private hourlyRepo: AdvertisingHourlyRepository,
    ) {}

    async sync() {
        const date = dayjs().format('YYYY-MM-DD');
        const campaigns = await this.adsService.fetchPpcCampaigns(date);

        for (const campaign of campaigns) {
            const campaignBuild = await this.adsService.buildCompany(campaign);
            await this.hourlyRepo.create(campaignBuild);
        }
    }

    async getAll() {
        return this.hourlyRepo.getAll();
    }

    async getByDate(date: string) {
        return this.hourlyRepo.getByDate(date);
    }
}
