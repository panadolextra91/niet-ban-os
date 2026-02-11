import { Test, TestingModule } from '@nestjs/testing';
// Mock p-limit to resolve ESM issue in Jest
jest.mock('p-limit', () => () => (fn: any) => fn());

import { KarmaSyncService } from './karma-sync.service';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.provider';

describe('KarmaSyncService', () => {
    let service: KarmaSyncService;
    let prisma: PrismaService;
    let redis: any;

    const mockPrisma = {
        conNhang: {
            update: jest.fn(),
        },
    };

    const mockPipeline = {
        getset: jest.fn().mockReturnThis(),
        incrby: jest.fn().mockReturnThis(),
        exec: jest.fn(),
    };

    const mockRedis = {
        set: jest.fn(),
        del: jest.fn(),
        smembers: jest.fn(),
        srem: jest.fn(),
        pipeline: jest.fn().mockReturnValue(mockPipeline),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KarmaSyncService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: REDIS_CLIENT, useValue: mockRedis },
            ],
        }).compile();

        service = module.get<KarmaSyncService>(KarmaSyncService);
        prisma = module.get<PrismaService>(PrismaService);
        redis = module.get(REDIS_CLIENT);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('handleCron', () => {
        it('should skip sync if lock is already acquired (Redlock)', async () => {
            // Mock Redis SET to return null (Lock failed)
            mockRedis.set.mockResolvedValue(null);

            await service.handleCron();

            expect(mockRedis.set).toHaveBeenCalledWith(
                'lock:karma_sync',
                'locked',
                'EX',
                9,
                'NX',
            );
            expect(mockRedis.smembers).not.toHaveBeenCalled(); // Should stop here
        });

        it('should proceed if lock is acquired', async () => {
            mockRedis.set.mockResolvedValue('OK');
            mockRedis.smembers.mockResolvedValue([]); // No users to sync

            await service.handleCron();

            expect(mockRedis.set).toHaveBeenCalled();
            expect(mockRedis.smembers).toHaveBeenCalledWith('active_knockers');
            expect(mockRedis.del).toHaveBeenCalledWith('lock:karma_sync'); // Lock released
        });
    });

    describe('processChunk', () => {
        it('should sync karma successfully', async () => {
            const userIds = ['user1', 'user2'];

            // 1. Mock GETSET pipeline
            mockPipeline.exec.mockResolvedValue([
                [null, '10'], // user1 has 10 karma
                [null, '20'], // user2 has 20 karma
            ]);

            // 2. Mock Prisma Update
            mockPrisma.conNhang.update.mockResolvedValue({});

            // 3. Call processChunk (private method, accessible via any cast or testing strategy)
            // Since it's private and called by handleCron via p-limit, we can test handleCron with data
            // Or cast to any to call directly for unit testing
            await (service as any).processChunk(userIds);

            // Verify Pipeline GETSET
            expect(mockPipeline.getset).toHaveBeenCalledTimes(2);

            // Verify Prisma Update
            expect(mockPrisma.conNhang.update).toHaveBeenCalledTimes(2);
            expect(mockPrisma.conNhang.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { idString: 'user1' },
                data: { currentKarma: { increment: 10 } }
            }));

            // Verify Cleanup
            expect(mockRedis.srem).toHaveBeenCalledWith('active_knockers', 'user1', 'user2');
        });

        it('should refund karma if DB update fails', async () => {
            const userIds = ['user1'];

            // 1. Mock GETSET
            mockPipeline.exec.mockResolvedValueOnce([
                [null, '50']
            ]);

            // 2. Mock Prisma Error
            mockPrisma.conNhang.update.mockRejectedValue(new Error('DB Error'));

            // 3. Mock Refund Pipeline
            mockPipeline.exec.mockResolvedValueOnce([]); // Result of refund exec

            await (service as any).processChunk(userIds);

            // Verify Prisma called
            expect(mockPrisma.conNhang.update).toHaveBeenCalled();

            // Verify Refund Pipeline
            // Note: pipeline() is called twice (1 for getset, 1 for refund)
            expect(mockRedis.pipeline).toHaveBeenCalledTimes(2);
            expect(mockPipeline.incrby).toHaveBeenCalledWith('karma_buffer:user1', 50);
        });
    });
});
