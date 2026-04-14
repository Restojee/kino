import {
  Movie,
  MovieCategorySlug,
  MovieReview,
  MovieSortTab,
  WatchStatus,
} from "../types";
import { ApiService } from "../api/api.service";
import { ApiPage, mapMovie } from "../api/mappers";
import { Service } from "../core/Service";
import { MovieCategoriesService } from "./movie-categories.service";
import { isString } from "../utils/type-guards.util.ts";

const PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 24;
const scalarKeys: Array<keyof Movie> = [
  "title",
  "originalTitle",
  "description",
  "year",
  "runtimeMinutes",
  "country",
  "director",
  "ageRating",
  "releaseDate",
  "backdropUrl",
  "trailerUrl",
];

export class MoviesService extends Service {
  private static _instance: MoviesService;

  static getInstance(): MoviesService {
    return (this._instance ??= new MoviesService());
  }

  movies: Movie[] = [];
  categorySlug: MovieCategorySlug = "all";
  sortTab: MovieSortTab = "latest";
  loaded: boolean = false;
  page: number = 0;
  total: number = 0;
  hasMoreFlag: boolean = false;
  loadingMore: boolean = false;

  gridItems: Movie[] = [];
  gridPage: number = 0;
  gridTotal: number = 0;
  gridHasMore: boolean = false;
  gridLoading: boolean = false;
  gridLoadingMore: boolean = false;
  gridLoaded: boolean = false;
  private gridRequestId = 0;

  private api = ApiService.getInstance();

  private constructor() {
    super();
  }

  hasMore(): boolean {
    return this.hasMoreFlag;
  }

  isLoadingMore(): boolean {
    return this.loadingMore;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getCategorySlug(): MovieCategorySlug {
    return this.categorySlug;
  }

  getSortTab(): MovieSortTab {
    return this.sortTab;
  }

  getMovieById(id: string): Movie | undefined {
    return this.movies.find((m) => m.id === id);
  }

  async loadMovieById(id: string): Promise<void> {
    try {
      const api = await this.api.get<Parameters<typeof mapMovie>[0]>(
        `movies/${id}`,
      );
      const fresh = mapMovie(api);
      const existingIdx = this.movies.findIndex((m) => m.id === id);
      if (existingIdx >= 0) {
        this.movies = this.movies.map((m, i) =>
          i === existingIdx ? fresh : m,
        );
      } else {
        this.movies = [fresh, ...this.movies];
      }
      this.emit();
    } catch {}
  }

  getMovies(): Movie[] {
    if (this.categorySlug === "all") return this.movies;
    return this.movies.filter((m) => m.categorySlug === this.categorySlug);
  }

  setCategory(slug: MovieCategorySlug): void {
    if (this.categorySlug === slug) return;
    this.categorySlug = slug;
    this.emit();
    void this.loadGrid();
  }

  setSortTab(tab: MovieSortTab): void {
    if (this.sortTab === tab) return;
    this.sortTab = tab;
    this.emit();
    void this.loadGrid();
  }

  async updateMovie(id: string, patch: Partial<Movie>): Promise<void> {
    const prev = this.movies.find((m) => m.id === id);
    if (!prev) return;

    this.movies = this.movies.map((m) =>
      m.id === id ? { ...m, ...patch } : m,
    );
    this.emit();

    const apiPatch = this.buildApiPatch(patch);
    if (Object.keys(apiPatch).length === 0) return;

    try {
      await this.api.patch(`movies/${id}`, apiPatch);
    } catch (e) {
      this.movies = this.movies.map((m) => (m.id === id ? prev : m));
      this.emit();
      throw e;
    }
  }

  async setWatchStatus(id: string, status: WatchStatus): Promise<void> {
    const prev = this.movies.find((m) => m.id === id);
    if (!prev) return;
    const nextIsWatched = status === "watched";
    const apply = (m: Movie): Movie =>
      m.id === id ? { ...m, watchStatus: status, isWatched: nextIsWatched } : m;
    this.movies = this.movies.map(apply);
    this.gridItems = this.gridItems.map(apply);
    this.emit();
    try {
      await this.api.post(`movies/${id}/watch-status`, { status });
    } catch (e) {
      this.movies = this.movies.map((m) => (m.id === id ? prev : m));
      this.gridItems = this.gridItems.map((m) => (m.id === id ? prev : m));
      this.emit();
      throw e;
    }
  }

  async setWatched(id: string, value: boolean): Promise<void> {
    const prev = this.movies.find((m) => m.id === id);
    if (!prev) return;
    this.movies = this.movies.map((m) =>
      m.id === id ? { ...m, isWatched: value } : m,
    );
    this.emit();
    try {
      await this.api.post(`movies/${id}/watched`, { value });
    } catch (e) {
      this.movies = this.movies.map((m) => (m.id === id ? prev : m));
      this.emit();
      throw e;
    }
  }

  async setFavorite(id: string, value: boolean): Promise<void> {
    const prev = this.movies.find((m) => m.id === id);
    if (!prev) return;
    this.movies = this.movies.map((m) =>
      m.id === id ? { ...m, isFavorite: value } : m,
    );
    this.emit();
    try {
      await this.api.post(`movies/${id}/favorite`, { value });
    } catch (e) {
      this.movies = this.movies.map((m) => (m.id === id ? prev : m));
      this.emit();
      throw e;
    }
  }

  async setUserScore(id: string, score: number | null): Promise<void> {
    const prev = this.movies.find((m) => m.id === id);
    if (!prev) return;
    this.movies = this.movies.map((m) =>
      m.id === id ? { ...m, userScore: score } : m,
    );
    this.emit();
    try {
      await this.api.post(`movies/${id}/rate`, { score });
    } catch (e) {
      this.movies = this.movies.map((m) => (m.id === id ? prev : m));
      this.emit();
      throw e;
    }
  }

  private buildApiPatch(patch: Partial<Movie>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of scalarKeys) {
      if (patch[key]) out[key] = patch[key];
    }
    if (patch.categorySlug) {
      const cat = MovieCategoriesService.getInstance()
        .getCategories()
        .find((c) => c.slug === patch.categorySlug);
      if (cat && cat.id !== "c-all") out.categoryId = cat.id;
    }
    if (patch.genres) {
      out.genreIds = patch.genres
        .map((g) => g.id)
        .filter((id) => isString(id) && /^[0-9a-f-]{36}$/i.test(id));
    }
    return out;
  }

