import { PrismaClient, Transaction } from '@prisma/client';
import prisma from '@/infrastructure/database/prismaClient';
import { ApiTransactionDto } from '@/modules/transaction/dto/api-transaction.dto';
import { Prisma } from '@prisma/client';

export class TransactionRepository {
    constructor(private prismaClient: PrismaClient = prisma) {}

    async create(data: ApiTransactionDto): Promise<Transaction> {
        return this.prismaClient.transaction.upsert({
            where: { operationId: data.operation_id },
            create: {
                operationId: data.operation_id,
                operationType: data.operation_type,
                operationDate: new Date(data.operation_date),
                operationTypeName: data.operation_type_name,
                deliveryCharge: data.delivery_charge,
                returnDeliveryCharge: data.return_delivery_charge,
                accrualsForSale: data.accruals_for_sale,
                saleCommission: data.sale_commission,
                amount: data.amount,
                type: data.type,
                postingNumber: data.posting?.posting_number ?? null,
                items: data.items as Prisma.InputJsonValue,
                services: data.services as Prisma.InputJsonValue,
            },
            update: {
                operationType: data.operation_type,
                operationDate: new Date(data.operation_date),
                operationTypeName: data.operation_type_name,
                deliveryCharge: data.delivery_charge,
                returnDeliveryCharge: data.return_delivery_charge,
                accrualsForSale: data.accruals_for_sale,
                saleCommission: data.sale_commission,
                amount: data.amount,
                type: data.type,
                postingNumber: data.posting?.posting_number ?? null,
                items: data.items as Prisma.InputJsonValue,
                services: data.services as Prisma.InputJsonValue,
            },
        });
    }

    async saveMany(data: ApiTransactionDto[]): Promise<Transaction[]> {
        return Promise.all(data.map(d => this.create(d)));
    }

    async lastRow(): Promise<Transaction | null> {
        return this.prismaClient.transaction.findFirst({
            orderBy: { operationDate: 'desc' },
        });
    }
}

