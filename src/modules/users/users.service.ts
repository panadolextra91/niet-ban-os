import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MemberRank } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        return this.prisma.conNhang.findUnique({
            where: { idString: id },
        });
    }

    /**
     * AFK Farming Logic (Gõ Mõ)
     */
    async knock(userId: string) {
        const user = await this.prisma.conNhang.findUnique({
            where: { idString: userId },
        });

        if (!user) throw new BadRequestException('Con nhang không tồn tại');

        const now = new Date();
        const COOLDOWN_MS = 1000; // 1 giây chống spam

        if (user.lastKnockTime && now.getTime() - user.lastKnockTime.getTime() < COOLDOWN_MS) {
            throw new BadRequestException('Mẹ dạy gõ mõ phải từ bi, đừng gõ nhanh quá (Spam detected)');
        }

        const karmaGained = 1;

        return this.prisma.$transaction(async (tx) => {
            // Create karma log (Sổ Nam Tào)
            await tx.karmaLog.create({
                data: {
                    conNhangId: userId,
                    amount: karmaGained,
                    source: 'AFK_FARMING',
                    metadata: { method: 'manual_knock' },
                },
            });

            // Update user karma
            return tx.conNhang.update({
                where: { idString: userId },
                data: {
                    currentKarma: { increment: karmaGained },
                    lastKnockTime: now,
                },
            });
        });
    }

    /**
     * Membership Logic: Check rank expiry and update status
     */
    async checkRankStatus(userId: string) {
        const user = await this.prisma.conNhang.findUnique({
            where: { idString: userId },
        });

        if (!user) return null;

        if (user.rank !== MemberRank.TU_TAI_GIA && user.rankExpiryDate && user.rankExpiryDate < new Date()) {
            // Rank expired, return to TU_TAI_GIA
            return this.prisma.conNhang.update({
                where: { idString: userId },
                data: {
                    rank: MemberRank.TU_TAI_GIA,
                    isAutoKnock: false,
                },
            });
        }
        return user;
    }
}
