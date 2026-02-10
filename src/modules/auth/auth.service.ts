import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { SystemRole } from '@prisma/client';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.provider';

export interface JwtPayload {
    sub: string;
    email: string;
    role: SystemRole;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        @Inject(REDIS_CLIENT) private redis: Redis,
    ) { }

    async generateToken(user: { idString: string; email: string; role: SystemRole }) {
        const payload: JwtPayload = {
            sub: user.idString,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async verifyToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verify(token);
    }

    async getUserProfile(userId: string) {
        const cacheKey = `user_profile:${userId}`;
        // 1. Try Cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // 2. Query DB
        const user = await this.prisma.conNhang.findUnique({
            where: { idString: userId },
            select: { idString: true, email: true, role: true, isActive: true },
        });

        if (user) {
            // 3. Set Cache (TTL 5 mins)
            await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
        }

        return user;
    }

    async invalidateUserProfile(userId: string) {
        const cacheKey = `user_profile:${userId}`;
        await this.redis.del(cacheKey);
    }
}
