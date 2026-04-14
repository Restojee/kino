import { Component, ComponentProps } from "../../../core/Component";
import { $, $html, Elements } from "../../../core/h";
import { MovieReview } from "../../../types";
import { getStyles } from "../../../utils/styles.util";
import { UiAvatar } from "../../ui/ui-avatar/ui-avatar.view";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiIconButton } from "../../ui/ui-icon-button/ui-icon-button.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { Icon, IconSize } from "../../../utils/icons.util";
import { formatRelative } from "../../../utils/format.util";
import { BreakpointService } from "../../../services/breakpoint.service";
import "./review-card.scss";

const styles = getStyles("ReviewCard");

export interface ReviewCardProps extends ComponentProps {
  review: MovieReview;
  isOwn: boolean;
  canEdit: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

export class ReviewCard extends Component<ReviewCardProps> {
  protected template(): HTMLElement {
    const { review, isOwn, canEdit } = this.props;

    const body = $(Elements.div, { class: `${styles()}__body` });
    $html(body, review.body);

    return $(
      Elements.article,
      { class: styles() },
      this.buildHead(review, isOwn),
      body,
      canEdit &&
        new UiButton({
          variant: "ghost",
          text: "Редактировать",
          class: `${styles()}__edit-btn`,
          onClick: () => this.props.onEdit?.(),
        }),
    );
  }

  private buildHead(review: MovieReview, isOwn: boolean): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__head` },
      this.buildAuthor(review),
      this.buildScore(review),
      isOwn ? this.buildRemoveBtn() : null,
    );
  }

  private buildAuthor(review: MovieReview): HTMLElement {
    const isMobile = BreakpointService.isMobile;
    return $(
      Elements.div,
      { class: `${styles()}__author` },
      new UiAvatar({ name: review.author, size: isMobile ? "sm" : "md" }),
      $(
        Elements.div,
        { class: `${styles()}__meta` },
        new UiText({
          tag: Elements.span,
          size: isMobile ? "xs" : "sm",
          text: review.author,
          class: `${styles()}__name`,
        }),
        new UiText({
          tag: Elements.span,
          size: "xs",
          text: formatRelative(review.createdAt),
          class: `${styles()}__date`,
        }),
      ),
    );
  }

  private buildScore(review: MovieReview): HTMLElement {
    const isMobile = BreakpointService.isMobile;
    return $(
      Elements.div,
      { class: `${styles()}__score` },
      Icon.star(isMobile ? IconSize.sm : IconSize.md),
      new UiText({
        tag: Elements.span,
        size: isMobile ? "xs" : "sm",
        text: `${review.score.toFixed(1)} / 10`,
      }),
    );
  }

  private buildRemoveBtn(): UiIconButton {
    return new UiIconButton({
      icon: Icon.x(IconSize.sm),
      variant: "danger",
      title: "Удалить отзыв",
      ariaLabel: "Удалить отзыв",
      class: `${styles()}__remove`,
      onClick: () => this.props.onDelete?.(),
    });
  }
}
