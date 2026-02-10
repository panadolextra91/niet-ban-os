import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.provider';

@Injectable()
export class KarmaSyncService {
    private readonly logger = new Logger(KarmaSyncService.name);
    private readonly BATCH_SIZE = 50; // Chunking size

    constructor(
        private prisma: PrismaService,
        @Inject(REDIS_CLIENT) private redis: Redis,
    ) { }

    @Cron('*/10 * * * * *') // Every 10 seconds
    async handleCron() {
        const activeSetKey = 'active_knockers';

        // 1. Get all active users
        const userIds = await this.redis.smembers(activeSetKey);
        if (!userIds.length) return;

        this.logger.log(`Starting sync for ${userIds.length} users...`);

        // 2. Process in chunks
        for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
            const chunk = userIds.slice(i, i + this.BATCH_SIZE);
            await this.processChunk(chunk);
        }

        // Optional: Cleanup set if needed (or just leave it, SMEMBERS is fast enough for moderate size)
        // await this.redis.del(activeSetKey); // DANGEROUS: Users might have added new knocks while we were processing.
        // Better: Only remove users we processed successfully (SREM), but that's another round trip.
        // For now, let's keep it simple. The set just acts as an index.
    }

    private async processChunk(userIds: string[]) {
        const updates: { userId: string; karma: number }[] = [];
        const pipeline = this.redis.pipeline();

        // 3. Atomic Fetch & Reset
        for (const userId of userIds) {
            pipeline.getset(`karma_buffer:${userId}`, '0');
        }

        const results = await pipeline.exec();

        // 4. Filter & Transform
        results?.forEach((result, index) => {
            const [err, value] = result as [Error | null, string | null];
            if (!err && value && value !== '0') {
                const id = userIds[index]; // Use chunk index, not userIds index
                updates.push({
                    userId: id,
                    karma: parseInt(value, 10),
                });
            }
        });

        if (!updates.length) return;

        // 5. Bulk Update DB
        try {
            // Prisma doesn't support bulk update with different values easily yet (except raw query).
            // We use Promise.all for simplicity and error isolation per user in this Phase.
            // For pure high-perf, we'd build a single UPDATE ... CASE ... query.

            const promises = updates.map(update =>
                this.prisma.conNhang.update({
                    where: { idString: update.userId },
                    data: {
                        currentKarma: { increment: update.karma },
                        // Also update totalDonated or other stats if needed? No, just karma for now.
                    },
                })
            );

            await Promise.all(promises);

            this.logger.log(`[KarmaSync] Synced ${updates.length} users in chunk. Total Karma added: ${updates.reduce((a, b) => a + b.karma, 0)}`);

            // 6. Cleanup Active Set (Remove processed users)
            // Only remove if they have 0 karma left in buffer? 
            // Actually, we can just remove them. If they knock again, they get re-added.
            await this.redis.srem('active_knockers', ...updates.map(u => u.userId));

        } catch (error) {
            this.logger.error('Error syncing karma chunk', error);
            // 7. Refund Logic (Critical)
            // If batch fails, we must restore. 
            // Since Promise.all fails fast (or we can use allSettled), simplistic refund:
            const refundPipeline = this.redis.pipeline();
            updates.forEach(update => {
                refundPipeline.incrby(`karma_buffer:${update.userId}`, update.karma);
            });
            await refundPipeline.exec();
            this.logger.warn(`Refunded karma for ${updates.length} users due to DB error.`);
        }
    }
}
