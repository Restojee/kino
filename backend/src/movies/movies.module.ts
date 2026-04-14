import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { KinopoiskService } from './kinopoisk.service';
import { GenresModule } from '../genres/genres.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [GenresModule, CategoriesModule],
  controllers: [MoviesController],
  providers: [MoviesService, KinopoiskService],
  exports: [MoviesService],
})
export class MoviesModule {}
