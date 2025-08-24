import {Prisma, PrismaClient, UnitNew} from '@prisma/client';
import {UnitDto} from "@/modules/unit/dto/unit.dto";

export class UnitRepository {
    constructor(private prisma: PrismaClient = new PrismaClient()) {
    }

    async create(data: Omit<UnitDto, 'id'>): Promise<UnitNew> {
        return this.prisma.unitNew.upsert({
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
        return this.prisma.unitNew.count();
    }

    async notDeliveredUnits(): Promise<UnitNew[]> {
        return this.prisma.unitNew.findMany({
            where: {
                statusOzon: {
                    notIn: ["cancelled", "delivered"],
                },
            },
        });
    }

    async updatePostingStatus(status: string, postingNumber: string) {
        await this.prisma.unitNew.update({
            where: {
                postingNumber
            },
            data: {
                statusOzon: status
            },
        });
    }

    async lastPostingDate() {
        const unit = await this.prisma.unitNew.findFirst({
            orderBy: {
                createdAt: "desc"
            },
        });

        return unit?.createdAt;
    }

    async lastTransactionDate() {
        const unit = await this.prisma.unitNew.findFirst({
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
        return this.prisma.unitNew.findFirst({
            where: {
                OR: [
                    {postingNumber: postingNumber},
                    {orderNumber: postingNumber},
                ],
            },
        });
    }

    async getAll(): Promise<UnitNew[]> {
        return this.prisma.unitNew.findMany({
            orderBy: {
                createdAt: 'desc',
            }
        });
    }

    async getUnitsRevenueBySku(start: string, end: string) {
        const orders = await this.prisma.unitNew.groupBy({
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
        });

        return {
            items: orders.map(item => ({
                sku: item.sku,
                item: item._sum.price,
            })),
            totals: orders.reduce((acc: any, item: any) => acc + item._sum.price, 0),
        };
    }
}