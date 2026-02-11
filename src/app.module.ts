import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { PracticeModule } from './modules/practice/practice.module';
import { TempleModule } from './modules/temple/temple.module';
import { UsersModule } from './modules/users/users.module';
import { DonationsModule } from './modules/donations/donations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { KarmaModule } from './modules/karma/karma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ScheduleModule } from '@nestjs/schedule';

import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';
import { REDIS_CLIENT } from './database/redis.provider';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [{
          ttl: 60000,
          limit: 100, // Global limit (loose)
        }],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    LoggerModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    PracticeModule,
    TempleModule,
    UsersModule,
    DonationsModule,
    BookingsModule,
    KarmaModule,
    AuthModule,
    AdminModule,
    GatewayModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    }
  ],
})
export class AppModule { }
