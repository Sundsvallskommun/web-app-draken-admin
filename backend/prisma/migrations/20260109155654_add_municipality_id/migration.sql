/*
  Warnings:

  - Added the required column `municipalityId` to the `FeatureFlags` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeatureFlags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "application" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "municipalityId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FeatureFlags" ("application", "createdAt", "enabled", "id", "name", "namespace", "updatedAt", "value") SELECT "application", "createdAt", "enabled", "id", "name", "namespace", "updatedAt", "value" FROM "FeatureFlags";
DROP TABLE "FeatureFlags";
ALTER TABLE "new_FeatureFlags" RENAME TO "FeatureFlags";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
