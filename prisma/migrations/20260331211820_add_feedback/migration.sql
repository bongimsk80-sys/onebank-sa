-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "message" TEXT,
    "page" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
