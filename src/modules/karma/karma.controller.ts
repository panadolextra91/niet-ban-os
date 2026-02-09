import { Controller, Get, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KarmaService } from './karma.service';
import { KarmaLogResponseDto } from './dto/karma-log-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('karma')
@Controller('karma')
@UseInterceptors(ClassSerializerInterceptor)
export class KarmaController {
    constructor(private readonly karmaService: KarmaService) { }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Xem sổ Nam Tào (Lịch sử công đức)' })
    @ApiResponse({ type: [KarmaLogResponseDto] })
    async findByUser(@Param('userId') userId: string) {
        const logs = await this.karmaService.findByUser(userId);
        return plainToInstance(KarmaLogResponseDto, logs);
    }
}
