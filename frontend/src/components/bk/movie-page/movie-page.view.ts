import { Component, ComponentProps } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { MoviesService } from "../../../services/movies.service";
import { BreakpointService } from "../../../services/breakpoint.service";
import { getStyles } from "../../../utils/styles.util";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { UiTabContent } from "../../ui/ui-tab-content/ui-tab-content.view";
import { Layout } from "../layout/layout.view";
import { MovieInfo } from "../movie-info/movie-info.view";
import { MovieReviews } from "../movie-reviews/movie-reviews.view";
import { Movie } from "../../../types";
import "./movie-page.scss";

const styles = getStyles("MoviePage");

const DEFAULT_POSTER = "/assets/bk/movie-poster.png";

export interface MoviePageProps extends ComponentProps {
  movieId: string;
}

export class MoviePage extends Component<MoviePageProps> {
  private contentEl!: HTMLElement;

  constructor(props: MoviePageProps) {
    super(props);
  }

  protected onCreated(): void {
    const service = MoviesService.getInstance();
    this.addEffect(service);
    this.addEffect(BreakpointService);
    if (!service.isLoaded()) {
      service.load();
    }
    void service.loadMovieById(this.props.movieId);
  }

  protected template(): HTMLElement {
    this.contentEl = $(Elements.div, { style: { display: "contents" } });
    return this.contentEl;
  }

  protected onUpdated(): void {
    this.syncPage();
  }

  private syncPage(): void {
    const movie = MoviesService.getInstance().getMovieById(this.props.movieId);

    if (!movie) {
      $replace(
        this.contentEl,
        new Layout({
          showBack: true,
          content: new UiText({
            text: "Фильм не найден.",
            class: `${styles()}__empty`,
          }),
        }),
      );
      return;
    }

    const posterUrl = movie.poster || DEFAULT_POSTER;

    const content = BreakpointService.isMobile
      ? this.buildMobileContent(movie, posterUrl)
      : this.buildDesktopContent(movie, posterUrl);

    $replace(this.contentEl, new Layout({ showBack: true, content }));
  }

  private buildDesktopContent(movie: Movie, posterUrl: string): HTMLElement {
    return $(
      Elements.section,
      { class: styles() },
      $(
        Elements.div,
        { class: `${styles()}__stage` },
        $(Elements.div, {
          class: `${styles()}__poster`,
          style: { backgroundImage: `url(${posterUrl})` },
        }),
        $(
          Elements.div,
          { class: `${styles()}__info` },
          new MovieInfo({ movie }),
        ),
      ),
      $(
        Elements.div,
        { class: `${styles()}__reviews` },
        new MovieReviews({ movie }),
      ),
    );
  }

  private buildMobileContent(movie: Movie, posterUrl: string): HTMLElement {
    return $(
      Elements.section,
      { class: styles() },
      $(
        Elements.div,
        { class: `${styles()}__stage` },
        $(Elements.div, {
          class: `${styles()}__poster`,
          style: { backgroundImage: `url(${posterUrl})` },
        }),
      ),
      new UiTabContent({
        tabs: [
          {
            id: "info",
            label: "О фильме",
            content: () =>
              $(
                Elements.div,
                { class: `${styles()}__info` },
                new MovieInfo({ movie }),
              ),
          },
          {
            id: "reviews",
            label: "Отзывы",
            content: () =>
              $(
                Elements.div,
                { class: `${styles()}__reviews` },
                new MovieReviews({ movie }),
              ),
          },
        ],
        active: "info",
        slider: true,
      }),
    );
  }
}
