-- CreateTable
CREATE TABLE "RecapEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekDate" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leagueId" TEXT NOT NULL,
    CONSTRAINT "RecapEmail_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
