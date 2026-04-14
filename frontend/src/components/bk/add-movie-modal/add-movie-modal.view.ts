import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $clear, $replace, Elements } from "../../../core/h";
import { ApiService } from "../../../api/api.service";
import { AuthService } from "../../../services/auth.service";
import { MoviesService } from "../../../services/movies.service";
import { MovieCategorySlug } from "../../../types";
import { getStyles } from "../../../utils/styles.util";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiHeading } from "../../ui/ui-heading/ui-heading.view";
import { UiInput } from "../../ui/ui-input/ui-input.view";
import { UiModal } from "../../ui/ui-modal/ui-modal.view";
import { UiSelect } from "../../ui/ui-select/ui-select.view";
import { UiSpinner } from "../../ui/ui-spinner/ui-spinner.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { SearchResultCard } from "../search-result-card/search-result-card.view";
import "./add-movie-modal.scss";

const styles = getStyles("AddMovieModal");

interface TmdbSearchItem {
  externalId: string;
  title: string;
  originalTitle?: string;
  year?: number;
  posterUrl?: string;
  description?: string;
  tmdbRating?: number;
  alreadyAdded?: boolean;
  existingId?: string | null;
}

type Step = "search" | "preview";

export interface AddMovieModalProps extends ComponentProps {
  onClose: () => void;
  onImported?: () => void;
}

const SEARCH_DEBOUNCE_MS = 350;

const CATEGORY_OPTIONS = [
  { value: "movies", label: "Фильм" },
  { value: "series", label: "Сериал" },
  { value: "cartoons", label: "Мультфильм" },
  { value: "anime", label: "Аниме" },
];

export class AddMovieModal extends Component<AddMovieModalProps> {
  declare private step: Step;
  declare private query: string;
  declare private category: MovieCategorySlug;
  declare private loading: boolean;
  declare private importing: boolean;
  declare private error: string | null;
  declare private results: TmdbSearchItem[];
  declare private selected: TmdbSearchItem | null;

  private searchTimer: number | null = null;

  declare private modal: UiModal;
  declare private searchInput: UiInput;
  declare private categorySelect: UiSelect;
  declare private searchPanel: HTMLElement;
  declare private previewPanel: HTMLElement;
  declare private resultsHost: HTMLElement;
  declare private confirmBtn: UiButton;
  declare private backBtn: UiButton;
  declare private previewBody: HTMLElement;
  declare private previewError: HTMLDivElement;

  constructor(props: AddMovieModalProps) {
    super(props);
    this.step = "search";
    this.query = "";
    this.category = "movies";
    this.loading = false;
    this.importing = false;
    this.error = null;
    this.results = [];
    this.selected = null;
  }

  protected onDestroyed(): void {
    this.modal?.destroy();
  }

  protected template(): Renderable {
    this.searchPanel = this.buildSearchPanel();
    this.previewPanel = this.buildPreviewPanel();
    this.previewPanel.style.display = "none";

    const body = $(
      Elements.div,
      { class: styles() },
      this.searchPanel,
      this.previewPanel,
    );

    this.modal = new UiModal({
      title: "Фильм",
      body,
      onClose: () => this.props.onClose(),
    });

    this.renderResults();
    queueMicrotask(() => this.searchInput.getInput().focus());
    return this.modal;
  }

  private buildSearchPanel(): HTMLElement {
    this.searchInput = this.buildSearchInput();
    this.categorySelect = this.buildCategorySelect();
    this.resultsHost = $(Elements.div, { class: `${styles()}__results-host` });

    return $(
      Elements.div,
      { class: `${styles()}__search` },
      this.buildSearchHead(),
      this.searchInput,
      this.resultsHost,
    );
  }

  private buildSearchInput(): UiInput {
    return new UiInput({
      placeholder: this.searchPlaceholder(),
      value: this.query,
      onInput: (v) => {
        this.query = v;
        this.debouncedSearch();
      },
      trailing: new UiSpinner({ size: 18 }),
    });
  }

