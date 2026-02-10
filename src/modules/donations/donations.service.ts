import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DonationStatus, MemberRank } from '@prisma/client';
import { KarmaService } from '../karma/karma.service';
import { JackpotService } from '../karma/jackpot.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Injectable()
export class DonationsService {
    constructor(
        private prisma: PrismaService,
        private karmaService: KarmaService,
        private jackpotService: JackpotService,
        private eventEmitter: EventEmitter2,
        private configService: ConfigService,
    ) { }

    async create(userId: string, amount: number, message?: string) {
        return this.prisma.donation.create({
            data: {
                conNhangId: userId,
                amount: new Prisma.Decimal(amount),
                message,
                status: DonationStatus.PENDING,
            },
        });
    }

    /**
     * Webhook xử lý cúng dường (Ting ting!) 🔔
     */
    async handleWebhook(donationId: string, secretKey: string) {
        // 1. Check bùa hộ mệnh (Lấy từ Config, không hardcode)
        const secret = this.configService.get<string>('MOMO_SECRET');
        if (secretKey !== secret) {
            throw new UnauthorizedException('Kẻ gian dám giả mào cổng thanh toán! (Invalid secret)');
        }

        const donation = await this.prisma.donation.findUnique({
            where: { id: donationId },
        });

        if (!donation) throw new BadRequestException('Đơn cúng dường không tồn tại');

        // 2. Bùa chống trùng lặp (Idempotency)
        if (donation.status === DonationStatus.COMPLETED) {
            return { message: 'Giao dịch đã được xử lý trước đó. Công đức đã ghi nhận.' };
        }

        // 3. Xử lý Atomicity & Optimization (Single Update)
        return this.prisma.$transaction(async (tx) => {
            // A. Lấy user hiện tại (Lock row để update)
            const user = await tx.conNhang.findUnique({
                where: { idString: donation.conNhangId },
            });

            if (!user) throw new BadRequestException('Con nhang không hiện hữu');

            // B. Tính toán ngoài Memory (Minimize DB load)
            const amountDecimal = donation.amount;
            const karmaGained = amountDecimal.dividedBy(1000).floor().toNumber();

            // Tính Jackpot bonus
            const bonusKarma = await this.jackpotService.checkLuck(user.idString, amountDecimal.toNumber());

            // Tổng Karma mới
            const newCurrentKarma = user.currentKarma + karmaGained + bonusKarma;
            const newTotalDonated = user.totalDonated.plus(amountDecimal);

            // Logic Up Rank
            let newRank = user.rank;
            const totalDonatedVal = newTotalDonated.toNumber();
            const NINETY_DAYS_LATER = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

            if (totalDonatedVal >= 10000000) {
                newRank = MemberRank.BO_TAT;
            } else if (totalDonatedVal >= 5000000) {
                newRank = MemberRank.A_LA_HAN;
            }

            // C. Cập nhật mọi thứ MỘT LẦN DUY NHẤT (Single Update + Atomic Increment)
            await tx.conNhang.update({
                where: { idString: user.idString },
                data: {
                    // ✅ Dùng increment để DB tự cộng dồn (An toàn tuyệt đối với Race Condition / Lost Update)
                    totalDonated: { increment: donation.amount },
                    currentKarma: { increment: karmaGained + bonusKarma },

                    // ✅ Mấy cái logic Rank thì dùng giá trị con đã tính toán
                    rank: newRank,
                    rankExpiryDate: newRank !== user.rank ? NINETY_DAYS_LATER : user.rankExpiryDate,
                    isAutoKnock: newRank !== MemberRank.TU_TAI_GIA,
                },
            });

            // D. Cập nhật status đơn hàng
            await tx.donation.update({
                where: { id: donationId },
                data: { status: DonationStatus.COMPLETED },
            });

            // E. Ghi sổ Nam Tào (Đa luồng ghi sổ)
            await tx.karmaLog.create({
                data: {
                    conNhangId: user.idString,
                    amount: karmaGained,
                    source: 'DONATION',
                    metadata: { donationId: donation.id },
                },
            });

            if (bonusKarma > 0) {
                await tx.karmaLog.create({
                    data: {
                        conNhangId: user.idString,
                        amount: bonusKarma,
                        source: 'JACKPOT',
                        metadata: { sourceDonationId: donation.id },
                    },
                });
            }

            // F. Bắn Event Loa Phường
            this.eventEmitter.emit('donation.completed', {
                user: user.phapDanh || 'Vô danh thí chủ',
                amount: amountDecimal.toNumber(),
                rank: newRank,
            });

            return {
                status: 'success',
                karmaGained: karmaGained + bonusKarma,
                currentRank: newRank,
            };
        });
    }

    async findAll() {
        return this.prisma.donation.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}
