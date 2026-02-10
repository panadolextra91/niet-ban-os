import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class JackpotService {
    constructor(private eventEmitter: EventEmitter2) { }

    /**
     * Mock Luck Check: 5% chance to win double karma based on amount
     */
    async checkLuck(userId: string, amount: number) {
        const isWinner = Math.random() < 0.05; // 5% nhân phẩm

        if (isWinner) {
            const bonusKarma = Math.floor(amount / 1000); // Tặng thêm 1x điểm

            // Emit event for socket.io notification later
            this.eventEmitter.emit('jackpot.won', {
                userId,
                bonusKarma,
                message: 'Chúc mừng thí chủ đã nổ hũ công đức! 🎉',
            });

            return bonusKarma;
        }

        return 0;
    }
}
