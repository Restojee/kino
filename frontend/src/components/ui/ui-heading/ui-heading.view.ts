import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements, ElementTag } from "../../../core/h";
import { UiTextSize } from "../ui-text/ui-text.view";
import { getStyles } from "../../../utils/styles.util";
import { isString, isNumber } from "../../../utils/type-guards.util";
import "./ui-heading.scss";

const styles = getStyles("UiHeading");

export interface UiHeadingProps extends ComponentProps {
  level?: "1" | "2" | "3" | "4" | "5" | "6";
  size?: UiTextSize;
  align?: "left" | "center" | "right";
  text?: string;
  class?: string;
}

export class UiHeading extends Component<UiHeadingProps> {
  declare private heading: HTMLHeadingElement;

  protected template(): HTMLElement {
    const level = this.props.level ?? "2";
    const { size } = this.props;
    const tag = Elements[`h${level}` as keyof typeof Elements] as ElementTag;

    const cls = clsx(
      styles(`h${level}`),
      isString(size) && styles(`size-${size}`),
      this.props.class,
    );

    this.heading = $(
      tag,
      { class: cls },
      this.props.text ?? "",
    ) as HTMLHeadingElement;

    if (isNumber(size)) this.heading.style.fontSize = `${size}px`;
    if (this.props.align) this.heading.style.textAlign = this.props.align;

    return this.heading;
  }

  setText(text: string): void {
    this.props.text = text;
    if (this.heading) this.heading.textContent = text;
  }
}
