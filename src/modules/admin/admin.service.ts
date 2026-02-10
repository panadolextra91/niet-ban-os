import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

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
}
