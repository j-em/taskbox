-- Add COLLATE NOCASE to columns that need case-insensitive filtering

-- SQLite doesn't support ALTER TABLE for changing column collation
-- We need to recreate the table with COLLATE NOCASE on searchable fields

-- 1. Create new table with COLLATE NOCASE
CREATE TABLE "Task_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL COLLATE NOCASE,
    "description" TEXT COLLATE NOCASE,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "scheduledDate" DATETIME NOT NULL,
    "tags" TEXT NOT NULL COLLATE NOCASE,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 2. Copy all data from old table
INSERT INTO "Task_new" SELECT * FROM "Task";

-- 3. Drop old table
DROP TABLE "Task";

-- 4. Rename new table to original name
ALTER TABLE "Task_new" RENAME TO "Task";
