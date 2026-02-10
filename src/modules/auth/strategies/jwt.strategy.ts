import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service'; // Import Prisma Correctly
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService, // Inject Prisma
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-if-missing',
        });
    }

    async validate(payload: JwtPayload) {
        // 1. Query nhẹ cái user lên
        const user = await this.prisma.conNhang.findUnique({
            where: { idString: payload.sub },
            select: { idString: true, email: true, role: true, isActive: true } // Select ít thôi cho nhẹ
        });

        // 2. Check xem user còn tồn tại không
        if (!user) {
            throw new UnauthorizedException('Thí chủ không tồn tại (Token rác)');
        }

        // 3. CHECK CỰC MẠNH: Bị trục xuất chưa?
        if (!user.isActive) {
            throw new UnauthorizedException('Mô phật! Thí chủ đã bị trục xuất khỏi chùa. Vui lòng sám hối!');
        }

        // 4. Trả về user info mới nhất (lỡ role có thay đổi thì update luôn)
        return {
            userId: user.idString,
            email: user.email,
            role: user.role, // Lấy role từ DB luôn cho chắc, lỡ vừa bị giáng chức
        };
    }
}
