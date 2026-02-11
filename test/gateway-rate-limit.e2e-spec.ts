import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket as ClientSocket, io } from 'socket.io-client';
// Mock p-limit
jest.mock('p-limit', () => () => (fn: any) => fn());

// Modules
import { AppGateway } from '../src/modules/gateway/app.gateway';
import { AuthService } from '../src/modules/auth/auth.service';
import { WsJwtGuard } from '../src/modules/auth/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { REDIS_CLIENT } from '../src/database/redis.provider';
import { ConfigService } from '@nestjs/config';

describe('Gateway Rate Limit (e2e)', () => {
    let app: INestApplication;
    let clientSocket: ClientSocket;

    // Mock Redis with INCR logic
    let redisCounter = new Map<string, number>();
    const mockRedis = {
        incr: jest.fn().mockImplementation((key) => {
            const val = (redisCounter.get(key) || 0) + 1;
            redisCounter.set(key, val);
            return Promise.resolve(val);
        }),
        expire: jest.fn().mockResolvedValue(1),
        pipeline: jest.fn().mockReturnValue({
            incr: jest.fn().mockReturnThis(),
            sadd: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([]),
        }),
        on: jest.fn(),
        disconnect: jest.fn(),
    };

    const mockConfigService = {
        get: (key: string) => {
            if (key === 'JWT_SECRET') return 'test-gateway-secret';
            return null;
        }
    };

    const mockAuthService = {
        verifyToken: jest.fn().mockResolvedValue({ sub: 'spammer-123', email: 'spam@temple.com' }),
        getUserProfile: jest.fn().mockResolvedValue({ idString: 'spammer-123', isActive: true }),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            providers: [
                AppGateway,
                { provide: AuthService, useValue: mockAuthService },
                { provide: JwtService, useValue: { sign: () => 'valid.jwt.token' } },
                { provide: REDIS_CLIENT, useValue: mockRedis },
                { provide: ConfigService, useValue: mockConfigService },
                WsJwtGuard,
            ],
        })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.listen(0);
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    afterEach(() => {
        redisCounter.clear();
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('should emit chill_thoi_thi_chu when knocking too fast (>10/s)', (done) => {
        const port = app.getHttpServer().address().port;

        clientSocket = io(`http://localhost:${port}/temple`, {
            auth: { token: `Bearer valid.jwt.token` },
            transports: ['websocket'],
            reconnection: false,
            forceNew: true,
        });

        clientSocket.on('connect', async () => {
            // Spam 15 times
            for (let i = 0; i < 15; i++) {
                clientSocket.emit('knock_mo');
            }
        });

        // Use once to avoid multiple done calls
        clientSocket.once('chill_thoi_thi_chu', (data) => {
            try {
                expect(data.message).toContain('Mô phật');
                expect(mockRedis.incr).toHaveBeenCalled();
                done();
            } catch (err) {
                done(err);
            }
        });

        clientSocket.on('connect_error', (err) => {
            done(err);
        });
    }, 10000);
});
