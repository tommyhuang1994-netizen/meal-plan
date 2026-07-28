-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'ADMIN', 'VENDOR');

-- CreateEnum
CREATE TYPE "ClassGroup" AS ENUM ('CAMBRIDGE', 'HOMESCHOOL', 'PLUS', 'STAFF');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'BRUNCH');

-- CreateEnum
CREATE TYPE "SelectionMode" AS ENUM ('CHEF', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BlockKind" AS ENUM ('HOLIDAY', 'BREAK');

-- CreateEnum
CREATE TYPE "PlanPricing" AS ENUM ('PER_DAY_RATE', 'PER_STUDY_DAY');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED', 'PAID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classGroup" "ClassGroup" NOT NULL,
    "year" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "vendorCost" DECIMAL(10,2) NOT NULL,
    "parentPrice" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuOffering" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarBlock" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "classGroup" "ClassGroup" NOT NULL,
    "kind" "BlockKind" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "vendorCost" DECIMAL(10,2) NOT NULL,
    "parentPrice" DECIMAL(10,2) NOT NULL,
    "pricing" "PlanPricing" NOT NULL DEFAULT 'PER_DAY_RATE',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OrderCycle" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),

    CONSTRAINT "OrderCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "classGroup" "ClassGroup" NOT NULL,
    "planId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDay" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "OrderDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMeal" (
    "id" TEXT NOT NULL,
    "orderDayId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "mode" "SelectionMode" NOT NULL,
    "menuItemId" TEXT,
    "itemNameSnapshot" TEXT,
    "unitParentPrice" DECIMAL(10,2) NOT NULL,
    "unitVendorCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");

-- CreateIndex
CREATE INDEX "Student_classGroup_idx" ON "Student"("classGroup");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_name_key" ON "MenuItem"("name");

-- CreateIndex
CREATE INDEX "MenuItem_mealType_idx" ON "MenuItem"("mealType");

-- CreateIndex
CREATE INDEX "MenuOffering_date_idx" ON "MenuOffering"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MenuOffering_date_mealType_menuItemId_key" ON "MenuOffering"("date", "mealType", "menuItemId");

-- CreateIndex
CREATE INDEX "CalendarBlock_classGroup_idx" ON "CalendarBlock"("classGroup");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarBlock_date_classGroup_key" ON "CalendarBlock"("date", "classGroup");

-- CreateIndex
CREATE UNIQUE INDEX "PlanOption_code_key" ON "PlanOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCycle_year_month_key" ON "OrderCycle"("year", "month");

-- CreateIndex
CREATE INDEX "Order_parentId_idx" ON "Order"("parentId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cycleId_studentId_key" ON "Order"("cycleId", "studentId");

-- CreateIndex
CREATE INDEX "OrderDay_date_idx" ON "OrderDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDay_orderId_date_key" ON "OrderDay"("orderId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMeal_orderDayId_mealType_key" ON "OrderMeal"("orderDayId", "mealType");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOffering" ADD CONSTRAINT "MenuOffering_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "OrderCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDay" ADD CONSTRAINT "OrderDay_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_orderDayId_fkey" FOREIGN KEY ("orderDayId") REFERENCES "OrderDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMeal" ADD CONSTRAINT "OrderMeal_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