  private buildCategorySelect(): UiSelect {
    return new UiSelect({
      options: CATEGORY_OPTIONS,
      value: this.category,
      onChange: (v: string) => {
        this.category = v as MovieCategorySlug;
        this.searchInput.getInput().placeholder = this.searchPlaceholder();
        this.debouncedSearch();
      },
    });
  }

  private buildSearchHead(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__search-head` },
      new UiText({
        tag: Elements.span,
        text: "Ищем в категории:",
        variant: "label",
        class: `${styles()}__category-label`,
      }),
      this.categorySelect,
    );
  }

  private searchPlaceholder(): string {
    return this.category === "movies"
      ? "Название фильма (например, «Интерстеллар»)"
      : "Название (например, «Аркейн»)";
  }

  private buildPreviewPanel(): HTMLElement {
    this.confirmBtn = new UiButton({
      type: "button",
      variant: "primary",
      text: "Добавить в библиотеку",
      onClick: () => this.confirmImport(),
    });
    this.backBtn = new UiButton({
      type: "button",
      variant: "secondary",
      text: "Назад к поиску",
      onClick: () => this.backToSearch(),
    });

    this.previewError = $(Elements.div, {
      class: `${styles()}__state ${styles()}__state--error`,
    });

    this.previewError.style.display = "none";

    this.previewBody = $(Elements.div, { class: `${styles()}__preview-body` });

    return $(
      Elements.div,
      { class: `${styles()}__preview` },
      this.previewBody,
      this.previewError,
      this.buildPreviewActions(),
    );
  }

  private buildPreviewActions(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__preview-actions` },
      this.backBtn,
      this.confirmBtn,
    );
  }

  private setStep(step: Step): void {
    if (this.step === step) return;
    this.step = step;
    const isSearch = step === "search";
    this.searchPanel.style.display = isSearch ? "" : "none";
    this.previewPanel.style.display = isSearch ? "none" : "";
    this.setTitle(isSearch ? "Фильм" : "Подтвердите добавление");
    if (isSearch) queueMicrotask(() => this.searchInput.getInput().focus());
    else this.renderPreviewBody();
  }

  private setError(err: string | null): void {
    if (this.error === err) return;
    this.error = err;
    if (this.step === "search") {
      this.renderResults();
      return;
    }
    if (err) {
      this.previewError.textContent = err;
      this.previewError.style.display = "";
    } else {
      this.previewError.textContent = "";
      this.previewError.style.display = "none";
    }
  }

  private setLoading(loading: boolean): void {
    if (this.loading === loading) return;
    this.loading = loading;
    this.applyLoadingVisual();
    this.renderResults();
  }

  private applyLoadingVisual(): void {
    if (!this.searchInput) return;
    this.searchInput.toggleClass(`${styles()}__input--loading`, this.loading);
  }

  private setImporting(busy: boolean): void {
    if (this.importing === busy) return;
    this.importing = busy;
    this.confirmBtn.setDisabled(busy);
    this.confirmBtn.setText(busy ? "Добавляем…" : "Добавить в библиотеку");
  }

  private setResults(results: TmdbSearchItem[]): void {
    this.results = results;
    this.renderResults();
  }

  private setSelected(m: TmdbSearchItem | null): void {
    this.selected = m;
    this.renderPreviewBody();
  }

  private setTitle(title: string): void {
    this.modal.setTitle(title);
  }

  private renderResults(): void {
    $replace(this.resultsHost, this.buildResultsList());
  }

  private buildResultsList(): HTMLElement {
    if (this.error && this.step === "search")
      return this.buildState(this.error, true);
    if (!this.query?.trim())
      return this.buildState("Введите название — ищем в публичной базе TMDB");
    if (this.loading && this.results.length === 0) {
      return $(Elements.div, { class: `${styles()}__results` });
    }
    if (this.results.length === 0)
      return this.buildState(
        "Ничего не нашли. Проверь название или попробуй на оригинале.",
      );

    return $(
      Elements.div,
      { class: `${styles()}__results` },
      ...this.results.map((r) => this.buildResultCard(r)),
    );
  }

  private buildState(text: string, isError = false): HTMLElement {
    const cls = clsx(
      `${styles()}__state`,
      isError && `${styles()}__state--error`,
    );
    return $(Elements.div, { class: cls }, text);
  }

  private buildResultCard(item: TmdbSearchItem): SearchResultCard {
    return new SearchResultCard({
      item,
      onClick: () => this.pickResult(item),
    });
  }

  private renderPreviewBody(): void {
    const m = this.selected;
    if (!m) {
      $clear(this.previewBody);
      return;
    }
    $replace(
      this.previewBody,
      this.buildPreviewPoster(m),
      this.buildPreviewText(m),
    );
  }

  private buildPreviewPoster(m: TmdbSearchItem): HTMLElement {
    return m.posterUrl
      ? $(Elements.img, {
          class: `${styles()}__preview-poster`,
          src: m.posterUrl,
          alt: m.title,
        })
      : $(
          Elements.div,
          {
            class: `${styles()}__preview-poster ${styles()}__poster-placeholder`,
          },
          "🎬",
        );
  }

  private buildPreviewText(m: TmdbSearchItem): HTMLElement {
    const categoryLabel =
      CATEGORY_OPTIONS.find((o) => o.value === this.category)?.label ??
      this.category;

    return $(
      Elements.div,
      { class: `${styles()}__preview-text` },
      new UiHeading({
        level: "2",
        text: m.title,
        class: `${styles()}__preview-title`,
      }),
      m.originalTitle && m.originalTitle !== m.title
        ? new UiText({
            text: m.originalTitle,
            class: `${styles()}__preview-original`,
          })
        : null,
      this.buildPreviewMeta(m),
      m.description
        ? new UiText({
            text: m.description,
            class: `${styles()}__preview-desc`,
          })
        : null,
      $(
        Elements.div,
        { class: `${styles()}__category-row` },
        new UiText({
          tag: Elements.span,
          text: "Категория:",
          variant: "label",
          class: `${styles()}__category-label`,
        }),
        new UiText({
          tag: Elements.span,
          text: categoryLabel,
          class: `${styles()}__category-value`,
        }),
      ),
    );
  }

  private buildPreviewMeta(m: TmdbSearchItem): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__preview-meta` },
      m.year ? new UiText({ tag: Elements.span, text: String(m.year) }) : null,
      m.tmdbRating
        ? new UiText({
            tag: Elements.span,
            text: `★ ${m.tmdbRating.toFixed(1)}`,
            class: `${styles()}__rating`,
          })
        : null,
    );
  }

  private pickResult(item: TmdbSearchItem): void {
    if (item.alreadyAdded) return;
    this.setSelected(item);
    this.setError(null);
    this.setStep("preview");
  }

  private backToSearch(): void {
    this.setSelected(null);
    this.setError(null);
    this.setStep("search");
  }

  private debouncedSearch(): void {
    if (this.searchTimer != null) window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(
      () => this.runSearch(),
      SEARCH_DEBOUNCE_MS,
    );
  }

  private async runSearch(): Promise<void> {
    const q = this.query.trim();
    if (!q) {
      this.setResults([]);
      this.setLoading(false);
      this.setError(null);
      return;
    }
    this.setLoading(true);
    this.setError(null);
    try {
      const res = await ApiService.getInstance().get<TmdbSearchItem[]>(
        `movies/search?q=${encodeURIComponent(q)}&source=tmdb&categorySlug=${this.category}`,
      );
      if (q === this.query.trim()) {
        this.setResults(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      this.setError(e instanceof Error ? e.message : "Ошибка поиска");
      this.setResults([]);
    } finally {
      this.setLoading(false);
    }
  }

  private async confirmImport(): Promise<void> {
    if (!this.selected || this.importing) return;

    if (!AuthService.getInstance().isAuthenticated()) {
      this.setError("Войдите, чтобы добавлять фильмы");
      return;
    }

    this.setImporting(true);
    this.setError(null);

    try {
      await ApiService.getInstance().post("movies/import", {
        source: "tmdb",
        externalId: this.selected.externalId,
        categorySlug: this.category,
      });
      await MoviesService.getInstance().load();
      this.props.onImported?.();
      this.props.onClose();
    } catch (e) {
      this.setError(e instanceof Error ? e.message : "Не удалось добавить");
    } finally {
      this.setImporting(false);
    }
  }
}
