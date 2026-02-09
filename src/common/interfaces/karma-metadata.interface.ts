export interface JackpotMetadata {
    roundId: number;
    luckyNumber: number;
}

export interface DonationMetadata {
    bankTransactionId: string;
    bankName: string;
    paymentMethod: string;
}

export interface SystemAdjustmentMetadata {
    adminId: string;
    reason: string;
    previousKarma: number;
    newKarma: number;
}

export type KarmaLogMetadata = JackpotMetadata | DonationMetadata | SystemAdjustmentMetadata;
