import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { ApiService } from "../../../api/api.service";
import { AuthService } from "../../../services/auth.service";
import { MoviesService } from "../../../services/movies.service";
import { Movie, MovieReview } from "../../../types";
import { getStyles } from "../../../utils/styles.util";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiHeading } from "../../ui/ui-heading/ui-heading.view";
import { UiModal } from "../../ui/ui-modal/ui-modal.view";
import { UiRating } from "../../ui/ui-rating/ui-rating.view";
import { UiRichEditor } from "../../ui/ui-rich-editor/ui-rich-editor.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { Icon, IconSize } from "../../../utils/icons.util";
import { BreakpointService } from "../../../services/breakpoint.service";
import { ReviewCard } from "../review-card/review-card.view";
import "./movie-reviews.scss";

const styles = getStyles("MovieReviews");

export interface MovieReviewsProps extends ComponentProps {
  movie: Movie;
}

export class MovieReviews extends Component<MovieReviewsProps> {
  declare private ratingField: UiRating;
  declare private editor: UiRichEditor;
  private reviewModal: UiModal | null = null;
  private rootEl!: HTMLElement;

  protected state = {
    editing: false,
    editingId: undefined as string | undefined,
    formError: undefined as string | undefined,
    submitting: false,
  };

  constructor(props: MovieReviewsProps) {
    const ratingField = new UiRating({ max: 10, value: 8 });
    const editor = new UiRichEditor({
      placeholder: "Поделитесь впечатлениями…",
    });

    const handlers = { submit: () => {} };
    const isMobile = BreakpointService.isMobile;
    const submitBtn = new UiButton({
      type: "button",
      variant: "primary",
      fullWidth: isMobile,
      text: "Опубликовать отзыв",
      onClick: () => handlers.submit(),
    });

    super({
      ...props,
      children: {
        rating: ratingField,
        editor: editor,
        submit: submitBtn,
      },
    });

    this.ratingField = ratingField;
    this.editor = editor;
    void submitBtn;

    handlers.submit = () => {
      void this.handleSubmit();
    };
  }

  protected onCreated(): void {
    this.addEffect(MoviesService.getInstance());
    this.addEffect(AuthService.getInstance());
    this.addEffect(BreakpointService);
  }

  private get isMobile() {
    return BreakpointService.isMobile;
  }

  protected template(): HTMLElement {
    this.rootEl = $(Elements.div, { class: styles() });
    return this.rootEl;
  }

  protected onUpdated(): void {
    $replace(this.rootEl, this.renderForm(), this.renderList());
  }

  private renderList(): HTMLElement {
    const { movie } = this.props;
    const reviews = movie.reviews ?? [];

    return $(
      Elements.div,
      { class: `${styles()}__list` },
      $(
        Elements.div,
        { class: `${styles()}__list-header` },
        new UiHeading({
          level: "4",
          size: this.isMobile ? "sm" : undefined,
          align: "center",
          text:
            reviews.length > 0
              ? `Отзывы · ${reviews.length}`
              : "Отзывов пока нет",
          class: `${styles()}__list-title`,
        }),
      ),
      reviews.length
        ? $(
            Elements.div,
            { class: `${styles()}__list-items` },
            ...reviews.map((r) => this.buildReviewCard(r, movie.id)),
          )
        : new UiText({
            text: "Станьте первым, кто оставит отзыв.",
            size: this.isMobile ? "sm" : undefined,
            align: "center",
            class: `${styles()}__empty`,
          }),
    );
  }

  private buildReviewCard(review: MovieReview, movieId: string): ReviewCard {
    const user = AuthService.getInstance().getUser();
    const isOwn = !!user && review.userId === user.id;

    return new ReviewCard({
      review,
      isOwn,
      canEdit: isOwn && !this.state.editing,
      onDelete: async () => {
        try {
          await ApiService.getInstance().delete(`reviews/${review.id}`);
          await MoviesService.getInstance().loadMovieById(movieId);
        } catch {}
      },
      onEdit: () => this.startEdit(review),
    });
  }

  private renderForm(): Renderable | null {
    const { movie } = this.props;
    const user = AuthService.getInstance().getUser();

    if (!user) {
      return $(
        Elements.div,
        { class: `${styles()}__form ${styles()}__form--locked` },
        new UiText({
          text: "Войдите, чтобы оставить отзыв.",
          class: `${styles()}__locked-text`,
        }),
      );
    }

    const own = (movie.reviews ?? []).find((r) => r.userId === user.id);
    if (own && !this.state.editing) {
      if (this.isMobile) {
        return new UiButton({
          variant: "primary",
          fullWidth: true,
          text: "Оставить отзыв",
          icon: Icon.pencil(IconSize.sm),
          onClick: () => this.openReviewModal(),
        });
      }
      return null;
    }

    if (this.isMobile) {
      return new UiButton({
        variant: "primary",
        fullWidth: true,
        text: this.state.editing ? "Редактировать отзыв" : "Оставить отзыв",
        icon: Icon.pencil(IconSize.sm),
        onClick: () => this.openReviewModal(),
      });
    }

    return this.buildFormInline();
  }

