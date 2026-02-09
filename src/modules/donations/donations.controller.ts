import { Controller, Get, Post, Body, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { DonationResponseDto } from './dto/donation-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('donations')
@Controller('donations')
@UseInterceptors(ClassSerializerInterceptor)
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post()
    @ApiOperation({ summary: 'Thực hiện cúng dường (Donation)' })
    @ApiResponse({ type: DonationResponseDto })
    async create(@Body() body: { userId: string; amount: number; message?: string }) {
        const donation = await this.donationsService.create(body.userId, body.amount, body.message);
        return plainToInstance(DonationResponseDto, donation);
    }

    @Get()
    @ApiOperation({ summary: 'Lịch sử cúng dường' })
    @ApiResponse({ type: [DonationResponseDto] })
    async findAll() {
        const donations = await this.donationsService.findAll();
        return plainToInstance(DonationResponseDto, donations);
    }
}
