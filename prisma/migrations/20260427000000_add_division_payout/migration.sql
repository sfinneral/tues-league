-- CreateTable
CREATE TABLE "DivisionPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstPlace" INTEGER NOT NULL,
    "secondPlace" INTEGER NOT NULL,
    "thirdPlace" INTEGER,
    "divisionId" TEXT NOT NULL,
    CONSTRAINT "DivisionPayout_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DivisionPayout_divisionId_key" ON "DivisionPayout"("divisionId");
