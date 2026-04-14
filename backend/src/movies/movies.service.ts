import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {access, mkdir, writeFile} from 'fs/promises';
import {extname, join} from 'path';
import {PrismaService} from '../prisma/prisma.service';
import {GenresService} from '../genres/genres.service';
import {CategoriesService} from '../categories/categories.service';
import {KinopoiskService} from './kinopoisk.service';
import {CreateMovieDto, ImportMovieDto, ListMoviesDto, UpdateMovieDto,} from './movies.dto';
import {paginate} from '../common/pagination.dto';

const movieInclude = {
  category: true,
  genres: {include: {genre: true}},
} as const;

const EXTERNAL_SOURCE: 'kinopoisk' = 'kinopoisk';

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private genres: GenresService,
    private categories: CategoriesService,
    private kinopoisk: KinopoiskService,
  ) {
  }

  async list(q: ListMoviesDto, userId?: string) {
    const where: Prisma.MovieWhereInput = {};
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.categorySlug && q.categorySlug !== 'all') {
      where.category = {slug: q.categorySlug};
    }
    if (q.genreId) where.genres = {some: {genreId: q.genreId}};
    if (q.q) where.title = {contains: q.q, mode: 'insensitive'};

    if (q.sort === 'pending' && userId) {
      where.reviews = {none: {userId}};
      where.userStates = {
        none: {userId, OR: [{isWatched: true}, {watchStatus: 'watched'}]},
      };
    }

    let orderBy: Prisma.MovieOrderByWithRelationInput | Prisma.MovieOrderByWithRelationInput[];
    switch (q.sort) {
      case 'best':
        orderBy = [{userRating: 'desc'}, {createdAt: 'desc'}];
        break;
      case 'pending':
      case 'latest':
      default:
        orderBy = {createdAt: 'desc'};
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        where,
        include: movieInclude,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy,
      }),
      this.prisma.movie.count({where}),
    ]);
    const enriched = await this.attachUserState(items, userId);
    return paginate(enriched, total, q.page, q.limit);
  }

  async get(id: string, userId?: string) {
    const movie = await this.prisma.movie.findUnique({
      where: {id},
      include: {
        ...movieInclude,
        reviews: {
          orderBy: {createdAt: 'desc'},
          include: {user: {select: {id: true, name: true}}},
        },
      },
    });
    if (!movie) throw new NotFoundException('Movie not found');
    const [enriched] = await this.attachUserState([movie], userId);
    return enriched;
  }

  private async attachUserState<T extends { id: string }>(
    movies: T[],
    userId?: string,
  ): Promise<Array<T & {
    isWatched: boolean;
    watchStatus: 'none' | 'watching' | 'watched' | 'skipped';
    isFavorite: boolean;
    userScore: number | null;
  }>> {
    if (!userId || movies.length === 0) {
      return movies.map((m) => ({
        ...m,
        isWatched: false,
        watchStatus: 'none' as const,
        isFavorite: false,
        userScore: null,
      }));
    }
    const movieIds = movies.map((m) => m.id);
    const [states, ownReviews] = await Promise.all([
      this.prisma.userMovieState.findMany({
        where: {userId, movieId: {in: movieIds}},
      }),
      this.prisma.review.findMany({
        where: {userId, movieId: {in: movieIds}},
        select: {movieId: true, score: true},
      }),
    ]);
    const byMovieId = new Map(states.map((s) => [s.movieId, s]));
    const reviewByMovieId = new Map(ownReviews.map((r) => [r.movieId, r.score]));
    return movies.map((m) => {
      const s = byMovieId.get(m.id);
      const fallbackScore = reviewByMovieId.get(m.id) ?? null;
      return {
        ...m,
        isWatched: s?.isWatched ?? false,
        watchStatus: (s?.watchStatus ?? 'none') as 'none' | 'watching' | 'watched' | 'skipped',
        isFavorite: s?.isFavorite ?? false,
        userScore: s?.userScore ?? fallbackScore,
      };
    });
  }

  async create(dto: CreateMovieDto) {
    const {genreIds, ...rest} = dto;
    return this.prisma.movie.create({
      data: {
        ...rest,
        genres: genreIds
          ? {create: genreIds.map((genreId) => ({genreId}))}
          : undefined,
      },
      include: movieInclude,
    });
  }

  async update(id: string, dto: UpdateMovieDto) {
    const {genreIds, ...rest} = dto;
    await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      if (genreIds) {
        await tx.movieGenre.deleteMany({where: {movieId: id}});
        await tx.movieGenre.createMany({
          data: genreIds.map((genreId) => ({movieId: id, genreId})),
        });
      }
      return tx.movie.update({
        where: {id},
        data: rest,
        include: movieInclude,
      });
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.movie.delete({where: {id}});
    return {ok: true};
  }

  async searchExternal(query: string) {
    const results = await this.kinopoisk.search(query);
    if (results.length === 0) return [];

    const existing = await this.prisma.movie.findMany({
      where: {
        externalSource: EXTERNAL_SOURCE,
        externalId: {in: results.map((r) => r.externalId)},
      },
      select: {id: true, externalId: true},
    });
    const byExternalId = new Map(existing.map((e) => [e.externalId!, e.id]));
    return results.map((r) => ({
      ...r,
      alreadyAdded: byExternalId.has(r.externalId),
      existingId: byExternalId.get(r.externalId) ?? null,
    }));
  }

  async importExternal(dto: ImportMovieDto) {
    const external = await this.kinopoisk.fetchMovie(dto.externalId);
    const slug = dto.categorySlug || external.categorySlug || 'movies';
    const category = await this.categories.getBySlug(slug);

    const [localPoster, localBackdrop] = await Promise.all([
      cacheRemoteImage(external.posterUrl, 'posters', `${EXTERNAL_SOURCE}-${external.externalId}`),
      cacheRemoteImage(external.backdropUrl, 'backdrops', `${EXTERNAL_SOURCE}-${external.externalId}`),
    ]);
    if (localPoster) external.posterUrl = localPoster;
    if (localBackdrop) external.backdropUrl = localBackdrop;

    const genreRecords = await Promise.all(
      external.genres.map((g) =>
        this.genres.upsertByExternal({name: g.name, externalId: g.externalId}),
      ),
    );

    const existing = await this.prisma.movie.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: EXTERNAL_SOURCE,
          externalId: external.externalId,
        },
      },
    });

    const data: Prisma.MovieUncheckedCreateInput = {
      categoryId: category.id,
      title: external.title,
      originalTitle: external.originalTitle,
      description: external.description,
      year: external.year,
      releaseDate: external.releaseDate ? new Date(external.releaseDate) : undefined,
      runtimeMinutes: external.runtimeMinutes,
      country: external.country,
      posterUrl: external.posterUrl,
      backdropUrl: external.backdropUrl,
      trailerUrl: external.trailerUrl,
      ageRating: external.ageRating,
      kinopoiskRating: external.kinopoiskRating ? new Prisma.Decimal(external.kinopoiskRating) : null,
      kinopoiskVotes: external.kinopoiskVotes ?? null,
      imdbRating: external.imdbRating ? new Prisma.Decimal(external.imdbRating) : null,
      imdbVotes: external.imdbVotes ?? null,
      tmdbRating: external.tmdbRating ? new Prisma.Decimal(external.tmdbRating) : null,
      tmdbVotes: external.tmdbVotes ?? null,
      externalSource: EXTERNAL_SOURCE,
      externalId: external.externalId,
    };

    if (existing) {
      return this.prisma.$transaction(async (tx) => {
        await tx.movieGenre.deleteMany({where: {movieId: existing.id}});
        await tx.movieGenre.createMany({
          data: genreRecords.map((g) => ({movieId: existing.id, genreId: g.id})),
        });
        return tx.movie.update({
          where: {id: existing.id},
          data,
          include: movieInclude,
        });
      });
    }

    return this.prisma.movie.create({
      data: {
        ...data,
        genres: {create: genreRecords.map((g) => ({genreId: g.id}))},
      },
      include: movieInclude,
    });
  }

  async setWatched(userId: string, movieId: string, value: boolean) {
    await this.get(movieId);
    return this.prisma.userMovieState.upsert({
      where: {userId_movieId: {userId, movieId}},
      create: {userId, movieId, isWatched: value, watchStatus: value ? 'watched' : 'none'},
      update: {isWatched: value, watchStatus: value ? 'watched' : 'none'},
    });
  }

  async setWatchStatus(
    userId: string,
    movieId: string,
    status: 'none' | 'watching' | 'watched' | 'skipped',
  ) {
    await this.get(movieId);
    return this.prisma.userMovieState.upsert({
      where: {userId_movieId: {userId, movieId}},
      create: {userId, movieId, watchStatus: status, isWatched: status === 'watched'},
      update: {watchStatus: status, isWatched: status === 'watched'},
    });
  }

  async setFavorite(userId: string, movieId: string, value: boolean) {
    await this.get(movieId);
    return this.prisma.userMovieState.upsert({
      where: {userId_movieId: {userId, movieId}},
      create: {userId, movieId, isFavorite: value},
      update: {isFavorite: value},
    });
  }

  async setScore(userId: string, movieId: string, score: number | null) {
    if (score != null && (score < 1 || score > 10)) {
      throw new BadRequestException('Score must be between 1 and 10');
    }
    await this.get(movieId);
    const result = await this.prisma.userMovieState.upsert({
      where: {userId_movieId: {userId, movieId}},
      create: {userId, movieId, userScore: score},
      update: {userScore: score},
    });
    const agg = await this.prisma.userMovieState.aggregate({
      where: {movieId, userScore: {not: null}},
      _avg: {userScore: true},
      _count: {userScore: true},
    });
    await this.prisma.movie.update({
      where: {id: movieId},
      data: {
        userRating: agg._avg.userScore != null
          ? new Prisma.Decimal(Math.round(agg._avg.userScore * 10) / 10)
          : null,
        userRatingVotes: agg._count.userScore,
      },
    });
    return result;
  }

  async recalcUserRating(movieId: string) {
    const agg = await this.prisma.review.aggregate({
      where: {movieId},
      _avg: {score: true},
      _count: {_all: true},
    });
    await this.prisma.movie.update({
      where: {id: movieId},
      data: {
        userRating:
          agg._avg.score != null
            ? new Prisma.Decimal(Math.round(agg._avg.score * 10) / 10)
            : null,
        userRatingVotes: agg._count._all,
      },
    });
  }
}

const PUBLIC_DIR = join(process.cwd(), 'public');

async function cacheRemoteImage(
  url: string | undefined,
  subdir: string,
  baseName: string,
): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const ext = pickImageExt(url);
    const safeBase = baseName.replace(/[^\w.-]+/g, '_');
    const fileName = `${safeBase}${ext}`;
    const dir = join(PUBLIC_DIR, subdir);
    const filePath = join(dir, fileName);
    const publicPath = `/static/${subdir}/${fileName}`;

    if (await fileExists(filePath)) return publicPath;

    await mkdir(dir, {recursive: true});
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bobkino/1.0)',
      },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(filePath, buf);
    return publicPath;
  } catch {
    return null;
  }
}

function pickImageExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const e = extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(e)) return e;
  return '.jpg';
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
