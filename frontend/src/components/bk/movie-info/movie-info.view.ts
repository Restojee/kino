import {Component, ComponentProps, Renderable, resolveNode,} from "../../../core/Component";
import {$, $replace, Elements} from "../../../core/h";
import {GenresService} from "../../../services/genres.service";
import {MoviesService} from "../../../services/movies.service";
import {ExternalRating, ExternalRatingSource, Movie, MovieCategorySlug, MovieGenre, WatchStatus,} from "../../../types";
import {getStyles} from "../../../utils/styles.util";
import {UiButton} from "../../ui/ui-button/ui-button.view";
import {UiChip} from "../../ui/ui-chip/ui-chip.view";
import {UiHeading} from "../../ui/ui-heading/ui-heading.view";
import {UiInput} from "../../ui/ui-input/ui-input.view";
import {UiModal} from "../../ui/ui-modal/ui-modal.view";
import {UiSelect} from "../../ui/ui-select/ui-select.view";
import {UiText} from "../../ui/ui-text/ui-text.view";
import {UiTextarea} from "../../ui/ui-textarea/ui-textarea.view";
import {EditableField} from "../editable-field/editable-field.view";
import {Icon} from "../../../utils/icons.util";
import {formatDate, formatRuntime, formatVotes, truncateUrl,} from "../../../utils/format.util";
import {BreakpointService} from "../../../services/breakpoint.service";
import "./movie-info.scss";

const styles = getStyles("MovieInfo");

const CATEGORY_OPTIONS: { value: MovieCategorySlug; label: string }[] = [
  {value: "movies", label: "Фильм"},
  {value: "series", label: "Сериал"},
  {value: "cartoons", label: "Мультфильм"},
  {value: "anime", label: "Аниме"},
];

const CATEGORY_LABEL: Record<MovieCategorySlug, string> = {
  all: "Все",
  movies: "Фильм",
  series: "Сериал",
  cartoons: "Мультфильм",
  anime: "Аниме",
};

const RATING_SOURCE_LABEL: Record<ExternalRatingSource, string> = {
  imdb: "IMDb",
  kinopoisk: "Кинопоиск",
  tmdb: "TMDB",
  user: "Пользователи",
};

const GENRE_CATALOG = [
  "Фантастика",
  "Драма",
  "Приключения",
  "Комедия",
  "Триллер",
  "Боевик",
  "Ужасы",
  "Романтика",
  "Документальный",
  "Фэнтези",
  "Детектив",
  "Военный",
  "Мультфильм",
  "Аниме",
  "Биография",
  "Мюзикл",
  "Семейный",
  "Исторический",
  "Криминал",
  "Вестерн",
];

export interface MovieInfoProps extends ComponentProps {
  movie: Movie;
}

interface FieldRef {
  display: UiText;
  field: EditableField<any, any>;
}

export class MovieInfo extends Component<MovieInfoProps> {
  private genreModal: UiModal | null = null;
  private genreModalSelected?: Set<string>;
  private genreModalCustomInput?: UiInput;

  private titleDisplay!: UiHeading;
  private titleField!: EditableField<string, UiInput>;
  private origDisplay!: UiText;
  private origField!: EditableField<string | undefined, UiInput>;

  private descDisplay!: UiText;
  private descField!: EditableField<string, UiTextarea>;

  private genresEl!: HTMLElement;

  private watchedChip!: UiChip;
  private watchingChip!: UiChip;
  private skippedChip!: UiChip;
  private favoriteChip!: UiChip;

  private yearRef!: FieldRef;
  private durationRef!: FieldRef;
  private countryRef!: FieldRef;
  private ageRef!: FieldRef;
  private categoryRef!: FieldRef;
  private directorRef!: FieldRef;
  private releaseDateRef!: FieldRef;

  private posterLink!: HTMLAnchorElement;
  private posterField!: EditableField<string | undefined, UiInput>;
  private backdropLink!: HTMLAnchorElement;
  private backdropField!: EditableField<string | undefined, UiInput>;
  private trailerLink!: HTMLAnchorElement;
  private trailerField!: EditableField<string | undefined, UiInput>;

