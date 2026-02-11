import { Controller, Get, Post, Param, UseInterceptors, ClassSerializerInterceptor, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin cá nhân (Protected)' })
    async getProfile(@Request() req) {
        // req.user is set by JwtStrategy
        const user = await this.usersService.findOne(req.user.userId);
        return plainToInstance(UserResponseDto, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin con nhang' })
    @ApiResponse({ type: UserResponseDto })
    async getUser(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return plainToInstance(UserResponseDto, user);
    }

    @Post(':id/knock')
    @ApiOperation({ summary: 'Gõ mõ tích công đức (Manual Knock)' })
    @ApiResponse({ type: UserResponseDto })
    async knock(@Param('id') id: string) {
        const user = await this.usersService.knock(id);
        return plainToInstance(UserResponseDto, user);
    }
}
