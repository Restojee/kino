import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { UiButtonVariant } from "../ui-button/ui-button.view";
import { getStyles } from "../../../utils/styles.util";
import "./ui-icon-button.scss";

const styles = getStyles("UiIconButton");

export interface UiIconButtonProps extends ComponentProps {
  icon: Renderable;
  variant?: UiButtonVariant;
  size?: number;
  title?: string;
  ariaLabel?: string;
  class?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export class UiIconButton extends Component<UiIconButtonProps> {
  declare private button: HTMLButtonElement;

  protected template(): HTMLElement {
    const variant = this.props.variant ?? "ghost";

    const cls = clsx(styles(), styles(`variant-${variant}`), this.props.class);

    const style = this.props.size
      ? { width: `${this.props.size}px`, height: `${this.props.size}px` }
      : undefined;

    this.button = $(
      Elements.button,
      {
        class: cls,
        type: "button",
        title: this.props.title,
        "aria-label": this.props.ariaLabel ?? this.props.title,
        style,
        onclick: this.props.onClick,
      },
      this.props.icon,
    );

    this.button.disabled = this.props.disabled ?? false;
    return this.button;
  }

  setDisabled(disabled: boolean): void {
    this.props.disabled = disabled;
    if (this.button) this.button.disabled = disabled;
  }
}
