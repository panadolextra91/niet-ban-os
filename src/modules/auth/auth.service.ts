import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { SystemRole } from '@prisma/client';

export interface JwtPayload {
    sub: string;
    email: string;
    role: SystemRole;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async generateToken(user: { idString: string; email: string; role: SystemRole }) {
        const payload: JwtPayload = {
            sub: user.idString,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
