import {PrismaClient, AdvertisingHourly} from '@prisma/client';
import prisma from '@/infrastructure/database/prismaClient';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class AdvertisingHourlyRepository {
    constructor(private prismaClient: PrismaClient = prisma) {
    }

    async create(campaign: any): Promise<AdvertisingHourly> {
        const yerevan = dayjs().tz("Asia/Yerevan");

        const fakeUtc = dayjs.utc(yerevan.format("YYYY-MM-DDTHH:mm:ss.SSS"));

        const now = fakeUtc.toISOString();

        return this.prismaClient.advertisingHourly.upsert({
            where: {
                updatedAt_campaignId: {
                    updatedAt: now,
                    campaignId: String(campaign.id),
                },
            },
            update: {
                productId: String(campaign.sku),
                type: campaign.type,
                moneySpent: campaign.moneySpent,
                views: campaign.views,
                clicks: campaign.clicks,
                toCart: campaign.toCart,
                ctr: campaign.ctr,
                weeklyBudget: campaign.weeklyBudget,
                status: campaign.status ? campaign.status : '',
                avgBid: campaign.avgBid,
                crToCart: campaign.crToCart,
                costPerCart: campaign.costPerCart,
                orders: campaign.orders,
                ordersMoney: campaign.ordersMoney,
                savedAt: now,
            },
            create: {
                campaignId: String(campaign.id),
                productId: String(campaign.sku),
                type: campaign.type,
                moneySpent: campaign.moneySpent,
                views: campaign.views,
                clicks: campaign.clicks,
                toCart: campaign.toCart,
                ctr: campaign.ctr,
                weeklyBudget: campaign.weeklyBudget,
                status: campaign.status ? campaign.status : '',
                avgBid: campaign.avgBid,
                crToCart: campaign.crToCart,
                costPerCart: campaign.costPerCart,
                orders: campaign.orders,
                ordersMoney: campaign.ordersMoney,
                savedAt: now,
                updatedAt: now,
            },
        });
    }

    async getAll(): Promise<AdvertisingHourly[]> {
        return this.prismaClient.advertisingHourly.findMany({
            orderBy: {updatedAt: 'desc'},
        });
    }
}
