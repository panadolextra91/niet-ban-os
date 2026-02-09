import { Module } from '@nestjs/common';
import { TempleController } from './temple.controller';
import { TempleService } from './temple.service';

@Module({
    controllers: [TempleController],
    providers: [TempleService],
})
export class TempleModule { }