  private ratingsEl!: HTMLElement;

  protected onCreated(): void {
    this.addEffect(MoviesService.getInstance());
    void GenresService.getInstance().ensureLoaded();
  }

  protected onDestroyed(): void {
    this.genreModal?.destroy();
    this.genreModal = null;
  }

  protected template(): HTMLElement {
    const {movie} = this.props;

    this.titleDisplay = new UiHeading({
      level: "1",
      text: movie.title,
      class: `${styles()}__title`,
    });
    this.titleField = new EditableField<string, UiInput>({
      display: this.titleDisplay,
      editor: UiInput,
      editorProps: {value: movie.title, placeholder: "Название"},
      read: (i) => i.getValue().trim() || movie.title,
      reset: () => {
      },
      onSave: (title) => this.patch({title}),
      layout: "block",
    });

    this.origDisplay = new UiText({
      text: movie.originalTitle ?? "Добавить оригинальное название",
      class: `${styles()}__original`,
    });

    this.origField = new EditableField<string | undefined, UiInput>({
      display: this.origDisplay,
      editor: UiInput,
      editorProps: {
        value: movie.originalTitle ?? "",
        placeholder: "Original title",
      },
      read: (i) => i.getValue().trim(),
      reset: () => {
      },
      onSave: (originalTitle) => this.patch({originalTitle}),
      layout: "block",
    });

    this.descDisplay = new UiText({
      text: movie.description ?? "Описание отсутствует.",
      class: `${styles()}__description`,
    });
    this.descField = new EditableField<string, UiTextarea>({
      display: this.descDisplay,
      editor: UiTextarea,
      editorProps: {
        value: movie.description ?? "",
        rows: 6,
        placeholder: "Описание",
      },
      read: (t) => t.getValue(),
      reset: () => {
      },
      onSave: (description) => this.patch({description}),
      layout: "block",
    });

    this.genresEl = $(Elements.div, {class: `${styles()}__genres-row`});

    this.watchedChip = this.makeStatusChip("watched", "Смотрел", Icon.eye(14));
    this.watchingChip = this.makeStatusChip(
      "watching",
      "Смотрю",
      Icon.clock(14),
    );
    this.skippedChip = this.makeStatusChip(
      "skipped",
      "Не буду смотреть",
      Icon.x(14),
    );

    this.favoriteChip = new UiChip({
      label: "В избранном",
      icon: Icon.heart(14),
      variant: "outline",
      active: false,
      onClick: () =>
        MoviesService.getInstance().setFavorite(
          this.props.movie.id,
          !this.props.movie.isFavorite,
        ),
    });

    this.yearRef = this.makeField(movie.year ? String(movie.year) : "—");
    this.durationRef = this.makeField(
      movie.runtimeMinutes ? formatRuntime(movie.runtimeMinutes) : "—",
    );
    this.countryRef = this.makeField(movie.country ?? "—");
    this.ageRef = this.makeField(
      movie.ageRating ?? "—",
      `${styles()}__detail-age`,
    );
    this.categoryRef = this.makeField(CATEGORY_LABEL[movie.categorySlug]);
    this.directorRef = this.makeField(movie.director ?? "—");
    this.releaseDateRef = this.makeField(
      movie.releaseDate ? formatDate(movie.releaseDate) : "—",
    );

    this.yearRef.field = new EditableField({
      display: this.yearRef.display,
      editor: UiInput,
      editorProps: {
        type: "number",
        value: String(movie.year ?? ""),
        placeholder: "Год",
      },
      read: (i: UiInput) => {
        const n = Number(i.getValue());
        return Number.isFinite(n) && n > 0 ? n : undefined;
      },
      reset: () => {
      },
      onSave: (year: unknown) => this.patch({year: year as number}),
    });

    this.durationRef.field = new EditableField({
      display: this.durationRef.display,
      editor: UiInput,
      editorProps: {
        type: "number",
        value: String(movie.runtimeMinutes ?? ""),
        placeholder: "мин",
      },
      read: (i: UiInput) => {
        const n = Number(i.getValue());
        return Number.isFinite(n) && n > 0 ? n : undefined;
      },
      reset: () => {
      },
      onSave: (rm: unknown) => this.patch({runtimeMinutes: rm as number}),
    });

    this.countryRef.field = new EditableField({
      display: this.countryRef.display,
      editor: UiInput,
      editorProps: {
        value: movie.country ?? "",
        placeholder: "Страна",
      },
      read: (i: UiInput) => i.getValue().trim(),
      reset: () => {
      },
      onSave: (country: unknown) => this.patch({country: country as string}),
    });

    this.ageRef.field = new EditableField({
      display: this.ageRef.display,
      editor: UiInput,
      editorProps: {value: movie.ageRating ?? "", placeholder: "18+"},
      read: (i: UiInput) => i.getValue().trim(),
      reset: () => {
      },
      onSave: (ageRating: unknown) =>
        this.patch({ageRating: ageRating as string}),
    });

    this.categoryRef.field = new EditableField({
      display: this.categoryRef.display,
      editor: UiSelect,
      editorProps: {options: CATEGORY_OPTIONS, value: movie.categorySlug},
      read: (s: UiSelect) => s.getValue() as MovieCategorySlug,
      reset: () => {
      },
      onSave: (cs: unknown) =>
        this.patch({categorySlug: cs as MovieCategorySlug}),
    });

    this.directorRef.field = new EditableField({
      display: this.directorRef.display,
      editor: UiInput,
      editorProps: {
        value: movie.director ?? "",
        placeholder: "Режиссёр",
      },
      read: (i: UiInput) => i.getValue().trim(),
      reset: () => {
      },
      onSave: (director: unknown) =>
        this.patch({director: director as string}),
    });

    this.releaseDateRef.field = new EditableField({
      display: this.releaseDateRef.display,
      editor: UiInput,
      editorProps: {
        type: "date",
        value: movie.releaseDate?.slice(0, 10) ?? "",
      },
      read: (i: UiInput) => i.getValue(),
      reset: () => {
      },
      onSave: (rd: unknown) => this.patch({releaseDate: rd as string}),
    });

    const posterRes = this.makeUrlField(
      movie.poster ?? "",
      "https://…/poster.jpg",
      (v) => this.patch({poster: v ?? ""}),
    );
    const backdropRes = this.makeUrlField(movie.backdropUrl ?? "", "...", (v) =>
      this.patch({backdropUrl: v}),
    );
    const trailerRes = this.makeUrlField(movie.trailerUrl ?? "", "...", (v) =>
      this.patch({trailerUrl: v}),
    );

    this.posterLink = posterRes.link;
    this.posterField = posterRes.field;
    this.backdropLink = backdropRes.link;
    this.backdropField = backdropRes.field;
    this.trailerLink = trailerRes.link;
    this.trailerField = trailerRes.field;

    // --- Ratings ---
    this.ratingsEl = $(Elements.div, {class: `${styles()}__ratings`});

    return $(
      Elements.div,
      {class: styles()},
      $(
        Elements.div,
        {class: `${styles()}__header`},
        this.titleField,
        this.origField,
      ),
      this.section("Описание", this.descField),
      this.section("Жанры", this.genresEl),
      this.section(
        "Статус",
        $(
          Elements.div,
          {class: `${styles()}__toggles`},
          this.watchedChip,
          this.watchingChip,
          this.skippedChip,
          this.favoriteChip,
        ),
      ),
      this.section(
        "О фильме",
        $(
          Elements.div,
          {class: `${styles()}__details`},
          this.detailRow(Icon.calendar(16), "Год выхода", this.yearRef.field),
          this.detailRow(
            Icon.clock(16),
            "Длительность",
            this.durationRef.field,
          ),
          this.detailRow(Icon.globe(16), "Страна", this.countryRef.field),
          this.detailRow(Icon.shield(16), "Возраст", this.ageRef.field),
          this.detailRow(Icon.film(16), "Категория", this.categoryRef.field),
          this.detailRow(Icon.user(16), "Режиссёр", this.directorRef.field),
          this.detailRow(
            Icon.calendar(16),
            "Дата выхода",
            this.releaseDateRef.field,
          ),
        ),
      ),
      this.section(
        "Медиа",
        $(
          Elements.div,
          {class: `${styles()}__details ${styles()}__details--media`},
          this.detailRow(Icon.film(16), "Постер", posterRes.field),
          this.detailRow(Icon.film(16), "Фон", backdropRes.field),
          this.detailRow(Icon.film(16), "Трейлер", trailerRes.field),
        ),
      ),
      this.section("Рейтинги", this.ratingsEl),
    );
  }

