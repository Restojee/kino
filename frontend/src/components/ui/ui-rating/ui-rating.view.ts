import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-rating.scss";

const styles = getStyles("UiRating");

export interface UiRatingProps extends ComponentProps {
  value?: number;
  max?: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export class UiRating extends Component<UiRatingProps> {
  private stars: HTMLButtonElement[] = [];

  protected template(): HTMLElement {
    const max = this.props.max ?? 5;
    const value = this.props.value ?? 0;
    const readonly = this.props.readonly ?? false;

    this.stars = [];
    for (let i = 1; i <= max; i++) {
      const star = $(
        Elements.button,
        {
          type: "button",
          class: "star",
          "data-value": String(i),
          ...(readonly
            ? {}
            : {
                onclick: () => this._selectRating(i),
                onmouseenter: () => this._highlightStars(i),
                onmouseleave: () => this._updateStars(),
              }),
        },
        i <= value ? "★" : "☆",
      );
      star.disabled = readonly;
      this.stars.push(star);
    }

    return $(
      Elements.div,
      {
        class: clsx(styles(), readonly && "readonly"),
      },
      ...this.stars,
    );
  }

  private _selectRating(value: number): void {
    this.props.value = value;
    this._updateStars();
    this.props.onChange?.(value);
    this.emit("change", { value });
  }

  private _highlightStars(upTo: number): void {
    this.stars.forEach((star, i) => {
      star.textContent = i < upTo ? "★" : "☆";
      star.classList.toggle("highlighted", i < upTo);
    });
  }

  private _updateStars(): void {
    const value = this.props.value ?? 0;
    this.stars.forEach((star, i) => {
      star.textContent = i < value ? "★" : "☆";
      star.classList.toggle("active", i < value);
      star.classList.remove("highlighted");
    });
  }

  setValue(value: number): void {
    this.props.value = value;
    this._updateStars();
  }

  getValue(): number {
    return this.props.value ?? 0;
  }
}
