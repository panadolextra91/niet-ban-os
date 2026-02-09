import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { PracticeGateway } from './practice.gateway';

@Module({
    controllers: [PracticeController],
    providers: [PracticeService, PracticeGateway],
})
export class PracticeModule { }
