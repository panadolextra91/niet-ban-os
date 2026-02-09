import { ApiProperty } from '@nestjs/swagger';
import { KarmaSource } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class KarmaLogResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    amount: number;

    @ApiProperty({ enum: KarmaSource })
    @Expose()
    source: KarmaSource;

    @ApiProperty({ required: false })
    @Expose()
    metadata: any;

    @ApiProperty()
    @Expose()
    conNhangId: string;

    @ApiProperty()
    @Expose()
    createdAt: Date;
}
