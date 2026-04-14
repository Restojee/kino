import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-col.scss";

const styles = getStyles("UiCol");

export interface UiColProps extends ComponentProps {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

export class UiCol extends Component<UiColProps> {
  protected template(): HTMLElement {
    const cls = clsx(
      styles(),
      this.props.gap && `UiCol_gap-${this.props.gap}`,
      this.props.align && `UiCol_align-${this.props.align}`,
      this.props.justify && `UiCol_justify-${this.props.justify}`,
    );

    return $(Elements.div, { class: cls });
  }
}
