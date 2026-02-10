import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { KarmaSource, Prisma } from '@prisma/client';
import { KarmaLogMetadata } from '../../common/interfaces/karma-metadata.interface';

@Injectable()
export class KarmaService {
    constructor(private prisma: PrismaService) { }

    /**
     * Adjust Karma points atomically (Sát na biến chuyển công đức)
     */
    async adjustKarma(
        userId: string,
        amount: number,
        source: KarmaSource,
        metadata?: KarmaLogMetadata,
    ) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Log first
            await tx.karmaLog.create({
                data: {
                    conNhangId: userId,
                    amount,
                    source,
                    metadata: metadata as Prisma.InputJsonValue,
                },
            });

            // 2. Update User Karma atomically
            return tx.conNhang.update({
                where: { idString: userId },
                data: {
                    currentKarma: {
                        increment: amount,
                    },
                },
            });
        });
    }

    async findByUser(userId: string) {
        return this.prisma.karmaLog.findMany({
            where: { conNhangId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
