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
    DatabaseModule,
    PracticeModule,
    TempleModule,
    UsersModule,
    DonationsModule,
    BookingsModule,
    KarmaModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