  addReview(
    movieId: string,
    input: Pick<MovieReview, "author" | "score" | "body"> & { userId?: string },
  ): void {
    const review: MovieReview = {
      id: `r-${Date.now()}`,
      movieId,
      userId: input.userId,
      author: input.author,
      score: input.score,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    this.movies = this.movies.map((m) =>
      m.id === movieId ? { ...m, reviews: [review, ...(m.reviews ?? [])] } : m,
    );
    this.emit();
  }

  removeReview(movieId: string, reviewId: string): void {
    this.movies = this.movies.map((m) =>
      m.id === movieId
        ? { ...m, reviews: (m.reviews ?? []).filter((r) => r.id !== reviewId) }
        : m,
    );
    this.emit();
  }

  async load(): Promise<void> {
    try {
      const page = await this.api.get<ApiPage<Parameters<typeof mapMovie>[0]>>(
        `movies?page=1&limit=${PAGE_SIZE}&sort=latest`,
      );
      if (page && Array.isArray(page.items)) {
        this.movies = page.items.map(mapMovie);
        this.page = 1;
        this.total = page.total ?? page.items.length;
        this.hasMoreFlag = false;
      }
    } catch {
    } finally {
      this.loaded = true;
      this.emit();
    }
  }

  async loadMore(): Promise<void> {
    if (this.loadingMore || !this.hasMoreFlag) return;
    this.loadingMore = true;
    this.emit();
    try {
      const next = this.page + 1;
      const page = await this.api.get<ApiPage<Parameters<typeof mapMovie>[0]>>(
        `movies?page=${next}&limit=${PAGE_SIZE}`,
      );
      if (page && Array.isArray(page.items) && page.items.length > 0) {
        const existing = new Set(this.movies.map((m) => m.id));
        const fresh = page.items
          .map(mapMovie)
          .filter((m) => !existing.has(m.id));
        this.movies = [...this.movies, ...fresh];
        this.page = next;
        this.total = page.total ?? this.total;
        this.hasMoreFlag = this.movies.length < this.total;
      } else {
        this.hasMoreFlag = false;
      }
    } catch {
      this.hasMoreFlag = false;
    } finally {
      this.loadingMore = false;
      this.emit();
    }
  }

  private buildGridQuery(page: number): string {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(GRID_PAGE_SIZE));
    params.set("sort", this.sortTab);
    if (this.categorySlug !== "all")
      params.set("categorySlug", this.categorySlug);
    return `movies?${params.toString()}`;
  }

  async loadGrid(): Promise<void> {
    const reqId = ++this.gridRequestId;
    this.gridLoading = true;
    this.gridLoadingMore = false;
    this.gridItems = [];
    this.gridPage = 0;
    this.gridHasMore = false;
    this.emit();
    try {
      const page = await this.api.get<ApiPage<Parameters<typeof mapMovie>[0]>>(
        this.buildGridQuery(1),
      );
      if (reqId !== this.gridRequestId) return;
      const items = Array.isArray(page?.items) ? page.items.map(mapMovie) : [];
      this.gridItems = items;
      this.gridPage = 1;
      this.gridTotal = page?.total ?? items.length;
      this.gridHasMore = items.length < this.gridTotal;
    } catch {
      if (reqId !== this.gridRequestId) return;
      this.gridItems = [];
      this.gridHasMore = false;
    } finally {
      if (reqId === this.gridRequestId) {
        this.gridLoading = false;
        this.gridLoaded = true;
        this.emit();
      }
    }
  }

  async loadMoreGrid(): Promise<void> {
    if (this.gridLoading || this.gridLoadingMore || !this.gridHasMore) return;
    const reqId = this.gridRequestId;
    this.gridLoadingMore = true;
    this.emit();
    try {
      const next = this.gridPage + 1;
      const page = await this.api.get<ApiPage<Parameters<typeof mapMovie>[0]>>(
        this.buildGridQuery(next),
      );
      if (reqId !== this.gridRequestId) return;
      const fresh = Array.isArray(page?.items) ? page.items.map(mapMovie) : [];
      if (fresh.length === 0) {
        this.gridHasMore = false;
      } else {
        const existing = new Set(this.gridItems.map((m) => m.id));
        const unique = fresh.filter((m) => !existing.has(m.id));
        this.gridItems = [...this.gridItems, ...unique];
        this.gridPage = next;
        this.gridTotal = page?.total ?? this.gridTotal;
        this.gridHasMore = this.gridItems.length < this.gridTotal;
      }
    } catch {
      if (reqId === this.gridRequestId) this.gridHasMore = false;
    } finally {
      if (reqId === this.gridRequestId) {
        this.gridLoadingMore = false;
        this.emit();
      }
    }
  }
}
