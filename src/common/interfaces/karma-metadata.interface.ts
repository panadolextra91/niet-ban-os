export interface KarmaLogMetadata {
    donationId?: string;
    sourceDonationId?: string;
    jackpotRound?: number;
    method?: string;
    reason?: string;
    adminId?: string;
}

export interface DonationCompletedEvent {
    user: string;
    amount: number;
    rank: string;
}

export interface JackpotWonEvent {
    userId: string;
    bonusKarma: number;
    message: string;
}
