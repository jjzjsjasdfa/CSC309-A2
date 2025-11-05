/*
  Warnings:

  - You are about to drop the `_UserPomotions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `available` on the `Promotion` table. All the data in the column will be lost.
  - You are about to alter the column `minSpending` on the `Promotion` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `rate` on the `Promotion` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- DropIndex
DROP INDEX "_UserPomotions_B_index";

-- DropIndex
DROP INDEX "_UserPomotions_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_UserPomotions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PromotionUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PromotionUsage_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER
);
INSERT INTO "new_Promotion" ("description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type") SELECT "description", "endTime", "id", "minSpending", "name", "points", "rate", "startTime", "type" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PromotionUsage_userId_promotionId_key" ON "PromotionUsage"("userId", "promotionId");
