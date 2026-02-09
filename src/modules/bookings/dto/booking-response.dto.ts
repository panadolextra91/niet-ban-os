import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BookingResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    slotTime: Date;

    @ApiProperty({ enum: BookingStatus })
    @Expose()
    status: BookingStatus;

    @ApiProperty()
    @Expose()
    isFastTrack: boolean;

    @ApiProperty()
    @Expose()
    isPrivateRoom: boolean;

    @ApiProperty()
    @Expose()
    conNhangId: string;

    @ApiProperty()
    @Expose()
    createdAt: Date;
}