  protected onUpdated(): void {
    const movie = this.props.movie;

    // Header
    this.titleDisplay.setText(movie.title);
    this.titleField.setEditorProps({
      value: movie.title,
      placeholder: "Название",
    });
    this.origDisplay.setText(
      movie.originalTitle ?? "Добавить оригинальное название",
    );
    this.origField.setEditorProps({
      value: movie.originalTitle ?? "",
      placeholder: "Original title",
    });

    // Description
    this.descDisplay.setText(movie.description ?? "Описание отсутствует.");
    this.descField.setEditorProps({
      value: movie.description ?? "",
      rows: 6,
      placeholder: "Описание",
    });

    // Genres — structural swap
    this.syncGenres(movie);

    // Toggle bar
    const ws: WatchStatus =
      movie.watchStatus ?? (movie.isWatched ? "watched" : "none");
    this.watchedChip.setActive(ws === "watched");
    this.watchingChip.setActive(ws === "watching");
    this.skippedChip.setActive(ws === "skipped");
    this.favoriteChip.setActive(!!movie.isFavorite);

    // About
    this.yearRef.display.setText(movie.year ? String(movie.year) : "—");
    this.yearRef.field.setEditorProps({
      type: "number",
      value: String(movie.year ?? ""),
      placeholder: "Год",
    });
    this.durationRef.display.setText(
      movie.runtimeMinutes ? formatRuntime(movie.runtimeMinutes) : "—",
    );
    this.durationRef.field.setEditorProps({
      type: "number",
      value: String(movie.runtimeMinutes ?? ""),
      placeholder: "мин",
    });
    this.countryRef.display.setText(movie.country ?? "—");
    this.countryRef.field.setEditorProps({
      value: movie.country ?? "",
      placeholder: "Страна",
    });
    this.ageRef.display.setText(movie.ageRating ?? "—");
    this.ageRef.field.setEditorProps({
      value: movie.ageRating ?? "",
      placeholder: "18+",
    });
    this.categoryRef.display.setText(CATEGORY_LABEL[movie.categorySlug]);
    this.categoryRef.field.setEditorProps({
      options: CATEGORY_OPTIONS,
      value: movie.categorySlug,
    });
    this.directorRef.display.setText(movie.director ?? "—");
    this.directorRef.field.setEditorProps({
      value: movie.director ?? "",
      placeholder: "Режиссёр",
    });
    this.releaseDateRef.display.setText(
      movie.releaseDate ? formatDate(movie.releaseDate) : "—",
    );
    this.releaseDateRef.field.setEditorProps({
      type: "date",
      value: movie.releaseDate?.slice(0, 10) ?? "",
    });

    this.syncUrlField(
      this.posterLink,
      this.posterField,
      movie.poster ?? "",
      "https://…/poster.jpg",
    );
    this.syncUrlField(
      this.backdropLink,
      this.backdropField,
      movie.backdropUrl ?? "",
      "https://…/backdrop.jpg",
    );
    this.syncUrlField(
      this.trailerLink,
      this.trailerField,
      movie.trailerUrl ?? "",
      "https://youtube.com/…",
    );

    this.syncRatings(movie);
  }

