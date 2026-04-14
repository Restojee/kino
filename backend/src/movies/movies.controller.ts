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
import { MoviesService } from './movies.service';
import {
  CreateMovieDto,
  ImportMovieDto,
  ListMoviesDto,
  UpdateMovieDto,
} from './movies.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('movies')
export class MoviesController {
  constructor(private movies: MoviesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() q: ListMoviesDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.movies.list(q, user?.id);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.movies.searchExternal(q ?? '');
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.movies.get(id, user?.id);
  }

  @Post(':id/watched')
  @UseGuards(JwtAuthGuard)
  setWatched(
    @Param('id') id: string,
    @Body('value') value: boolean,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movies.setWatched(user.id, id, !!value);
  }

  @Post(':id/watch-status')
  @UseGuards(JwtAuthGuard)
  setWatchStatus(
    @Param('id') id: string,
    @Body('status') status: 'none' | 'watching' | 'watched' | 'skipped',
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const allowed = ['none', 'watching', 'watched', 'skipped'] as const;
    const next = allowed.includes(status as (typeof allowed)[number]) ? status : 'none';
    return this.movies.setWatchStatus(user.id, id, next);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  setFavorite(
    @Param('id') id: string,
    @Body('value') value: boolean,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movies.setFavorite(user.id, id, !!value);
  }

  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  setScore(
    @Param('id') id: string,
    @Body('score') score: number | null,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movies.setScore(user.id, id, score);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateMovieDto) {
    return this.movies.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    return this.movies.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.movies.remove(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  import(@Body() dto: ImportMovieDto) {
    return this.movies.importExternal(dto);
  }
}
