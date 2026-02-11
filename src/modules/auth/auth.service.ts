import { v4 as uuidv4 } from 'uuid';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
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

import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        @Inject(REDIS_CLIENT) private redis: Redis,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.conNhang.findUnique({ where: { email } });
        if (user && await argon2.verify(user.password, pass)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const familyId = uuidv4();
        const tokens = await this.generateTokens({
            idString: user.idString,
            email: user.email,
            role: user.role as SystemRole,
            familyId
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await this.saveRefreshToken(user.idString, tokens.refreshToken, familyId, expiresAt);

        return {
            ...tokens,
            user: {
                id: user.idString,
                email: user.email,
                role: user.role,
                rank: user.rank,
            }
        };
    }

    async register(data: any) {
        const hashedPassword = await argon2.hash(data.password);
        const user = await this.prisma.conNhang.create({
            data: {
                email: data.email,
                password: hashedPassword,
                phapDanh: data.phapDanh,
                role: SystemRole.MEMBER, // Default role for new signups
                phoneNumber: data.phoneNumber,
            }
        });
        return this.login(user);
    }

    async generateTokens(user: { idString: string; email: string; role: SystemRole; familyId?: string }) {
        const payload = {
            sub: user.idString,
            email: user.email,
            role: user.role,
            jti: uuidv4(),
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return { accessToken, refreshToken };
    }

    async saveRefreshToken(userId: string, token: string, familyId: string, expiresAt: Date) {
        await this.prisma.refreshToken.create({
            data: {
                token,
                conNhangId: userId,
                familyId,
                expiresAt,
            }
        });
    }

    async rotateRefreshToken(oldToken: string) {
        const tokenDoc = await this.prisma.refreshToken.findUnique({ where: { token: oldToken } });
        if (!tokenDoc) {
            throw new UnauthorizedException('Invalid token');
        }

        if (tokenDoc.revoked) {
            await this.prisma.refreshToken.updateMany({
                where: { familyId: tokenDoc.familyId },
                data: { revoked: true }
            });
            await this.invalidateUserProfile(tokenDoc.conNhangId);
            throw new UnauthorizedException('Reuse detected! Family revoked.');
        }

        if (new Date() > tokenDoc.expiresAt) {
            throw new UnauthorizedException('Token expired');
        }

        const user = await this.prisma.conNhang.findUnique({ where: { idString: tokenDoc.conNhangId } });
        if (!user) throw new UnauthorizedException('User not found');

        const tokens = await this.generateTokens({
            idString: user.idString,
            email: user.email,
            role: user.role as SystemRole
        });

        await this.prisma.refreshToken.update({
            where: { id: tokenDoc.id },
            data: { revoked: true, replacedByToken: tokens.refreshToken }
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.saveRefreshToken(user.idString, tokens.refreshToken, tokenDoc.familyId, expiresAt);

        return tokens;
    }

    async verifyToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verify(token);
    }

    async getUserProfile(userId: string) {
        const cacheKey = `user_profile:${userId}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const user = await this.prisma.conNhang.findUnique({
            where: { idString: userId },
            select: { idString: true, email: true, role: true, isActive: true },
        });

        if (user) {
            await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
        }

        return user;
    }

    async invalidateUserProfile(userId: string) {
        const cacheKey = `user_profile:${userId}`;
        await this.redis.del(cacheKey);
    }
}
