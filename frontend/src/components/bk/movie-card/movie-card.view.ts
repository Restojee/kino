import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { Router } from "../../../core/Router";
import { Movie } from "../../../types";
import { getStyles } from "../../../utils/styles.util";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import "./movie-card.scss";

const styles = getStyles("MovieCard");

const DEFAULT_POSTER = "/assets/bk/movie-poster.png";

export interface MovieCardProps extends ComponentProps {
  movie: Movie;
}

export class MovieCard extends Component<MovieCardProps> {
  constructor(props: MovieCardProps) {
    super(props);
  }

  protected template(): HTMLElement {
    const { movie } = this.props;
    const poster = movie.poster || DEFAULT_POSTER;

    const posterEl = $(Elements.div, {
      class: `${styles()}__poster`,
      style: { backgroundImage: `url(${poster})` },
    });

    const kpRating = movie.ratings?.find(
      (r) => r.source === "kinopoisk",
    )?.value;
    const hasUser = movie.userScore != null;
    const badgeValue = hasUser
      ? movie.userScore!.toFixed(1)
      : kpRating != null
        ? kpRating.toFixed(1)
        : "—";
    const badge = $(
      Elements.div,
      {
        class: `${styles()}__badge${hasUser ? ` ${styles()}__badge--user` : ""}`,
      },
      badgeValue,
    );

    const title = new UiText({
      text: movie.title,
      class: `${styles()}__title`,
    });

    const actions = $(
      Elements.div,
      { class: `${styles()}__actions` },
      new UiButton({
        variant: "ghost",
        class: `${styles()}__btn ${styles()}__btn_edit`,
        ariaLabel: "Редактировать",
      }),
      new UiButton({
        variant: "ghost",
        class: `${styles()}__btn ${styles()}__btn_heart`,
        ariaLabel: "В избранное",
      }),
    );

    const overlay = $(
      Elements.div,
      { class: `${styles()}__overlay` },
      badge,
      title,
      actions,
    );

    return $(
      Elements.article,
      {
        class: styles(),
        onclick: () => Router.navigate(`/movie/${movie.id}`),
      },
      posterEl,
      overlay,
    );
  }
}
