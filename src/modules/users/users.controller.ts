import { Controller, Get, Post, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
