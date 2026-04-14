import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { GenresService } from './genres.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateGenreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name: string;
}

@Controller('genres')
export class GenresController {
  constructor(private genres: GenresService) {}

  @Get()
  list() {
    return this.genres.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGenreDto) {
    return this.genres.create(dto);
  }
}
