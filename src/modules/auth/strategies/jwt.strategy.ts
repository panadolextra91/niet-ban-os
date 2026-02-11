import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
        });
    }

    async validate(payload: JwtPayload) {
        // 1. Get user from Cache (or DB if miss)
        const user = await this.authService.getUserProfile(payload.sub);

        // 2. Check existence
        if (!user) {
            throw new UnauthorizedException('Thí chủ không tồn tại (Token rác)');
        }

        // 3. Check Active Status
        if (!user.isActive) {
            throw new UnauthorizedException('Mô phật! Thí chủ đã bị trục xuất khỏi chùa. Vui lòng sám hối!');
        }

        // 4. Return user info
        return {
            userId: user.idString,
            email: user.email,
            role: user.role,
        };
    }
}
