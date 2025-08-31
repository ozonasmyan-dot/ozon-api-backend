import {Prisma, PrismaClient, UnitNew} from '@prisma/client';
import {UnitDto} from "@/modules/unit/dto/unit.dto";
import prisma from "@/infrastructure/database/prismaClient";
import {OrderItem} from "@/modules/analytics/dto/items.dto";
import dayjs from "dayjs";
import {OrdersSummaryDto} from "@/modules/unit/dto/orders-summary.dto";

export class UnitRepository {
    constructor(private prismaClient: PrismaClient = prisma) {
    }

    async create(data: Omit<UnitDto, 'id'>): Promise<UnitNew> {
        return this.prismaClient.unitNew.upsert({
            where: {
                postingNumber: data.postingNumber
            },
            create: {
                ...data,
                services: data.services as Prisma.InputJsonValue
            },
            update: {
                ...data,
                services: data.services as Prisma.InputJsonValue
            },
        });
    }

    async saveMany(units: Omit<UnitDto, 'id'>[]): Promise<UnitNew[]> {
        return Promise.all(units.map(p => this.create(p)));
    }

    async rowsCount(): Promise<number> {
        return this.prismaClient.unitNew.count();
    }

    async notDeliveredUnits(): Promise<UnitNew[]> {
        return this.prismaClient.unitNew.findMany({
            where: {
                statusOzon: {
                    notIn: ["cancelled", "delivered"],
                },
            },
        });
    }

    async updatePostingStatus(status: string, postingNumber: string) {
        await this.prismaClient.unitNew.update({
            where: {
                postingNumber
            },
            data: {
                statusOzon: status
            },
        });
    }

    async lastPostingDate() {
        const unit = await this.prismaClient.unitNew.findFirst({
            orderBy: {
                createdAt: "desc"
            },
        });

        return unit?.createdAt;
    }

    async lastTransactionDate() {
        const unit = await this.prismaClient.unitNew.findFirst({
            where: {
                lastOperationDate: {
                    not: null,
                },
            },
            orderBy: {
                lastOperationDate: "desc",
            },
        });

        return unit?.lastOperationDate;
    }

    async getUnitByPostingNumber(postingNumber: string): Promise<UnitNew | null> {
        return this.prismaClient.unitNew.findFirst({
            where: {
                OR: [
                    {postingNumber: postingNumber},
                    {orderNumber: postingNumber},
                ],
            },
        });
    }

    async getAll(): Promise<UnitNew[]> {
        return this.prismaClient.unitNew.findMany({
            orderBy: {
                createdAt: 'desc',
            }
        });
    }

    async getUnitsRevenueBySku(start: string, end: string): Promise<{
        items: OrderItem[];
        totals: { money: number; count: number }
    }> {
        const orders = await this.prismaClient.unitNew.groupBy({
            by: [
                "sku",
            ],
            where: {
                createdAt: {
                    gte: start,
                    lte: end
                }
            },
            _sum: {
                price: true,
            },
            _count: {
                sku: true,
            },
        });

        const items: OrderItem[] = orders.map(item => ({
            sku: item.sku,
            money: item._sum.price ?? 0,
            count: item._count.sku,
        }));

        const totals = items.reduce(
            (acc, item) => {
                acc.money += item.money;
                acc.count += item.count;
                return acc;
            },
            {money: 0, count: 0}
        );

        return {
            items,
            totals,
        };
    }

    async getStatusCountsBySku(start: string, end: string): Promise<{ createdAt: Date; sku: string; status: string }[]> {
        const units = await this.prismaClient.unitNew.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                createdAt: true,
                sku: true,
                status: true,
            },
        });

        return units.map((u) => ({
            createdAt: u.createdAt,
            sku: u.sku,
            status: u.status,
        }));
    }

    async getEconomyBySku(start: string, end: string): Promise<{ createdAt: Date; sku: string; status: string; margin: number; costPrice: number; totalServices: number }[]> {
        const units = await this.prismaClient.unitNew.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                createdAt: true,
                sku: true,
                status: true,
                margin: true,
                costPrice: true,
                totalServices: true,
            },
        });

        return units.map((u) => ({
            createdAt: u.createdAt,
            sku: u.sku,
            status: u.status,
            margin: Number(u.margin),
            costPrice: Number(u.costPrice),
            totalServices: Number(u.totalServices),
        }));
    }

    async getOrdersSummary(): Promise<OrdersSummaryDto[]> {
        const rows = await this.prismaClient.$queryRaw<Array<{date: string; productId: string; ordersMoney: bigint; ordersCount: bigint;}>>`
            SELECT DATE("createdAt") as date,
                   "sku" as productId,
                   SUM("price") as ordersMoney,
                   COUNT(*) as ordersCount
            FROM "UnitNew"
            GROUP BY DATE("createdAt"), "sku"
            ORDER BY DATE("createdAt"), "sku";
        `;

        return rows.map(r => ({
            date: r.date,
            productId: r.productId,
            ordersMoney: Number(r.ordersMoney),
            ordersCount: Number(r.ordersCount),
        }));
    }
}
