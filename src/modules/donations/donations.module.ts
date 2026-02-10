import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { KarmaModule } from '../karma/karma.module';

@Module({
    imports: [KarmaModule],
    controllers: [DonationsController],
    providers: [DonationsService],
    exports: [DonationsService],
})
export class DonationsModule { }
