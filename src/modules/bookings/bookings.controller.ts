import { Controller, Get, Post, Body, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('bookings')
@Controller('bookings')
@UseInterceptors(ClassSerializerInterceptor)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    @ApiOperation({ summary: 'Đặt lịch khóa tu (Pay-to-Win)' })
    @ApiResponse({ type: BookingResponseDto })
    async create(@Body() body: { userId: string; slotTime: string; isFastTrack?: boolean; isPrivateRoom?: boolean }) {
        const booking = await this.bookingsService.create(
            body.userId,
            new Date(body.slotTime),
            body.isFastTrack,
            body.isPrivateRoom,
        );
        return plainToInstance(BookingResponseDto, booking);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Lấy lịch sử đặt chỗ của con nhang' })
    @ApiResponse({ type: [BookingResponseDto] })
    async findByUser(@Param('userId') userId: string) {
        const bookings = await this.bookingsService.findByUser(userId);
        return plainToInstance(BookingResponseDto, bookings);
    }
}
