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
        // Handle Prisma Decimal object
        if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
            return (value as any).toNumber();
        }
        return value;
    });
}
