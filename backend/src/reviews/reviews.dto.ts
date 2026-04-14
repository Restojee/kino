import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body: string;

  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;
}
