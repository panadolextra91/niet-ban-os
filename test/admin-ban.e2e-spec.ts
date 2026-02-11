import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// Mock p-limit
jest.mock('p-limit', () => () => (fn: any) => fn());

import request from 'supertest';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/admin.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.provider';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { Reflector } from '@nestjs/core';

describe('Admin Ban Flow (e2e)', () => {
    let app: INestApplication;
    let jwtService: JwtService;

    const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
    };

    const mockUser = {
        idString: 'user-123',
        email: 'test@temple.com',
        role: 'MEMBER',
        isActive: true,
        rank: 'TU_TAI_GIA',
    };

    const mockAdmin = {
        idString: 'admin-999',
        email: 'tru-tri@temple.com',
        role: 'TRU_TRI',
        isActive: true,
        rank: 'BO_TAT',
    };

    const mockPrisma = {
        conNhang: {
            findUnique: jest.fn().mockImplementation((args) => {
                if (args.where.idString === mockUser.idString) return Promise.resolve(mockUser);
                if (args.where.idString === mockAdmin.idString) return Promise.resolve(mockAdmin);
                return Promise.resolve(null);
            }),
            update: jest.fn().mockImplementation((args) => {
                if (args.where.idString === mockUser.idString) {
                    mockUser.isActive = args.data.isActive;
                    return Promise.resolve(mockUser);
                }
                return Promise.resolve(args.data);
            }),
            aggregate: jest.fn().mockResolvedValue({ _sum: { totalDonated: 0 } }),
        },
    };

    const mockConfigService = {
        get: (key: string) => {
            if (key === 'JWT_SECRET') return 'test-secret';
            return null;
        }
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PassportModule,
                JwtModule.register({
                    secret: 'test-secret',
                    signOptions: { expiresIn: '1d' },
                }),
            ],
            controllers: [AdminController, UsersController],
            providers: [
                AdminService,
                UsersService,
                AuthService,
                JwtStrategy,
                JwtAuthGuard,
                RolesGuard,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: REDIS_CLIENT, useValue: mockRedis },
                { provide: ConfigService, useValue: mockConfigService },
                Reflector,
            ],
        })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        jwtService = moduleFixture.get<JwtService>(JwtService);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should ban user and invalidate cache', async () => {
        // 1. Generate Tokens
        const userToken = jwtService.sign({ sub: mockUser.idString, role: mockUser.role });
        const adminToken = jwtService.sign({ sub: mockAdmin.idString, role: mockAdmin.role });

        // 2. User calls Profile (Success)
        mockRedis.get.mockResolvedValueOnce(null);
        await request(app.getHttpServer())
            .get('/users/profile') // Use new protected route
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(mockRedis.set).toHaveBeenCalledWith(
            `user_profile:${mockUser.idString}`,
            expect.any(String),
            'EX',
            300
        );

        // 3. Admin Bans User
        await request(app.getHttpServer())
            .post(`/admin/users/${mockUser.idString}/ban`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(201);

        // 4. Verify Cache Invalidation
        expect(mockRedis.del).toHaveBeenCalledWith(`user_profile:${mockUser.idString}`);

        // 5. User calls Profile again (Fail 401)
        mockRedis.get.mockResolvedValueOnce(null);

        await request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(401);
    });
});
