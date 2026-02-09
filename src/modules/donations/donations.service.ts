import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DonationStatus } from '@prisma/client';

@Injectable()
export class DonationsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, amount: number, message?: string) {
        return this.prisma.$transaction(async (tx) => {
            const donation = await tx.donation.create({
                data: {
                    conNhangId: userId,
                    amount,
                    message,
                    status: DonationStatus.COMPLETED, // Giả sử hoàn tất ngay trong prototype
                },
            });

            // Update Karma: 1000 VND = 1 Karma point (Ví dụ)
            const karmaGained = Math.floor(amount / 1000);

            await tx.conNhang.update({
                where: { idString: userId },
                data: {
                    currentKarma: { increment: karmaGained },
                    totalDonated: { increment: amount },
                },
            });

            await tx.karmaLog.create({
                data: {
                    conNhangId: userId,
                    amount: karmaGained,
                    source: 'DONATION',
                    metadata: { donationId: donation.id },
                },
            });

            return donation;
        });
    }

    async findAll() {
        return this.prisma.donation.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}
