import { MovieCategory, MovieCategorySlug } from "../types";
import { ApiService } from "../api/api.service";
import { mapCategory } from "../api/mappers";
import { Service } from "../core/Service";

const ALL_CATEGORY: MovieCategory = { id: "c-all", slug: "all", name: "ВСЕ" };

const FALLBACK: MovieCategory[] = [
  { id: "c-all", slug: "all", name: "ВСЕ" },
  { id: "c-movies", slug: "movies", name: "ФИЛЬМЫ" },
  { id: "c-series", slug: "series", name: "СЕРИАЛЫ" },
  { id: "c-cartoons", slug: "cartoons", name: "МУЛЬТФИЛЬМЫ" },
  { id: "c-anime", slug: "anime", name: "АНИМЕ" },
];

export class MovieCategoriesService extends Service {
  private static _instance: MovieCategoriesService;
  static getInstance(): MovieCategoriesService {
    return (this._instance ??= new MovieCategoriesService());
  }

  categories: MovieCategory[] = FALLBACK;
  activeSlug: MovieCategorySlug = "all";
  loaded: boolean = false;

  private api = ApiService.getInstance();

  private constructor() {
    super();
  }

  getCategories(): MovieCategory[] {
    return this.categories;
  }
  getActiveSlug(): MovieCategorySlug {
    return this.activeSlug;
  }

  setActive(slug: MovieCategorySlug): void {
    if (this.activeSlug === slug) return;
    this.activeSlug = slug;
    this.emit();
  }

  async load(): Promise<void> {
    try {
      const data =
        await this.api.get<Parameters<typeof mapCategory>[0][]>("categories");
      if (Array.isArray(data) && data.length > 0) {
        this.categories = [ALL_CATEGORY, ...data.map(mapCategory)];
      }
    } catch {
    } finally {
      this.loaded = true;
      this.emit();
    }
  }
}
