import { MovieGenre } from "../types";
import { ApiService } from "../api/api.service";
import { Service } from "../core/Service";

interface ApiGenre {
  id: string;
  slug: string;
  name: string;
}

export class GenresService extends Service {
  private static _instance: GenresService;
  static getInstance(): GenresService {
    return (this._instance ??= new GenresService());
  }

  genres: MovieGenre[] = [];
  loaded: boolean = false;

  private api = ApiService.getInstance();
  private loadingPromise: Promise<void> | null = null;

  private constructor() {
    super();
  }

  getGenres(): MovieGenre[] {
    return this.genres;
  }

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadingPromise) {
      this.loadingPromise = this.load().finally(() => {
        this.loadingPromise = null;
      });
    }
    await this.loadingPromise;
  }

  async load(): Promise<void> {
    try {
      const data = await this.api.get<ApiGenre[]>("genres");
      if (Array.isArray(data)) {
        this.genres = data.map((g) => ({ id: g.id, name: g.name }));
        this.loaded = true;
        this.emit();
      }
    } catch {}
  }

  async resolveByName(name: string): Promise<MovieGenre | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    await this.ensureLoaded();
    const key = trimmed.toLowerCase();
    const existing = this.genres.find((g) => g.name.toLowerCase() === key);
    if (existing) return existing;
    try {
      const created = await this.api.post<ApiGenre>("genres", {
        name: trimmed,
      });
      const genre: MovieGenre = { id: created.id, name: created.name };
      this.genres = [...this.genres, genre];
      this.emit();
      return genre;
    } catch {
      return null;
    }
  }
}
