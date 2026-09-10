-- CreateEnum
CREATE TYPE "ChangeActor" AS ENUM ('PARENT', 'ADMIN', 'VENDOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InvoiceParty" AS ENUM ('PARENT', 'SCHOOL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('PARENT_PORTAL', 'SERVICE_SHEET', 'IMPORTED_FORM', 'SAMPLE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'PARENT_PORTAL';

-- AlterTable
ALTER TABLE "OrderCycle" ADD COLUMN     "changeCutoffDays" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "changeCutoffHour" INTEGER NOT NULL DEFAULT 22;

-- AlterTable
ALTER TABLE "OrderDay" ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "allergyNote" TEXT;

-- CreateTable
CREATE TABLE "AllergyDeclaration" (
    "id" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "classGroup" "ClassGroup" NOT NULL,
    "year" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT NOT NULL,
    "resolvedStudentId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllergyDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassGroupRule" (
    "classGroup" "ClassGroup" NOT NULL,
    "allowedMeals" "MealType"[],
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassGroupRule_pkey" PRIMARY KEY ("classGroup")
);

-- CreateTable
CREATE TABLE "ServiceSheetImport" (
    "id" TEXT NOT NULL,
    "serviceDate" DATE NOT NULL,
    "sourceName" TEXT NOT NULL,
    "revision" TEXT,
    "breakfastRows" INTEGER NOT NULL DEFAULT 0,
    "lunchRows" INTEGER NOT NULL DEFAULT 0,
    "brunchRows" INTEGER NOT NULL DEFAULT 0,
    "unmatchedNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT,

    CONSTRAINT "ServiceSheetImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDayChange" (
    "id" TEXT NOT NULL,
    "orderDayId" TEXT NOT NULL,
    "changedById" TEXT,
    "actorRole" "ChangeActor" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,

    CONSTRAINT "OrderDayChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "party" "InvoiceParty" NOT NULL,
    "studentId" TEXT,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "orderDayId" TEXT,
    "date" DATE,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AllergyDeclaration_resolvedStudentId_idx" ON "AllergyDeclaration"("resolvedStudentId");

-- CreateIndex
CREATE INDEX "AllergyDeclaration_classGroup_idx" ON "AllergyDeclaration"("classGroup");

-- CreateIndex
CREATE INDEX "ServiceSheetImport_serviceDate_idx" ON "ServiceSheetImport"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSheetImport_serviceDate_sourceName_key" ON "ServiceSheetImport"("serviceDate", "sourceName");

-- CreateIndex
CREATE INDEX "OrderDayChange_orderDayId_idx" ON "OrderDayChange"("orderDayId");

-- CreateIndex
CREATE INDEX "OrderDayChange_changedAt_idx" ON "OrderDayChange"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_cycleId_party_studentId_key" ON "Invoice"("cycleId", "party", "studentId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_orderDayId_idx" ON "InvoiceLine"("orderDayId");

-- CreateIndex
CREATE INDEX "Order_source_idx" ON "Order"("source");

-- AddForeignKey
ALTER TABLE "AllergyDeclaration" ADD CONSTRAINT "AllergyDeclaration_resolvedStudentId_fkey" FOREIGN KEY ("resolvedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSheetImport" ADD CONSTRAINT "ServiceSheetImport_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDayChange" ADD CONSTRAINT "OrderDayChange_orderDayId_fkey" FOREIGN KEY ("orderDayId") REFERENCES "OrderDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDayChange" ADD CONSTRAINT "OrderDayChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "OrderCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_orderDayId_fkey" FOREIGN KEY ("orderDayId") REFERENCES "OrderDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
