-- CreateEnum
CREATE TYPE "MemberRank" AS ENUM ('TU_TAI_GIA', 'A_LA_HAN', 'BO_TAT');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "KarmaSource" AS ENUM ('DONATION', 'AFK_FARMING', 'JACKPOT', 'DAILY_CHECKIN', 'SYSTEM_ADJUST', 'EXPIRED_DEDUCTION');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('MEMBER', 'CHU_TIEU', 'SU_TRUONG', 'TRU_TRI');

-- CreateTable
CREATE TABLE "con_nhang" (
    "idString" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phapDanh" TEXT,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "walletAddress" TEXT,
    "role" "SystemRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rank" "MemberRank" NOT NULL DEFAULT 'TU_TAI_GIA',
    "rankExpiryDate" TIMESTAMP(3),
    "currentKarma" INTEGER NOT NULL DEFAULT 0,
    "totalDonated" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "lastKnockTime" TIMESTAMP(3),
    "isAutoKnock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "con_nhang_pkey" PRIMARY KEY ("idString")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "message" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "conNhangId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "slotTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "isFastTrack" BOOLEAN NOT NULL DEFAULT false,
    "isPrivateRoom" BOOLEAN NOT NULL DEFAULT false,
    "conNhangId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karma_logs" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "KarmaSource" NOT NULL,
    "metadata" JSONB,
    "conNhangId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "karma_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "con_nhang_email_key" ON "con_nhang"("email");

-- CreateIndex
CREATE UNIQUE INDEX "con_nhang_phoneNumber_key" ON "con_nhang"("phoneNumber");

-- CreateIndex
CREATE INDEX "con_nhang_rank_idx" ON "con_nhang"("rank");

-- CreateIndex
CREATE INDEX "con_nhang_role_idx" ON "con_nhang"("role");

-- CreateIndex
CREATE INDEX "con_nhang_rankExpiryDate_idx" ON "con_nhang"("rankExpiryDate");

-- CreateIndex
CREATE INDEX "bookings_slotTime_idx" ON "bookings"("slotTime");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_conNhangId_fkey" FOREIGN KEY ("conNhangId") REFERENCES "con_nhang"("idString") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_conNhangId_fkey" FOREIGN KEY ("conNhangId") REFERENCES "con_nhang"("idString") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karma_logs" ADD CONSTRAINT "karma_logs_conNhangId_fkey" FOREIGN KEY ("conNhangId") REFERENCES "con_nhang"("idString") ON DELETE RESTRICT ON UPDATE CASCADE;
