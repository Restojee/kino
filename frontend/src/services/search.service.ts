import { Service } from "../core/Service";

export class SearchService extends Service {
  private static _instance: SearchService;
  static getInstance(): SearchService {
    return (this._instance ??= new SearchService());
  }

  query: string = "";

  private constructor() {
    super();
  }

  getQuery(): string {
    return this.query;
  }

  setQuery(query: string): void {
    if (this.query === query) return;
    this.query = query;
    this.emit();
  }

  clear(): void {
    if (!this.query) return;
    this.query = "";
    this.emit();
  }
}
