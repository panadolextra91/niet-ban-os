import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { AuthService } from '../auth/auth.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { REDIS_CLIENT } from '../../database/redis.provider';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
    namespace: '/temple',
    transports: ['websocket'],
    cors: {
        origin: '*', // Allow all for now, tighten later
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private authService: AuthService,
        private prisma: PrismaService,
        @Inject(REDIS_CLIENT) private redis: Redis,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                client.disconnect();
                return;
            }
            const jwt = token.replace('Bearer ', '');
            const payload = await this.authService.verifyToken(jwt);
            client.data.user = payload;
            console.log(`Client connected: ${client.id} (${payload.email})`);
        } catch (err) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('knock_mo')
    async handleKnockMo(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) {
            console.warn(`[Gateway] Unauthenticated knock attempt from ${client.id}`);
            return;
        }

        const userId = user.sub;
        const rateLimitKey = `rate_limit_knock:${userId}`;
        const karmaBufferKey = `karma_buffer:${userId}`;
        const activeSetKey = 'active_knockers';

        // 1. Rate Limiting (Redis INCR)
        const requests = await this.redis.incr(rateLimitKey);
        if (requests === 1) {
            await this.redis.expire(rateLimitKey, 1);
        }

        if (requests > 10) {
            client.emit('chill_thoi_thi_chu', {
                message: 'Mô phật! Thí chủ gõ nhanh quá, Phật tổ chóng mặt lắm!',
            });
            return;
        }

        // 2. High Performance Buffer (Write-Behind)
        console.log(`[Gateway] Knock received for user ${userId}`);
        await this.redis.pipeline()
            .incr(karmaBufferKey)
            .sadd(activeSetKey, userId)
            .exec();

        // Optional: Emit success back to client only if needed (debounced on client side usually)
        // client.emit('knock_success', { count: requests });
    }

    @OnEvent('donation.completed')
    handleDonationCompleted(payload: any) {
        console.log(`[Gateway] Broadcasting donation from ${payload.email}`);
        this.server.emit('marquee_new_prayer', payload);
    }

    @OnEvent('jackpot.won')
    handleJackpotWon(payload: any) {
        this.server.emit('global_jackpot_alert', payload);
    }
}
