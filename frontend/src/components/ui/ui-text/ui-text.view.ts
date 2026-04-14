import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements, ElementTag } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import { isString, isNumber } from "../../../utils/type-guards.util";
import "./ui-text.scss";

const styles = getStyles("UiText");

export type UiTextVariant = "body" | "caption" | "label" | "muted";

export type UiTextSize =
  | "xs"
  | "sm"
  | "md"
  | "base"
  | "lg"
  | "xl"
  | "xxl"
  | "xxxl"
  | number;

export interface UiTextProps extends ComponentProps {
  tag?: ElementTag;
  variant?: UiTextVariant;
  size?: UiTextSize;
  align?: "left" | "center" | "right";
  text?: string;
  class?: string;
}

export class UiText extends Component<UiTextProps> {
  declare private textEl: HTMLElement;

  protected template(): HTMLElement {
    const { variant, size } = this.props;
    const tag = this.props.tag ?? Elements.p;

    const cls = clsx(
      styles(),
      variant && styles(variant),
      isString(size) && styles(`size-${size}`),
      this.props.class,
    );

    this.textEl = $(tag, { class: cls }, this.props.text ?? "");

    if (isNumber(size)) this.textEl.style.fontSize = `${size}px`;
    if (this.props.align) this.textEl.style.textAlign = this.props.align;

    return this.textEl;
  }

  setText(text: string): void {
    this.props.text = text;
    if (this.textEl) this.textEl.textContent = text;
  }

  setVariant(variant: UiTextVariant): void {
    this.props.variant = variant;
    if (this.textEl) {
      const cls = clsx(
        styles(),
        styles(variant),
        isString(this.props.size) && styles(`size-${this.props.size}`),
        this.props.class,
      );
      this.textEl.className = cls;
    }
  }
}
