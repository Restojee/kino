const API_URL = "http://localhost:8000/api";

export class ApiService {
  private static instance: ApiService;

  private tokenProvider: (() => string | null) | null = null;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setAuthTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    const token = this.tokenProvider?.();
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  private async parseError(response: Response): Promise<Error> {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) {
        message = Array.isArray(data.message)
          ? data.message.join(", ")
          : String(data.message);
      }
    } catch {}
    const err = new Error(message);
    (err as Error & { status?: number }).status = response.status;
    return err;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      headers: this.headers(),
    });
    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "PUT",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "PATCH",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!response.ok) throw await this.parseError(response);
  }
}
