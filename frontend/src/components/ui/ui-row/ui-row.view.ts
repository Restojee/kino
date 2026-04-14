import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-row.scss";

const styles = getStyles("UiRow");

export interface UiRowProps extends ComponentProps {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
}

export class UiRow extends Component<UiRowProps> {
  protected template(): HTMLElement {
    const cls = clsx(
      styles(),
      this.props.gap && `UiRow_gap-${this.props.gap}`,
      this.props.align && `UiRow_align-${this.props.align}`,
      this.props.justify && `UiRow_justify-${this.props.justify}`,
      this.props.wrap && "UiRow_wrap",
    );

    return $(Elements.div, { class: cls });
  }
}
