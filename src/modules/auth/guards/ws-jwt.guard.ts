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

            // 1. Get user from Cache (Source of Truth) using AuthService
            const user = await this.authService.getUserProfile(payload.sub);

            if (!user || !user.isActive) {
                console.error(`[WsJwtGuard] User invalid or banned: ${payload.sub}`);
                throw new UnauthorizedException('User invalid or banned');
            }

            console.log(`[WsJwtGuard] Success for user ${payload.email}`);
            // 2. Attach check result
            client.data.user = payload; // Keep payload for lightweight usage
            // client.data.fullUser = user; // Optional if needed

            return true;
        } catch (err) {
            console.error('[WsJwtGuard] Auth failed', err.message);
            // 3. Strict Disconnect (Zombie Prevention)
            client.disconnect(true);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
