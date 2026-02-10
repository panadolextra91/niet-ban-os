import { Exclude } from 'class-transformer';
import { TransformDecimal } from '../decorators/transform-decimal.decorator';

@Exclude()
export class BaseResponseDto {
    /**
     * Helper to extend DTOs with common transformation logic.
     * Decimal fields should use @TransformDecimal in child classes.
     */
}
