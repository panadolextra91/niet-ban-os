import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, slotTime: Date, isFastTrack = false, isPrivateRoom = false) {
        return this.prisma.booking.create({
            data: {
                conNhangId: userId,
                slotTime,
                isFastTrack,
                isPrivateRoom,
            },
        });
    }

    async findByUser(userId: string) {
        return this.prisma.booking.findMany({
            where: { conNhangId: userId },
            orderBy: { slotTime: 'asc' },
        });
    }
}
