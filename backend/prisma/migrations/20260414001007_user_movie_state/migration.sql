-- CreateTable
CREATE TABLE "UserMovieState" (
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "isWatched" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "userScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMovieState_pkey" PRIMARY KEY ("userId","movieId")
);

-- CreateIndex
CREATE INDEX "UserMovieState_movieId_idx" ON "UserMovieState"("movieId");

-- AddForeignKey
ALTER TABLE "UserMovieState" ADD CONSTRAINT "UserMovieState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovieState" ADD CONSTRAINT "UserMovieState_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
