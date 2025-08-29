import {PrismaClient, Advertising} from "@prisma/client";
import prisma from "@/infrastructure/database/prismaClient";
import {AdItem} from "@/modules/analytics/application/dto/items.dto";

export class AdvertisingRepository {
    constructor(private prismaClient: PrismaClient = prisma) {
    }

    async createStat(campaign: any, date: Date): Promise<any> {
        await this.prismaClient.advertisingStat.create({
            data: {
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
                savedAt: date,
            }
        });
    }

    async create(campaign: any, date: Date): Promise<any> {
        if (!campaign.campaignId || !campaign.productId) {
            throw new Error(`❌ Missing campaignId or productId in campaign: ${JSON.stringify(campaign)}`);
        }

        return this.prismaClient.advertising.upsert({
            where: {
                savedAt_campaignId_productId: {
                    savedAt: date,
                    campaignId: String(campaign.campaignId),
                    productId: String(campaign.productId),
                }
            },
            update: {
                ...campaign,
                campaignId: String(campaign.campaignId),
                productId: String(campaign.productId),
                savedAt: date,
                moneySpent: Number(campaign.moneySpent),
            },
            create: {
                ...campaign,
                campaignId: String(campaign.campaignId),
                productId: String(campaign.productId),
                savedAt: date,
                moneySpent: Number(campaign.moneySpent),
            },
        });
    }

    async lastRow(): Promise<Advertising | null> {
        return this.prismaClient.advertising.findFirst({
            orderBy: {
                savedAt: 'desc',
            },
        });
    }

    async getAll(): Promise<Advertising[]> {
        return this.prismaClient.advertising.findMany({
            orderBy: {
                savedAt: 'desc',
            },
        });
    }

    async getAdsAggByProductType(start: string, end: string): Promise<{ items: AdItem[]; totals: number }> {
        const totals = await this.prismaClient.advertising.groupBy({
            by: [
                "productId",
                "type",
            ],
            where: {
                savedAt: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                moneySpent: true,
            },
        });

        const items: AdItem[] = totals.map(i => ({
            moneySpent: i._sum.moneySpent ?? 0,
            productId: i.productId,
            type: i.type,
        }));
        const total = items.reduce((acc, item) => acc + item.moneySpent, 0);

        return {
            items,
            totals: total,
        };
    }
}