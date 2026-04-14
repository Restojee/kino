import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { truncate } from "../../../utils/format.util";
import "./search-result-card.scss";

const styles = getStyles("SearchResultCard");

export interface SearchResultCardItem {
  title: string;
  originalTitle?: string;
  year?: number;
  posterUrl?: string;
  description?: string;
  tmdbRating?: number;
  alreadyAdded?: boolean;
}

export interface SearchResultCardProps extends ComponentProps {
  item: SearchResultCardItem;
  onClick?: () => void;
}

export class SearchResultCard extends Component<SearchResultCardProps> {
  protected template(): HTMLElement {
    const { item } = this.props;

    return $(
      Elements.button,
      {
        type: "button",
        class: `${styles()} ${item.alreadyAdded ? styles("added") : ""}`,
        onclick: () => this.props.onClick?.(),
      },
      this.buildPoster(item),
      this.buildBody(item),
    );
  }

  private buildPoster(item: SearchResultCardItem): HTMLElement {
    return item.posterUrl
      ? $(Elements.img, {
          class: `${styles()}__poster`,
          src: item.posterUrl,
          alt: item.title,
        })
      : $(Elements.div, { class: `${styles()}__poster-placeholder` }, "🎬");
  }

  private buildBody(item: SearchResultCardItem): HTMLElement {
    const badge = item.alreadyAdded
      ? new UiText({
          tag: Elements.span,
          text: "Уже в библиотеке",
          class: `${styles()}__badge`,
        })
      : null;

    return $(
      Elements.div,
      { class: `${styles()}__body` },
      $(
        Elements.div,
        { class: `${styles()}__title-row` },
        new UiText({
          tag: Elements.span,
          text: item.title,
          class: `${styles()}__title`,
        }),
        badge,
      ),
      this.buildMeta(item),
      item.description
        ? new UiText({
            text: truncate(item.description, 180),
            class: `${styles()}__desc`,
          })
        : null,
    );
  }

  private buildMeta(item: SearchResultCardItem): HTMLElement {
    const parts: (UiText | null)[] = [];
    if (item.year) {
      parts.push(new UiText({ tag: Elements.span, text: String(item.year) }));
    }
    if (item.originalTitle && item.originalTitle !== item.title) {
      parts.push(
        new UiText({
          tag: Elements.span,
          text: item.originalTitle,
          class: `${styles()}__original`,
        }),
      );
    }
    if (item.tmdbRating) {
      parts.push(
        new UiText({
          tag: Elements.span,
          text: `★ ${item.tmdbRating.toFixed(1)}`,
          class: `${styles()}__rating`,
        }),
      );
    }
    return $(Elements.div, { class: `${styles()}__meta` }, ...parts);
  }
}
