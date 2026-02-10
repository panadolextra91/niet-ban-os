import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.provider';
import pLimit from 'p-limit';

@Injectable()
export class KarmaSyncService {
  private readonly logger = new Logger(KarmaSyncService.name);
  private readonly BATCH_SIZE = 50;
  private readonly LOCK_KEY = 'lock:karma_sync';
  private readonly LOCK_TTL = 9; // Slightly less than cron interval (10s)

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) { }

  @Cron('*/10 * * * * *')
  async handleCron() {
    // 1. Redlock: Try to acquire lock
    // SET lock key only if not exists (NX) with expiration (EX)
    const acquired = await this.redis.set(this.LOCK_KEY, 'locked', 'NX', 'EX', this.LOCK_TTL);
    if (!acquired) {
      this.logger.debug('Skipping sync: Lock already acquired.');
      return;
    }

    const startTime = Date.now();
    try {
      const activeSetKey = 'active_knockers';
      const userIds = await this.redis.smembers(activeSetKey);

      if (!userIds.length) return;

      this.logger.log(`Starting sync for ${userIds.length} users...`);

      // 2. Prepare chunks
      const chunks = [];
      for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
        chunks.push(userIds.slice(i, i + this.BATCH_SIZE));
      }

      // 3. Parallel Processing with p-limit
      const limit = pLimit(5); // Process 5 chunks concurrently
      await Promise.all(chunks.map(chunk => limit(() => this.processChunk(chunk))));

    } catch (err) {
      this.logger.error('Sync Job Failed', err);
    } finally {
      // 4. Release Lock
      await this.redis.del(this.LOCK_KEY);
      const duration = Date.now() - startTime;
      this.logger.log(`[KarmaSync] Job finished in ${duration}ms`);
    }
  }

  private async processChunk(userIds: string[]) {
    const updates: { userId: string; karma: number }[] = [];
    const pipeline = this.redis.pipeline();

    // 3. Atomic Fetch & Reset
    for (const userId of userIds) {
      // Fixed key spacing to match AppGateway
      pipeline.getset(`karma_buffer:${userId}`, '0');
    }

    const results = await pipeline.exec();

    // 4. Filter & Transform
    results?.forEach((result, index) => {
      const [err, value] = result as [Error | null, string | null];
      if (!err && value && value !== '0') {
        const id = userIds[index];
        updates.push({
          userId: id,
          karma: parseInt(value, 10),
        });
      }
    });

    if (!updates.length) return;

    // 5. Bulk Update DB
    try {
      const promises = updates.map(update =>
        this.prisma.conNhang.update({
          where: { idString: update.userId },
          data: {
            currentKarma: { increment: update.karma },
            totalDonated: update.karma > 0 ? undefined : undefined,
          },
        })
      );

      await Promise.all(promises);

      this.logger.log(`[KarmaSync] Synced chunk of ${updates.length} users.`);

      // 6. Cleanup Active Set (Remove processed users)
      await this.redis.srem('active_knockers', ...updates.map(u => u.userId));

    } catch (error) {
      this.logger.error('Error syncing karma chunk', error);
      // 7. Refund Logic (Critical)
      const refundPipeline = this.redis.pipeline();
      updates.forEach(update => {
        // Fixed key spacing here too
        refundPipeline.incrby(`karma_buffer:${update.userId}`, update.karma);
      });
      await refundPipeline.exec();
      this.logger.warn(`Refunded karma for ${updates.length} users due to DB error.`);
    }
  }
}
