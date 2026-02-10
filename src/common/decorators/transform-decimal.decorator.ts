import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

/**
 * Decorator to transform Prisma Decimal to number/string for API responses.
 * Avoids serialization issues where Decimal is returned as an object.
 */
export function TransformDecimal() {
    return Transform(({ value }) => {
        if (value === null || value === undefined) {
            return 0;
        }
        if (value && typeof value === 'object' && 'toNumber' in value) {
            return (value as any).toNumber();
        }
        return value;
    });
}
