import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Đăng nhập (Issue Pair Tokens)' })
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @ApiOperation({ summary: 'Đăng ký (Cạo đầu quy y)' })
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @Post('refresh')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Làm mới Token (Rotation)' })
    async refresh(@Body() body: RefreshTokenDto) {
        return this.authService.rotateRefreshToken(body.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đăng xuất (Revoke Refresh Token)' })
    async logout(@Request() req: any) {
        return { message: "Logout successful" };
    }
}
