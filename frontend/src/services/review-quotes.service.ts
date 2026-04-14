import { ReviewQuote } from "../types";
import { ApiService } from "../api/api.service";
import { Service } from "../core/Service";
import { $, $html } from "../core/h";
import { resolveStatic } from "../api/mappers";

interface ApiRecentReview {
  id: string;
  body: string;
  score: number;
  createdAt: string;
  user: { id: string; name: string | null } | null;
  movie: {
    id: string;
    title: string;
    posterUrl?: string | null;
    backdropUrl?: string | null;
  };
}

const FALLBACK: ReviewQuote[] = [
  {
    id: "q-fallback-1",
    movieId: "m-1",
    movieTitle: "Интерстеллар",
    quote: "Смотреть можно, но бывало и хуже!",
    author: "Боба",
  },
  {
    id: "q-fallback-2",
    movieId: "m-2",
    movieTitle: "Дюна",
    quote: "Песок попал во все щели — но это искусство!",
    author: "Боба",
  },
  {
    id: "q-fallback-3",
    movieId: "m-3",
    movieTitle: "Начало",
    quote: "Посмотрел один раз — не понял, пересмотрел — ещё больше не понял.",
    author: "Боба",
  },
];

export class ReviewQuotesService extends Service {
  private static _instance: ReviewQuotesService;
  static getInstance(): ReviewQuotesService {
    return (this._instance ??= new ReviewQuotesService());
  }

  quotes: ReviewQuote[] = FALLBACK;
  loaded: boolean = false;

  private api = ApiService.getInstance();

  private constructor() {
    super();
  }

  getQuotes(): ReviewQuote[] {
    return this.quotes;
  }

  async load(): Promise<void> {
    try {
      const data = await this.api.get<ApiRecentReview[]>(
        "reviews/recent?limit=10",
      );
      if (Array.isArray(data) && data.length > 0) {
        this.quotes = data.map(mapReviewToQuote);
      }
    } catch {
    } finally {
      this.loaded = true;
      this.emit();
    }
  }
}

function mapReviewToQuote(r: ApiRecentReview): ReviewQuote {
  const bg = resolveStatic(r.movie.backdropUrl ?? r.movie.posterUrl ?? "");
  return {
    id: r.id,
    movieId: r.movie.id,
    movieTitle: r.movie.title,
    quote: stripHtml(r.body).slice(0, 220),
    author: r.user?.name?.trim() || "Аноним",
    backgroundImage: bg,
  };
}

function stripHtml(html: string): string {
  const el = $("div");
  $html(el, html);
  return (el.textContent || "").trim();
}
