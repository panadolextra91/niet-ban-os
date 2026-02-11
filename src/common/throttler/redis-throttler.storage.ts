import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
    constructor(private readonly redis: Redis) { }

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        const redisKey = `throttle:${key}`;

        // Use Multi/Exec for atomicity if needed, but simple INCR EXPIRE is simpler
        // Using Lua script is best for atomicity but let's keep it simple for now or use pipeline

        // 1. Increment
        const totalHits = await this.redis.incr(redisKey);

        // 2. Set Expiry if first hit
        if (totalHits === 1) {
            await this.redis.expire(redisKey, Math.ceil(ttl / 1000));
        }

        // 3. Get TTL
        const timeToExpire = await this.redis.ttl(redisKey);

        // 4. Calculate Block
        const isBlocked = totalHits > limit;
        const timeToBlock = isBlocked ? Math.ceil(blockDuration / 1000) : 0; // Simplified block logic

        return {
            totalHits,
            timeToExpire: timeToExpire > 0 ? timeToExpire : 0,
            isBlocked,
            timeToBlock,
        };
    }
}
