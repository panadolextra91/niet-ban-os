import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TempleService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return { message: 'Find all temples' };
    }
}
