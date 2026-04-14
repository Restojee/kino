import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { Router } from "../../../core/Router";
import { ReviewQuote } from "../../../types";
import { getStyles } from "../../../utils/styles.util";
import { UiText } from "../../ui/ui-text/ui-text.view";
import "./review-quote-card.scss";

const styles = getStyles("ReviewQuoteCard");

const DEFAULT_BG = "/assets/bk/movie-poster.png";

export interface ReviewQuoteCardProps extends ComponentProps {
  quote: ReviewQuote;
}

export class ReviewQuoteCard extends Component<ReviewQuoteCardProps> {
  protected template(): HTMLElement {
    const { quote } = this.props;
    const bg = quote.backgroundImage || DEFAULT_BG;

    const title = $(
      Elements.p,
      { class: `${styles()}__title` },
      new UiText({
        tag: Elements.span,
        text: "Отзыв фильма: ",
        class: `${styles()}__title-label`,
      }),
      new UiText({
        tag: Elements.span,
        text: quote.movieTitle,
        class: `${styles()}__title-movie`,
      }),
    );

    const cover = $(Elements.div, {
      class: `${styles()}__cover`,
      style: { backgroundImage: `url(${bg})` },
    });

    const overlay = $(Elements.div, { class: `${styles()}__overlay` });

    const quoteBox = $(
      Elements.div,
      { class: `${styles()}__quote-box` },
      new UiText({
        tag: Elements.p,
        text: quote.quote,
        class: `${styles()}__quote-text`,
      }),
    );

    const credit = new UiText({
      tag: Elements.p,
      text: `(с) ${quote.author}`,
      class: `${styles()}__credit`,
    });

    const body = $(
      Elements.div,
      { class: `${styles()}__body` },
      cover,
      overlay,
      quoteBox,
      credit,
    );

    return $(
      Elements.article,
      {
        class: styles(),
        style: { cursor: "pointer" },
        onclick: () => Router.navigate(`/movie/${quote.movieId}`),
      },
      title,
      body,
    );
  }
}
