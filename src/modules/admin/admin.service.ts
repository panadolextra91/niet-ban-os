import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
    ) { }

    async getDashboardStats() {
        const aggregate = await this.prisma.conNhang.aggregate({
            _sum: {
                totalDonated: true,
            },
        });

        return {
            totalDonated: aggregate._sum.totalDonated || 0,
        };
    }

    async banUser(userId: string) {
        const user = await this.prisma.conNhang.update({
            where: { idString: userId },
            data: { isActive: false },
        });

        // Invalidate Cache IMMEDIATELY
        await this.authService.invalidateUserProfile(userId);

        return user;
    }

    async unbanUser(userId: string) {
        const user = await this.prisma.conNhang.update({
            where: { idString: userId },
            data: { isActive: true },
        });

        // Invalidate Cache IMMEDIATELY
        await this.authService.invalidateUserProfile(userId);

        return user;
    }
}