  private patch(p: Partial<Movie>): void {
    MoviesService.getInstance().updateMovie(this.props.movie.id, p);
  }

  private section(title: string, body: Renderable): HTMLElement {
    return $(
      Elements.div,
      {class: `${styles()}__section`},
      new UiHeading({
        level: "3",
        text: title,
        class: `${styles()}__section-title`,
      }),
      body,
    );
  }

  private detailRow(
    icon: Renderable,
    label: string,
    value: Renderable,
  ): HTMLElement {
    const isMobile = BreakpointService.isMobile;
    return $(
      Elements.div,
      {class: `${styles()}__detail`},
      $(Elements.span, {class: `${styles()}__detail-icon`}, icon),
      new UiText({
        tag: Elements.span,
        size: isMobile ? "sm" : undefined,
        text: label,
        class: `${styles()}__detail-label`,
      }),
      value,
    );
  }

  private makeField(text: string, cls?: string): FieldRef {
    return {
      display: new UiText({
        tag: Elements.span,
        class: cls ?? `${styles()}__detail-value`,
        text,
      }),
      field: null!,
    };
  }

  private makeStatusChip(
    status: WatchStatus,
    label: string,
    icon: HTMLElement,
  ): UiChip {
    return new UiChip({
      label,
      icon,
      variant: "outline",
      active: false,
      onClick: () => {
        const m = this.props.movie;
        const current: WatchStatus =
          m.watchStatus ?? (m.isWatched ? "watched" : "none");
        void MoviesService.getInstance().setWatchStatus(
          m.id,
          current === status ? "none" : status,
        );
      },
    });
  }

