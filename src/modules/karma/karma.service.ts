import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class KarmaService {
    constructor(private prisma: PrismaService) { }

    async findByUser(userId: string) {
        return this.prisma.karmaLog.findMany({
            where: { conNhangId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
