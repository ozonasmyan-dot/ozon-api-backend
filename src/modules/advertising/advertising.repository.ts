import { PrismaClient, Advertising, UnitNew } from "@prisma/client";
import prisma from "@/prisma";

export class AdvertisingRepository {
    constructor(private prismaClient: PrismaClient = prisma) {}

    async create(campaign: any, date: string): Promise<Advertising> {
        return this.prismaClient.advertising.upsert({
            where: {
                savedAt_campaignId: {
                    savedAt: new Date(date),
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
                savedAt: new Date(date),
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

    async getAdsAggByProductType(start: string, end: string) {
        const totals = await this.prismaClient.advertising.groupBy({
            by: [
                "productId"
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

        return {
            items: totals.map(i => ({
                moneySpent: i._sum.moneySpent,
                productId: i.productId,
            })),
            totals: totals.reduce((acc: any, item: any) => acc + item._sum.moneySpent, 0),
        }
    }
}