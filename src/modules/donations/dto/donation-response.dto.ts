import { ApiProperty } from '@nestjs/swagger';
import { DonationStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import { TransformDecimal } from '../../../common/decorators/transform-decimal.decorator';

@Exclude()
export class DonationResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    @TransformDecimal()
    amount: number;

    @ApiProperty()
    @Expose()
    currency: string;

    @ApiProperty({ required: false })
    @Expose()
    message: string;

    @ApiProperty({ enum: DonationStatus })
    @Expose()
    status: DonationStatus;

    @ApiProperty({ required: false })
    @Expose()
    transactionId: string;

    @ApiProperty()
    @Expose()
    conNhangId: string;

    @ApiProperty()
    @Expose()
    createdAt: Date;
}
