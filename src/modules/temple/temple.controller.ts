import { Controller, Get } from '@nestjs/common';
import { TempleService } from './temple.service';

@Controller('temples')
export class TempleController {
    constructor(private readonly templeService: TempleService) { }

    @Get()
    findAll() {
        return this.templeService.findAll();
    }
}