  private buildFormInline(): HTMLElement {
    const { children } = this.props;
    const labelSize = this.isMobile ? "xs" : undefined;

    const ratingField = $(
      Elements.div,
      { class: `${styles()}__field` },
      new UiText({
        tag: Elements.span,
        size: labelSize,
        text: "Оценка",
        variant: "label",
        class: `${styles()}__label`,
      }),
      children!.rating,
    );

    const editorField = $(
      Elements.div,
      { class: `${styles()}__field` },
      new UiText({
        tag: Elements.span,
        size: labelSize,
        text: "Текст отзыва",
        variant: "label",
        class: `${styles()}__label`,
      }),
      children!.editor,
    );

    const errorEl = this.state.formError
      ? new UiText({ text: this.state.formError, class: `${styles()}__error` })
      : null;

    const actions = $(
      Elements.div,
      { class: `${styles()}__actions` },
      children!.submit,
      this.state.editing
        ? new UiButton({
            type: "button",
            variant: "secondary",
            text: "Отмена",
            onClick: () => this.cancelEdit(),
          })
        : null,
    );

    return $(
      Elements.div,
      { class: `${styles()}__form` },
      $(
        Elements.div,
        { class: `${styles()}__form-header` },
        $(
          Elements.span,
          { class: `${styles()}__icon` },
          Icon.pencil(IconSize.md),
        ),
        new UiHeading({
          level: "4",
          text: this.state.editing ? "Редактировать отзыв" : "Оставить отзыв",
          class: `${styles()}__form-title`,
        }),
      ),
      ratingField,
      editorField,
      errorEl,
      actions,
    );
  }

  private buildFormBody(): HTMLElement {
    const { children } = this.props;

    const ratingField = $(
      Elements.div,
      { class: `${styles()}__field` },
      new UiText({
        tag: Elements.span,
        size: "xs",
        text: "Оценка",
        variant: "label",
        class: `${styles()}__label`,
      }),
      children!.rating,
    );

    const editorField = $(
      Elements.div,
      { class: `${styles()}__field` },
      new UiText({
        tag: Elements.span,
        size: "xs",
        text: "Текст отзыва",
        variant: "label",
        class: `${styles()}__label`,
      }),
      children!.editor,
    );

    const errorEl = this.state.formError
      ? new UiText({ text: this.state.formError, class: `${styles()}__error` })
      : null;

    return $(
      Elements.div,
      { class: `${styles()}__form-body` },
      ratingField,
      editorField,
      errorEl,
    );
  }

  private openReviewModal(): void {
    if (this.reviewModal) return;

    const footer = $(
      Elements.div,
      { class: `${styles()}__modal-footer` },
      new UiButton({
        variant: "secondary",
        text: "Отмена",
        onClick: () => this.closeReviewModal(),
      }),
      new UiButton({
        variant: "primary",
        text: "Опубликовать",
        onClick: () => {
          void this.handleSubmit();
        },
      }),
    );

    this.reviewModal = new UiModal({
      title: this.state.editing ? "Редактировать отзыв" : "Оставить отзыв",
      body: this.buildFormBody(),
      footer,
      onClose: () => this.closeReviewModal(),
    });
    this.reviewModal.mount(document.body);
  }

  private closeReviewModal(): void {
    this.reviewModal?.destroy();
    this.reviewModal = null;
    this.cancelEdit();
  }

  private cancelEdit(): void {
    this.state.editing = false;
    this.state.editingId = undefined;
    this.state.formError = undefined;
  }

  private async handleSubmit(): Promise<void> {
    if (this.state.submitting) return;
    const user = AuthService.getInstance().getUser();
    if (!user) {
      this.state.formError = "Войдите, чтобы оставить отзыв";
      return;
    }
    const score = this.ratingField.getValue();
    const body = this.editor.getValue();

    if (!score || score < 1) {
      this.state.formError = "Поставьте оценку от 1 до 10";
      return;
    }
    if (!body) {
      this.state.formError = "Напишите пару слов о фильме";
      return;
    }

    this.state.submitting = true;
    this.state.formError = undefined;
    try {
      if (this.state.editing && this.state.editingId) {
        await ApiService.getInstance().patch(
          `reviews/${this.state.editingId}`,
          { body, score },
        );
      } else {
        await ApiService.getInstance().post(
          `movies/${this.props.movie.id}/reviews`,
          { body, score },
        );
      }
      this.state.editing = false;
      this.state.editingId = undefined;
      this.ratingField.setValue(8);
      this.editor.setValue("");
      if (this.reviewModal) this.closeReviewModal();
      await MoviesService.getInstance().loadMovieById(this.props.movie.id);
    } catch (e) {
      this.state.formError =
        e instanceof Error ? e.message : "Не удалось отправить отзыв";
    } finally {
      this.state.submitting = false;
    }
  }

  private startEdit(review: MovieReview): void {
    this.state.editing = true;
    this.state.editingId = review.id;
    this.state.formError = undefined;
    this.ratingField.setValue(review.score);
    this.editor.setValue(review.body);
    if (this.isMobile) {
      this.openReviewModal();
    }
  }
}
