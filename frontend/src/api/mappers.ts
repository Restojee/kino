import {
  ExternalRating,
  Movie,
  MovieCategory,
  MovieCategorySlug,
  MovieGenre,
  MovieReview,
  WatchStatus
} from "../types";

const API_ORIGIN = "http://localhost:8000";

export function resolveStatic(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  return url;
}

interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
}

export function mapCategory(api: ApiCategory): MovieCategory {
  return {
    id: api.id,
    slug: api.slug as MovieCategorySlug,
    name: api.name.toUpperCase(),
    image: resolveStatic(api.image),
  };
}

interface ApiMovieGenre {
  genre: { id: string; slug: string; name: string };
}

interface ApiMovie {
  id: string;
  title: string;
  originalTitle?: string | null;
  description?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  runtimeMinutes?: number | null;
  country?: string | null;
  director?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  ageRating?: string | null;

  category: { id: string; slug: string; name: string };
  genres: ApiMovieGenre[];

  imdbRating?: string | number | null;
  imdbVotes?: number | null;
  kinopoiskRating?: string | number | null;
  kinopoiskVotes?: number | null;
  tmdbRating?: string | number | null;
  tmdbVotes?: number | null;
  userRating?: string | number | null;
  userRatingVotes?: number | null;

  isWatched?: boolean | null;
  watchStatus?: WatchStatus | null;
  isFavorite?: boolean | null;
  userScore?: number | null;

  reviews?: ApiReview[] | null;
}

interface ApiReview {
  id: string;
  movieId: string;
  userId: string;
  body: string;
  score: number;
  createdAt: string;
  user?: { id: string; name: string | null } | null;
}

export function mapReview(api: ApiReview): MovieReview {
  return {
    id: api.id,
    movieId: api.movieId,
    userId: api.userId,
    author: api.user?.name?.trim() || "Аноним",
    score: api.score,
    body: api.body,
    createdAt: api.createdAt,
  };
}

function num(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function pickRatings(m: ApiMovie): ExternalRating[] {
  const out: ExternalRating[] = [];
  const imdb = num(m.imdbRating);
  if (imdb != null)
    out.push({ source: "imdb", value: imdb, votes: m.imdbVotes ?? undefined });
  const kp = num(m.kinopoiskRating);
  if (kp != null)
    out.push({
      source: "kinopoisk",
      value: kp,
      votes: m.kinopoiskVotes ?? undefined,
    });
  const tmdb = num(m.tmdbRating);
  if (tmdb != null)
    out.push({ source: "tmdb", value: tmdb, votes: m.tmdbVotes ?? undefined });
  const user = num(m.userRating);
  if (user != null)
    out.push({
      source: "user",
      value: user,
      votes: m.userRatingVotes ?? undefined,
    });
  return out;
}

function pickHeadlineRating(m: ApiMovie): number {
  return (
    num(m.userRating) ??
    num(m.kinopoiskRating) ??
    num(m.imdbRating) ??
    num(m.tmdbRating) ??
    0
  );
}

export function mapMovie(api: ApiMovie): Movie {
  const genres: MovieGenre[] = api.genres.map((g) => ({
    id: g.genre.id,
    name: g.genre.name,
  }));

  return {
    id: api.id,
    title: api.title,
    originalTitle: api.originalTitle ?? undefined,
    description: api.description ?? undefined,
    year: api.year ?? undefined,
    releaseDate: api.releaseDate ?? undefined,
    runtimeMinutes: api.runtimeMinutes ?? undefined,
    country: api.country ?? undefined,
    director: api.director ?? undefined,
    ageRating: api.ageRating ?? undefined,
    backdropUrl: resolveStatic(api.backdropUrl),
    trailerUrl: api.trailerUrl ?? undefined,

    poster: resolveStatic(api.posterUrl),
    categorySlug: api.category.slug as MovieCategorySlug,
    rating: pickHeadlineRating(api),

    genres,
    ratings: pickRatings(api),
    reviews: api.reviews ? api.reviews.map(mapReview) : undefined,

    isWatched: api.isWatched ?? false,
    watchStatus: api.watchStatus ?? "none",
    isFavorite: api.isFavorite ?? false,
    userScore: api.userScore ?? null,
  };
}

export interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
