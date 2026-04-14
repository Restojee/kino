-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('none', 'watching', 'watched', 'skipped');

-- AlterTable
ALTER TABLE "UserMovieState" ADD COLUMN "watchStatus" "WatchStatus" NOT NULL DEFAULT 'none';

-- Backfill: existing isWatched=true rows become watchStatus='watched'
UPDATE "UserMovieState" SET "watchStatus" = 'watched' WHERE "isWatched" = TRUE;
