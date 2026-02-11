import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.provider';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { SystemRole } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('RefreshToken (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let jwtService: JwtService;

    // Test Data
    const testUser = {
        email: 'satthu@security.com',
        password: 'password123',
        phapDanh: 'Thích Bảo Mật',
        role: SystemRole.MEMBER,
    };
    let userId: string;
    let initialTokens: { accessToken: string; refreshToken: string; user: any };

    // Mock Redis
    const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn(),
        ttl: jest.fn().mockResolvedValue(60),
        on: jest.fn(),
        disconnect: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })
            .overrideProvider(REDIS_CLIENT).useValue(mockRedis)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);
        jwtService = moduleFixture.get<JwtService>(JwtService);

        // Cleanup
        await prisma.refreshToken.deleteMany();
        await prisma.conNhang.deleteMany({ where: { email: testUser.email } });

        // Create User
        const user = await prisma.conNhang.create({
            data: { ...testUser }
        });
        userId = user.idString;
    });

    afterAll(async () => {
        await prisma.refreshToken.deleteMany();
        await prisma.conNhang.deleteMany({ where: { email: testUser.email } });
        await app.close();
    });

    it('1. Login should return Access + Refresh Token Pair', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send(testUser)
            .expect(201);

        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe(testUser.email);

        initialTokens = res.body;

        // Verify DB
        const savedToken = await prisma.refreshToken.findUnique({
            where: { token: initialTokens.refreshToken }
        });
        expect(savedToken).toBeDefined();
        expect(savedToken.conNhangId).toBe(userId);
        expect(savedToken.familyId).toBeDefined();
        expect(savedToken.revoked).toBe(false);
    });

    it('2. Refresh should return New Pair & Rotate Old Token', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken: initialTokens.refreshToken })
            .expect(201);

        const newTokens = res.body;
        expect(newTokens.accessToken).toBeDefined();
        expect(newTokens.refreshToken).toBeDefined();
        expect(newTokens.refreshToken).not.toBe(initialTokens.refreshToken);

        // Verify Old Token is Revoked & Replaced
        const oldTokenDoc = await prisma.refreshToken.findUnique({
            where: { token: initialTokens.refreshToken }
        });
        expect(oldTokenDoc.revoked).toBe(true);
        expect(oldTokenDoc.replacedByToken).toBe(newTokens.refreshToken);

        // Verify New Token is same Family
        const newTokenDoc = await prisma.refreshToken.findUnique({
            where: { token: newTokens.refreshToken }
        });
        expect(newTokenDoc.familyId).toBe(oldTokenDoc.familyId);
        expect(newTokenDoc.revoked).toBe(false);

        // Update current valid token
        initialTokens = { ...newTokens, user: initialTokens.user };
    });

    it('3. SÁT THỦ: Reuse Old Token -> Nuclear Option (Revoke Family)', async () => {
        // Get the ORIGINAL old token (the first one)
        const revokedToken = await prisma.refreshToken.findFirst({
            where: { conNhangId: userId, revoked: true }
        });

        expect(revokedToken).toBeDefined();

        // Attempt verify -> Should fail with 401/403 (UnauthorizedException in my code maps to 401)
        await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken: revokedToken.token })
            .expect(401);

        // VERIFY NUCLEAR OPTION
        // 1. All tokens in family should be revoked
        const allTokens = await prisma.refreshToken.findMany({
            where: { familyId: revokedToken.familyId }
        });
        expect(allTokens.length).toBeGreaterThan(1);
        allTokens.forEach(t => {
            expect(t.revoked).toBe(true);
        });

        // 2. User Profile Cache should be invalidated
        expect(mockRedis.del).toHaveBeenCalledWith(`user_profile:${userId}`);

        console.log('☢️ Nuclear Option Verified: Family Revoked & Cache Cleared!');
    });
});
