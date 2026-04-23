-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "preferredNotify" TEXT NOT NULL,
    "bandName" TEXT,
    "role" TEXT,
    "service" TEXT NOT NULL,
    "serviceOther" TEXT,
    "isMultiDate" BOOLEAN NOT NULL DEFAULT false,
    "dates" TIMESTAMP(3)[],
    "startTime" TEXT,
    "duration" TEXT,
    "location" TEXT,
    "genre" TEXT,
    "referenceLink" TEXT,
    "budgetRange" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "finalPay" DECIMAL(65,30),
    "callTime" TEXT,
    "loadInTime" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "postGigNotes" TEXT,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityBlock_date_key" ON "AvailabilityBlock"("date");
