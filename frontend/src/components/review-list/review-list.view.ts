import { Component } from "../../core/Component";
import { $, $replace, Elements } from "../../core/h";
import { ReviewsService } from "../../services/reviews.service";
import { getStyles } from "../../utils/styles.util";
import { ReviewItem } from "../review-item/review-item.view";
import { UiHeading } from "../ui/ui-heading/ui-heading.view";
import { UiText } from "../ui/ui-text/ui-text.view";
import "./review-list.scss";

const styles = getStyles("ReviewList");

export class ReviewList extends Component {
  private itemsEl!: HTMLElement;
  private emptyText!: UiText;

  protected onCreated(): void {
    this.addEffect(ReviewsService.getInstance());
  }

  protected template(): HTMLElement {
    this.itemsEl = $(Elements.div, { class: "items" });
    this.emptyText = new UiText({
      variant: "muted",
      text: "Пока нет отзывов. Будьте первым!",
    });

    return $(
      Elements.div,
      { class: styles() },
      new UiHeading({ level: "3", text: "Отзывы" }),
      this.itemsEl,
      this.emptyText,
    );
  }

  protected onUpdated(): void {
    this.syncItems();
  }

  private syncItems(): void {
    const reviews = ReviewsService.getInstance().getReviews();
    const hasItems = reviews.length > 0;

    this.itemsEl.style.display = hasItems ? "" : "none";
    this.emptyText.setVisible(!hasItems);

    if (hasItems) {
      $replace(
        this.itemsEl,
        ...reviews.map((review) => new ReviewItem({ review })),
      );
    }
  }
}
