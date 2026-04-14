import {Component, ComponentProps} from "../../core/Component";
import {ReviewsService} from "../../services/reviews.service";
import {$, addEvent, Elements, Events} from "../../core/h";
import {getStyles} from "../../utils/styles.util";
import {Comment} from "./comment.view";
import {UiButton} from "../ui/ui-button/ui-button.view";
import {UiHeading} from "../ui/ui-heading/ui-heading.view";
import {UiInput} from "../ui/ui-input/ui-input.view";
import {UiRating} from "../ui/ui-rating/ui-rating.view";
import {UiText} from "../ui/ui-text/ui-text.view";
import {UiTextarea} from "../ui/ui-textarea/ui-textarea.view";
import {Review} from "../../types";
import "./review-item.scss";

const styles = getStyles("ReviewItem");

export interface ReviewItemProps extends ComponentProps {
  review: Review;
}

export class ReviewItem extends Component<ReviewItemProps> {
  protected state = {showComments: false};
  private commentsEl!: HTMLElement;

  constructor(props: ReviewItemProps) {
    super(props);
  }

  protected template(): HTMLElement {
    const {review} = this.props;

    this.commentsEl = this._comments(review);
    this.commentsEl.style.display = "none";

    return $(
      Elements.article,
      {class: styles()},
      $(
        Elements.div,
        {class: "header"},
        new UiHeading({level: "4", text: review.author}),
        new UiRating({value: review.rating, readonly: true}),
      ),
      new UiText({text: review.text}),
      $(
        Elements.div,
        {class: "footer"},
        new UiText({
          variant: "caption",
          text: new Date(review.date).toLocaleDateString("ru-RU"),
        }),
        new UiButton({
          variant: "secondary",
          text: `💬 ${review.comments.length} комментариев`,
          onClick: () => {
            this.state.showComments = !this.state.showComments;
          },
        }),
      ),
      this.commentsEl,
    );
  }

  protected onUpdated(): void {
    this.commentsEl.style.display = this.state.showComments ? "" : "none";
  }

  private _comments(review: ReviewItemProps["review"]): HTMLElement {
    const authorInput = new UiInput({placeholder: "Ваше имя"});
    const textInput = new UiTextarea({placeholder: "Комментарий", rows: 3});

    const form = addEvent(
      $(
        Elements.form,
        {class: "commentForm"},
        authorInput,
        textInput,
        new UiButton({type: "submit", variant: "primary", text: "Отправить"}),
      ),
      Events.submit,
      (e) => {
        e.preventDefault();
        const author = authorInput.getValue().trim();
        const text = textInput.getValue().trim();
        if (!author || !text) return;
        ReviewsService.getInstance().addComment(review.id, {
          author,
          text,
          date: new Date(),
        });
        authorInput.setValue("");
        textInput.setValue("");
      },
    );

    return $(
      Elements.div,
      {class: "comments"},
      ...review.comments.map((comment) => new Comment({comment})),
      form,
    );
  }
}