  private makeUrlField(
    current: string,
    placeholder: string,
    save: (v: string | undefined) => void,
  ) {
    const link = $(
      Elements.a,
      {
        class: `${styles()}__detail-link`,
        href: current || "#",
        target: "_blank",
        rel: "noreferrer noopener",
      },
      current ? truncateUrl(current) : "—",
    ) as HTMLAnchorElement;
    const display = $(
      Elements.span,
      {class: `${styles()}__detail-value`},
      link,
    );
    const field = new EditableField<string | undefined, UiInput>({
      display,
      editor: UiInput,
      editorProps: {type: "url", value: current, placeholder},
      read: (i) => i.getValue().trim(),
      reset: () => {
      },
      onSave: save,
    });
    return {link, field};
  }

  private syncUrlField(
    link: HTMLAnchorElement,
    field: EditableField<string | undefined, UiInput>,
    value: string,
    placeholder: string,
  ): void {
    link.href = value || "#";
    link.textContent = value ? truncateUrl(value) : "—";
    field.setEditorProps({type: "url", value, placeholder});
  }

  private syncGenres(movie: Movie): void {
    const genres = movie.genres ?? [];
    const chips =
      genres.length > 0
        ? genres.map((g) => new UiChip({label: g.name, variant: "soft"}))
        : [
          new UiText({
            tag: Elements.span,
            text: "Жанры не указаны",
            class: `${styles()}__genre-empty`,
          }),
        ];
    $replace(
      this.genresEl,
      $(Elements.div, {class: `${styles()}__genres`}, ...chips),
      new UiButton({
        variant: "ghost",
        icon: Icon.pencil(14),
        title: "Редактировать жанры",
        ariaLabel: "Редактировать жанры",
        class: `${styles()}__genre-edit`,
        onClick: () => this.openGenreModal(movie),
      }),
    );
  }

  private syncRatings(movie: Movie): void {
    const external = (movie.ratings ?? []).filter((r) => r.source !== "user");
    $replace(
      this.ratingsEl,
      this.userRatingCard(movie),
      ...external.map((r) => this.externalRatingCard(r)),
    );
  }

  private userRatingCard(movie: Movie): HTMLElement {
    const valueText =
      movie.userScore != null ? movie.userScore.toFixed(1) : "—";
    return $(
      Elements.div,
      {class: `${styles()}__rating ${styles()}__rating--user`},
      new UiText({
        tag: Elements.span,
        text: "Моя оценка",
        class: `${styles()}__rating-label`,
      }),
      $(
        Elements.div,
        {class: `${styles()}__rating-value`},
        Icon.star(18),
        new UiText({tag: Elements.span, text: valueText}),
      ),
    );
  }

  private externalRatingCard(rating: ExternalRating): HTMLElement {
    return $(
      Elements.div,
      {class: `${styles()}__rating`},
      new UiText({
        tag: Elements.span,
        text: RATING_SOURCE_LABEL[rating.source],
        class: `${styles()}__rating-label`,
      }),
      $(
        Elements.div,
        {class: `${styles()}__rating-value`},
        Icon.star(18),
        new UiText({tag: Elements.span, text: rating.value.toFixed(1)}),
      ),
      rating.votes != null
        ? new UiText({
          tag: Elements.span,
          text: formatVotes(rating.votes),
          class: `${styles()}__rating-votes`,
        })
        : null,
    );
  }

