import { Component } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { MovieCategoriesService } from "../../../services/movie-categories.service";
import { getStyles } from "../../../utils/styles.util";
import { CategoryCard } from "../category-card/category-card.view";
import "./category-list.scss";

const styles = getStyles("CategoryList");
const cardStyles = getStyles("CategoryCard");

export class CategoryList extends Component {
  private cards: { slug: string; card: CategoryCard }[] = [];

  protected onCreated(): void {
    this.addEffect(MovieCategoriesService.getInstance());
  }

  protected template(): HTMLElement {
    const service = MovieCategoriesService.getInstance();
    const activeSlug = service.getActiveSlug();
    const categories = service.getCategories();

    this.cards = categories.map((cat) => ({
      slug: cat.slug,
      card: new CategoryCard({
        category: cat,
        active: cat.slug === activeSlug,
      }),
    }));

    return $(
      Elements.nav,
      { class: styles() },
      ...this.cards.map((c) => c.card),
    );
  }

  protected onUpdated(): void {
    const activeSlug = MovieCategoriesService.getInstance().getActiveSlug();
    const activeMod = cardStyles.mod("active");
    for (const { slug, card } of this.cards) {
      card.toggleClass(activeMod, slug === activeSlug);
    }
  }
}
