import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller()
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get('reviews/recent')
  listRecent(@Query('limit') limit?: string) {
    const n = Number(limit);
    return this.reviews.listRecent(Number.isFinite(n) && n > 0 ? n : 10);
  }

  @Get('movies/:movieId/reviews')
  list(@Param('movieId') movieId: string, @Query() p: PaginationDto) {
    return this.reviews.listForMovie(movieId, p);
  }

  @Post('movies/:movieId/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('movieId') movieId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(movieId, user.id, dto);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviews.update(id, user.id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.reviews.remove(id, user);
  }
}