  private openGenreModal(movie: Movie): void {
    if (this.genreModal) return;
    this.genreModalSelected = new Set(
      movie.genres?.map((g) => g.name.toLowerCase()),
    );
    this.genreModal = new UiModal({
      title: "Жанры",
      body: this.buildGenreModalBody(movie),
      footer: this.buildGenreModalFooter(movie),
      onClose: () => this.closeGenreModal(),
    });
    this.genreModal.mount(document.body);
  }

  private closeGenreModal(): void {
    this.genreModal?.destroy();
    this.genreModal = null;
    this.genreModalSelected = undefined;
    this.genreModalCustomInput = undefined;
  }

  private refreshGenreModalBody(movie: Movie): void {
    if (!this.genreModal) return;
    const oldBody = resolveNode(this.genreModal).querySelector(
      `.${styles()}__modal-body`,
    );
    if (oldBody) oldBody.replaceWith(this.buildGenreModalBody(movie));
  }

  private toggleGenreInModal(name: string, movie: Movie): void {
    const set = this.genreModalSelected ?? new Set();
    const key = name.toLowerCase();
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this.genreModalSelected = set;
    this.refreshGenreModalBody(movie);
  }

  private async saveGenreModal(_movie: Movie): Promise<void> {
    const selected = this.genreModalSelected ?? new Set();
    const genres = GenresService.getInstance();
    const resolved = await Promise.all(
      [...selected].map(async (key) =>
        genres.resolveByName(
          GENRE_CATALOG.find((s) => s.toLowerCase() === key) ?? key,
        ),
      ),
    );
    this.patch({genres: resolved.filter((g): g is MovieGenre => g !== null)});
    this.closeGenreModal();
  }

  private buildGenreModalBody(movie: Movie): HTMLElement {
    const selected = this.genreModalSelected ?? new Set();
    this.genreModalCustomInput = new UiInput({placeholder: "Свой жанр"});
    const customInput = this.genreModalCustomInput;

    const catalogSet = new Set(GENRE_CATALOG.map((s) => s.toLowerCase()));
    const extra = (movie.genres ?? [])
      .map((g) => g.name)
      .filter((n) => !catalogSet.has(n.toLowerCase()));
    const chips = [...GENRE_CATALOG, ...extra].map(
      (name) =>
        new UiChip({
          label: name,
          variant: selected.has(name.toLowerCase()) ? "solid" : "soft",
          active: selected.has(name.toLowerCase()),
          onClick: () => this.toggleGenreInModal(name, movie),
        }),
    );

    const commitCustom = (): void => {
      const raw = customInput.getValue().trim();
      if (!raw) return;
      (this.genreModalSelected ?? new Set()).add(raw.toLowerCase());
      customInput.setValue("");
      this.refreshGenreModalBody(movie);
    };

    return $(
      Elements.div,
      {class: `${styles()}__modal-body`},
      new UiText({
        text: "Отметьте подходящие жанры или добавьте свой:",
        class: `${styles()}__modal-hint`,
      }),
      $(Elements.div, {class: `${styles()}__modal-chips`}, ...chips),
      $(
        Elements.div,
        {class: `${styles()}__modal-custom`},
        customInput,
        new UiButton({
          type: "button",
          variant: "secondary",
          text: "Добавить свой",
          onClick: () => commitCustom(),
        }),
      ),
    );
  }

  private buildGenreModalFooter(movie: Movie): HTMLElement {
    return $(
      Elements.div,
      {class: `${styles()}__modal-footer`},
      new UiButton({
        type: "button",
        variant: "secondary",
        text: "Отмена",
        onClick: () => this.closeGenreModal(),
      }),
      new UiButton({
        type: "button",
        variant: "primary",
        text: "Сохранить",
        onClick: () => {
          void this.saveGenreModal(movie);
        },
      }),
    );
  }
}
