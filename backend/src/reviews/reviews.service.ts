import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoviesService } from '../movies/movies.service';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto';
import { PaginationDto, paginate } from '../common/pagination.dto';

const reviewInclude = {
  user: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private movies: MoviesService) {}

  async listRecent(limit: number) {
    const take = Math.min(Math.max(limit, 1), 50);
    return this.prisma.review.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            backdropUrl: true,
          },
        },
      },
    });
  }

  async listForMovie(movieId: string, p: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { movieId },
        include: reviewInclude,
        skip: (p.page - 1) * p.limit,
        take: p.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { movieId } }),
    ]);
    return paginate(items, total, p.page, p.limit);
  }

  async create(movieId: string, userId: string, dto: CreateReviewDto) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    const existing = await this.prisma.review.findUnique({
      where: { movieId_userId: { movieId, userId } },
    });
    if (existing) throw new ConflictException('Review already exists for this movie');

    const review = await this.prisma.review.create({
      data: { movieId, userId, body: dto.body, score: dto.score },
      include: reviewInclude,
    });
    await this.syncUserScore(userId, movieId, dto.score);
    await this.movies.recalcUserRating(movieId);
    return review;
  }

  private async syncUserScore(userId: string, movieId: string, score: number) {
    await this.prisma.userMovieState.upsert({
      where:  { userId_movieId: { userId, movieId } },
      create: { userId, movieId, userScore: score },
      update: { userScore: score },
    });
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');

    const updated = await this.prisma.review.update({
      where: { id },
      data: { body: dto.body, score: dto.score },
      include: reviewInclude,
    });
    if (dto.score != null) await this.movies.recalcUserRating(review.movieId);
    return updated;
  }

  async remove(id: string, user: { id: string; role: 'user' | 'admin' }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== user.id && user.role !== 'admin')
      throw new ForbiddenException('Not your review');

    await this.prisma.review.delete({ where: { id } });
    await this.movies.recalcUserRating(review.movieId);
    return { ok: true };
  }
}
