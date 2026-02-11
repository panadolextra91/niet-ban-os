import { ApiProperty } from '@nestjs/swagger';
import { MemberRank } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import { TransformDecimal } from '../../../common/decorators/transform-decimal.decorator';

@Exclude()
export class UserResponseDto {
    @ApiProperty()
    @Expose()
    idString: string;

    @ApiProperty()
    @Expose()
    email: string;

    @ApiProperty({ required: false })
    @Expose()
    phapDanh?: string;

    @ApiProperty({ enum: MemberRank })
    @Expose()
    rank: MemberRank;

    @ApiProperty({ required: false })
    @Expose()
    rankExpiryDate?: Date;

    @ApiProperty()
    @Expose()
    currentKarma: number;

    @ApiProperty()
    @Expose()
    @TransformDecimal()
    totalDonated: number;

    @ApiProperty({ required: false })
    @Expose()
    walletAddress: string;

    @ApiProperty()
    @Expose()
    isAutoKnock: boolean;

    @ApiProperty()
    @Expose()
    createdAt: Date;
}
