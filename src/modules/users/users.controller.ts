import { Controller, Get, Post, Param, UseInterceptors, ClassSerializerInterceptor, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin cá nhân (Protected)' })
    async getProfile(@Request() req: any) {
        // req.user is set by JwtStrategy
        const user = await this.usersService.findOne(req.user.userId);
        return plainToInstance(UserResponseDto, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin con nhang' })
    @ApiResponse({ type: UserResponseDto })
    async getUser(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        if (!user) return null;

        // Manual mapping to bypass class-transformer Decimal serialization bugs
        const res = new UserResponseDto();
        res.idString = user.idString;
        res.email = user.email;
        res.phapDanh = user.phapDanh || undefined;
        res.rank = user.rank;
        res.rankExpiryDate = user.rankExpiryDate || undefined;
        res.currentKarma = user.currentKarma;
        res.isAutoKnock = user.isAutoKnock;
        res.createdAt = user.createdAt;

        // Safe Decimal conversion
        res.totalDonated = user.totalDonated ? Number(user.totalDonated.toString()) : 0;

        return res;
    }

    @Post(':id/knock')
    @ApiOperation({ summary: 'Gõ mõ tích công đức (Manual Knock)' })
    @ApiResponse({ type: UserResponseDto })
    async knock(@Param('id') id: string) {
        const user = await this.usersService.knock(id);
        return plainToInstance(UserResponseDto, user);
    }

    @Post('mock-donate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cúng dường (Mock)' })
    async mockDonate(@Request() req: any, @Body() data: { amount: number }) {
        const userId = req.user.userId;
        const amount = Number(data.amount) || 100000;

        console.log(`[UsersController] Processing donation for ${req.user.email}: ${amount}`);
        const user = await this.usersService.mockDonate(userId, amount);

        // This will be caught by AppGateway handleDonationCompleted
        console.log(`[UsersController] Emitting donation.completed for ${req.user.email}`);
        this.eventEmitter.emit('donation.completed', {
            email: req.user.email,
            amount: amount,
        });

        // Manual mapping to bypass class-transformer Decimal bugs
        const res = new UserResponseDto();
        res.idString = user.idString;
        res.email = user.email;
        res.phapDanh = user.phapDanh || undefined;
        res.rank = user.rank;
        res.rankExpiryDate = user.rankExpiryDate || undefined;
        res.currentKarma = user.currentKarma;
        res.isAutoKnock = user.isAutoKnock;
        res.createdAt = user.createdAt;
        res.totalDonated = user.totalDonated ? Number(user.totalDonated.toString()) : 0;

        return res;
    }
}
