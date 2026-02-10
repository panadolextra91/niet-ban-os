import { PrismaClient, SystemRole, MemberRank } from '@prisma/client';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = 'tru-tri@nietban.com';
    const adminPass = 'admin123';
    const hashedPassword = await argon2.hash(adminPass);

    const admin = await prisma.conNhang.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            phapDanh: 'Thích Full Stack',
            role: SystemRole.TRU_TRI,
            rank: MemberRank.BO_TAT, // Trụ Trì auto max rank cho xịn
            isActive: true,
        },
    });

    console.log('Seeded Admin:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
