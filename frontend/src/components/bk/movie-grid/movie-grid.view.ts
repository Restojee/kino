import { Component } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { MoviesService } from "../../../services/movies.service";
import { getStyles } from "../../../utils/styles.util";
import { UiHeading } from "../../ui/ui-heading/ui-heading.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { MovieCard } from "../movie-card/movie-card.view";
import "./movie-grid.scss";

const styles = getStyles("MovieGrid");

export class MovieGrid extends Component {
  private countText!: UiText;
  private gridEl!: HTMLElement;
  private emptyText!: UiText;
  private statusText!: UiText;
  private sentinel!: HTMLElement;
  private observer?: IntersectionObserver;

  protected onCreated(): void {
    this.addEffect(MoviesService.getInstance());
    void MoviesService.getInstance().loadGrid();
  }

  protected template(): HTMLElement {
    this.countText = new UiText({
      tag: Elements.span,
      text: "",
      class: `${styles()}__count`,
    });
    this.gridEl = $(Elements.div, { class: `${styles()}__grid` });
    this.emptyText = new UiText({
      text: "Ничего не найдено для выбранных фильтров.",
      class: `${styles()}__empty`,
    });
    this.statusText = new UiText({ text: "", class: `${styles()}__status` });
    this.sentinel = $(Elements.div, { class: `${styles()}__sentinel` });

    return $(
      Elements.section,
      { class: styles() },
      $(
        Elements.div,
        { class: `${styles()}__header` },
        new UiHeading({
          level: "3",
          text: "Все фильмы",
          class: `${styles()}__title`,
        }),
        this.countText,
      ),
      this.gridEl,
      this.emptyText,
      this.statusText,
      this.sentinel,
    );
  }

  protected onMounted(): void {
    this.attachObserver();
  }

  protected onUpdated(): void {
    this.syncContent();
    this.attachObserver();
  }

  protected onDestroyed(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private syncContent(): void {
    const service = MoviesService.getInstance();
    const items = service.gridItems;
    const isEmpty = items.length === 0 && !service.gridLoading;

    this.countText.setText(
      service.gridTotal > 0 ? `${items.length} из ${service.gridTotal}` : "",
    );

    this.gridEl.style.display = isEmpty ? "none" : "";
    this.emptyText.setVisible(!isEmpty);
    $replace(this.gridEl, ...items.map((movie) => new MovieCard({ movie })));

    if (service.gridLoading) {
      this.statusText.setText("Загружаем…");
      this.statusText.setClassName(`${styles()}__status`);
    } else if (service.gridLoadingMore) {
      this.statusText.setText("Догружаем следующую страницу…");
      this.statusText.setClassName(`${styles()}__status`);
    } else if (!service.gridHasMore && items.length > 0) {
      this.statusText.setText("Это все фильмы.");
      this.statusText.setClassName(
        `${styles()}__status ${styles()}__status--done`,
      );
    } else {
      this.statusText.setText("");
    }
  }

  private attachObserver(): void {
    this.observer?.disconnect();
    if (!this.sentinel) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void MoviesService.getInstance().loadMoreGrid();
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    this.observer.observe(this.sentinel);
  }
}
