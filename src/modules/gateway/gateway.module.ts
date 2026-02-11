import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { KarmaSyncService } from './karma-sync.service';
import { AuthModule } from '../auth/auth.module';
import { redisProvider } from '../../database/redis.provider';

import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [AuthModule, DatabaseModule],
    providers: [AppGateway, KarmaSyncService, redisProvider],
    exports: [AppGateway],
})
export class GatewayModule { }
