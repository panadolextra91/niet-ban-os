import { Module } from '@nestjs/common';
import { KarmaController } from './karma.controller';
import { KarmaService } from './karma.service';
import { JackpotService } from './jackpot.service';

@Module({
    controllers: [KarmaController],
    providers: [KarmaService, JackpotService],
    exports: [KarmaService, JackpotService],
})
export class KarmaModule { }
