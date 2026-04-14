export type Category = "entertainment" | "cinema" | "cafe";

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: Date;
}

export interface Review {
  id: string;
  placeId: string;
  author: string;
  rating: number;
  text: string;
  date: Date;
  comments: Comment[];
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: Category;
  location: Location;
  rating: number;
  reviewCount: number;
  image?: string;
}

export type MovieCategorySlug =
  | "all"
  | "movies"
  | "series"
  | "cartoons"
  | "anime";

export interface MovieCategory {
  id: string;
  slug: MovieCategorySlug;
  name: string;
  image?: string;
}

export interface MovieGenre {
  id: string;
  name: string;
}

export type ExternalRatingSource = "imdb" | "kinopoisk" | "tmdb" | "user";

export interface ExternalRating {
  source: ExternalRatingSource;
  value: number;
  votes?: number;
}

export interface Movie {
  id: string;
  title: string;
  rating: number;
  poster: string;
  categorySlug: MovieCategorySlug;

  originalTitle?: string;
  description?: string;
  year?: number;
  releaseDate?: string;
  runtimeMinutes?: number;
  country?: string;
  director?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  ageRating?: string;

  genres?: MovieGenre[];
  ratings?: ExternalRating[];
  reviews?: MovieReview[];

  isWatched?: boolean;
  watchStatus?: WatchStatus;
  isFavorite?: boolean;
  userScore?: number | null;
}

export interface MovieReview {
  id: string;
  movieId: string;
  userId?: string;
  author: string;
  score: number;
  body: string;
  createdAt: string;
}

export type MovieSortTab = "latest" | "best" | "pending";

export type WatchStatus = "none" | "watching" | "watched" | "skipped";

export interface ReviewQuote {
  id: string;
  movieId: string;
  movieTitle: string;
  quote: string;
  author: string;
  backgroundImage?: string;
}
