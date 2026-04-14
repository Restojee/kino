import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export type MovieSort = 'latest' | 'best' | 'pending';

export class CreateMovieDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  title: string;

  @IsOptional() @IsString() originalTitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1800) @Max(2100) year?: number;
  @IsOptional() @IsInt() @Min(0) runtimeMinutes?: number;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() director?: string;
  @IsOptional() @IsString() posterUrl?: string;
  @IsOptional() @IsString() backdropUrl?: string;
  @IsOptional() @IsString() trailerUrl?: string;
  @IsOptional() @IsString() ageRating?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  genreIds?: string[];
}

export class UpdateMovieDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() originalTitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1800) @Max(2100) year?: number;
  @IsOptional() @IsInt() @Min(0) runtimeMinutes?: number;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() director?: string;
  @IsOptional() @IsString() posterUrl?: string;
  @IsOptional() @IsString() backdropUrl?: string;
  @IsOptional() @IsString() trailerUrl?: string;
  @IsOptional() @IsString() ageRating?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('all', { each: true }) genreIds?: string[];
}

export class ListMoviesDto extends PaginationDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsUUID() genreId?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsIn(['latest', 'best', 'pending']) sort?: MovieSort;
}

export class ImportMovieDto {
  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;
}
