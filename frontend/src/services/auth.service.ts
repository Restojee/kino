import { ApiService } from "../api/api.service";
import { Service } from "../core/Service";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin";
}

interface ApiAuthResponse {
  accessToken: string;
  user: AuthUser;
}

const STORAGE_KEY = "bk.auth";

export class AuthService extends Service {
  private static _instance: AuthService;
  static getInstance(): AuthService {
    return (this._instance ??= new AuthService());
  }

  user: AuthUser | null = null;
  token: string | null = null;
  loading: boolean = false;
  error: string | null = null;

  private api = ApiService.getInstance();

  private constructor() {
    super();
    this.hydrateFromStorage();
    this.api.setAuthTokenProvider(() => this.token);
  }

  private hydrateFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
      if (parsed?.token && parsed?.user) {
        this.token = parsed.token;
        this.user = parsed.user;
      }
    } catch {}
  }

  private persist(): void {
    if (this.token && this.user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: this.token, user: this.user }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getUser(): AuthUser | null {
    return this.user;
  }
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }
  isAdmin(): boolean {
    return this.user?.role === "admin";
  }
  getError(): string | null {
    return this.error;
  }
  isLoading(): boolean {
    return this.loading;
  }

  async login(email: string, password: string): Promise<void> {
    this.loading = true;
    this.error = null;
    this.emit();
    try {
      const res = await this.api.post<ApiAuthResponse>("auth/login", {
        email,
        password,
      });
      this.token = res.accessToken;
      this.user = res.user;
      this.persist();
    } catch (e) {
      this.error = this.formatError(e, "Неверный email или пароль");
      throw e;
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  async register(email: string, password: string, name: string): Promise<void> {
    this.loading = true;
    this.error = null;
    this.emit();
    try {
      const res = await this.api.post<ApiAuthResponse>("auth/register", {
        email,
        password,
        name,
      });
      this.token = res.accessToken;
      this.user = res.user;
      this.persist();
    } catch (e) {
      this.error = this.formatError(e, "Не удалось зарегистрироваться");
      throw e;
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    this.error = null;
    this.persist();
    this.emit();
  }

  private formatError(e: unknown, fallback: string): string {
    if (e instanceof Error && e.message) return e.message;
    return fallback;
  }
}
