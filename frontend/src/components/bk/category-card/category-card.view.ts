import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { MovieCategory, MovieCategorySlug } from "../../../types";
import { MovieCategoriesService } from "../../../services/movie-categories.service";
import { MoviesService } from "../../../services/movies.service";
import { getStyles } from "../../../utils/styles.util";
import { UiText } from "../../ui/ui-text/ui-text.view";
import "./category-card.scss";

const styles = getStyles("CategoryCard");

const SLUG_IMAGE: Record<MovieCategorySlug, string | null> = {
  all: null,
  movies: "/assets/bk/category-movies.png",
  series: "/assets/bk/category-series.png",
  cartoons: "/assets/bk/category-cartoons.png",
  anime: "/assets/bk/category-anime.png",
};

export interface CategoryCardProps extends ComponentProps {
  category: MovieCategory;
  active: boolean;
}

export class CategoryCard extends Component<CategoryCardProps> {
  constructor(props: CategoryCardProps) {
    super(props);
  }

  protected template(): HTMLElement {
    const { category, active } = this.props;
    const image = SLUG_IMAGE[category.slug];

    const cls = clsx(styles(), active && styles("active"));

    return $(
      Elements.button,
      {
        class: cls,
        type: "button",
        onclick: () => {
          MovieCategoriesService.getInstance().setActive(category.slug);
          MoviesService.getInstance().setCategory(category.slug);
        },
      },
      image
        ? $(Elements.div, {
            class: `${styles()}__image`,
            style: { backgroundImage: `url(${image})` },
          })
        : null,
      $(Elements.div, { class: `${styles()}__overlay` }),
      new UiText({
        tag: Elements.span,
        text: category.name,
        class: `${styles()}__label`,
      }),
    );
  }
}
