-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'VIEWER';

-- CreateIndex
CREATE INDEX "customers_role_idx" ON "customers"("role");
