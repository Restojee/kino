import { Component, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { MovieCategoriesService } from "../../../services/movie-categories.service";
import { MoviesService } from "../../../services/movies.service";
import { ReviewQuotesService } from "../../../services/review-quotes.service";
import { getStyles } from "../../../utils/styles.util";
import { CategoryList } from "../category-list/category-list.view";
import { FilterTabs } from "../filter-tabs/filter-tabs.view";
import { Layout } from "../layout/layout.view";
import { MovieCarousel } from "../movie-carousel/movie-carousel.view";
import { MovieGrid } from "../movie-grid/movie-grid.view";
import { ReviewQuoteCarousel } from "../review-quote-carousel/review-quote-carousel.view";
import "./home-page.scss";

const styles = getStyles("HomePage");

export class HomePage extends Component {
  protected onCreated(): void {
    MovieCategoriesService.getInstance().load();
    MoviesService.getInstance().load();
    ReviewQuotesService.getInstance().load();
  }

  protected template(): Renderable {
    const content = $(
      Elements.div,
      { class: styles() },
      $(
        Elements.section,
        { class: `${styles()}__categories` },
        new CategoryList(),
      ),
      $(
        Elements.section,
        { class: `${styles()}__movies` },
        new FilterTabs(),
        new MovieCarousel(),
      ),
      $(
        Elements.section,
        { class: `${styles()}__quotes` },
        new ReviewQuoteCarousel(),
      ),
      $(Elements.section, { class: `${styles()}__grid` }, new MovieGrid()),
    );

    return new Layout({ content, showBack: false });
  }
}
