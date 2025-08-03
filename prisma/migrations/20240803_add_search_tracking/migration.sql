-- CreateTable
CREATE TABLE "search_tracking" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" TEXT,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_tracking_ipAddress_createdAt_idx" ON "search_tracking"("ipAddress", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "search_tracking_deviceFingerprint_createdAt_idx" ON "search_tracking"("deviceFingerprint", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "search_tracking_createdAt_idx" ON "search_tracking"("createdAt" DESC);

-- Add index to search_logs for better performance
CREATE INDEX "search_logs_userId_createdAt_idx" ON "search_logs"("userId", "createdAt" DESC);