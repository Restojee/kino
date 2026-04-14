import {HttpException, Injectable, ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';

export interface KinopoiskMovie {
  externalId: string;
  title: string;
  originalTitle?: string;
  description?: string;
  year?: number;
  releaseDate?: string;
  runtimeMinutes?: number;
  country?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  ageRating?: string;
  kinopoiskRating?: number;
  kinopoiskVotes?: number;
  imdbRating?: number;
  imdbVotes?: number;
  tmdbRating?: number;
  tmdbVotes?: number;
  categorySlug?: 'movies' | 'series' | 'cartoons' | 'anime';
  genres: Array<{ externalId?: string; name: string }>;
}

export interface KinopoiskSearchResult {
  externalId: string;
  title: string;
  originalTitle?: string;
  year?: number;
  posterUrl?: string;
  description?: string;
  kinopoiskRating?: number;
}

@Injectable()
export class KinopoiskService {
  private readonly base = 'https://api.poiskkino.dev/v1.4';

  constructor(private config: ConfigService) {
  }

  private get apiKey(): string {
    const key = this.config.get<string>('KINOPOISK_API_KEY');
    if (!key) throw new ServiceUnavailableException('KINOPOISK_API_KEY is not configured');
    return key;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: {'X-API-KEY': this.apiKey, accept: 'application/json'},
    });
    if (!res.ok) {
      throw new HttpException(`Kinopoisk error: ${res.status}`, res.status);
    }
    return res.json() as Promise<T>;
  }

  async search(query: string): Promise<KinopoiskSearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const data = await this.request<{ docs?: any[] }>(
      `/movie/search?page=1&limit=20&query=${encodeURIComponent(q)}`,
    );
    const items = data.docs || [];
    return items.map((m) => ({
      externalId: String(m.id),
      title: m.name || m.alternativeName || m.enName || '',
      originalTitle: m.alternativeName || m.enName,
      year: typeof m.year === 'number' ? m.year : undefined,
      posterUrl: m.poster?.previewUrl || m.poster?.url,
      description: m.description || m.shortDescription,
      kinopoiskRating:
        typeof m.rating?.kp === 'number' && m.rating.kp > 0
          ? Math.round(m.rating.kp * 10) / 10
          : undefined,
    }));
  }

  async fetchMovie(externalId: string): Promise<KinopoiskMovie> {
    const m = await this.request<any>(`/movie/${encodeURIComponent(externalId)}`);

    const trailer = m.videos?.trailers?.find((v: any) => v.url) || m.videos?.trailers?.[0];
    const country = Array.isArray(m.countries)
      ? m.countries.map((c: any) => c.name).filter(Boolean).join(', ')
      : undefined;

    const releaseDate =
      m.premiere?.world || m.premiere?.russia || m.premiere?.digital || m.premiere?.cinema;

    const ageRating =
      m.ratingMpaa ||
      (typeof m.ageRating === 'number' ? `${m.ageRating}+` : undefined);

    const num = (v: unknown): number | undefined => {
      if (typeof v === 'number' && v > 0) return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      }
      return undefined;
    };
    const round1 = (v: unknown): number | undefined => {
      const n = num(v);
      return n != null ? Math.round(n * 10) / 10 : undefined;
    };

    return {
      externalId: String(m.id),
      title: m.name || m.alternativeName || m.enName || '',
      originalTitle: m.alternativeName || m.enName,
      description: m.description || m.shortDescription,
      year: typeof m.year === 'number' ? m.year : undefined,
      releaseDate,
      runtimeMinutes: typeof m.movieLength === 'number' ? m.movieLength : undefined,
      country,
      posterUrl: m.poster?.url || m.poster?.previewUrl,
      backdropUrl: m.backdrop?.url || m.backdrop?.previewUrl,
      trailerUrl: trailer?.url,
      ageRating,
      kinopoiskRating: round1(m.rating?.kp),
      kinopoiskVotes: num(m.votes?.kp),
      imdbRating: round1(m.rating?.imdb),
      imdbVotes: num(m.votes?.imdb),
      tmdbRating: round1(m.rating?.tmdb),
      tmdbVotes: num(m.votes?.tmdb),
      categorySlug: mapType(m.type, m.isSeries, m.genres),
      genres: Array.isArray(m.genres)
        ? m.genres
          .filter((g: any) => g?.name)
          .map((g: any) => ({name: g.name as string}))
        : [],
    };
  }
}

function mapType(
  type: unknown,
  isSeries: unknown,
  genres: unknown,
): 'movies' | 'series' | 'cartoons' | 'anime' | undefined {
  const hasGenre = (name: string) =>
    Array.isArray(genres) && genres.some((g: any) => (g?.name as string | undefined)?.toLowerCase() === name);

  if (hasGenre('аниме')) return 'anime';
  if (type === 'anime') return 'anime';
  if (type === 'cartoon' || hasGenre('мультфильм')) return 'cartoons';
  if (type === 'tv-series' || type === 'mini-series' || type === 'animated-series' || isSeries === true)
    return 'series';
  if (type === 'movie') return 'movies';
  return undefined;
}
