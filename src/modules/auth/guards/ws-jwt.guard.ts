import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = client.handshake.auth.token || client.handshake.headers.authorization;

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            // Clean token if Bearer prefix exists
            const jwt = token.replace('Bearer ', '');
            const payload = await this.authService.verifyToken(jwt);

            // IMPORTANT: Store user in socket.data for security (Source of Truth)
            client.data.user = payload;

            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
