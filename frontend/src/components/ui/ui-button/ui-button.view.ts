import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-button.scss";

const styles = getStyles("UiButton");

export type UiButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "dark"
  | "ghost";

export interface UiButtonProps extends ComponentProps {
  variant?: UiButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  text?: string;
  icon?: Renderable;
  title?: string;
  class?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export class UiButton extends Component<UiButtonProps> {
  declare private button: HTMLButtonElement;

  protected template(): HTMLElement {
    const variant = this.props.variant ?? "primary";
    const hasText = !!this.props.text;
    const hasIcon = !!this.props.icon;
    const iconOnly = hasIcon && !hasText;

    const cls = clsx(
      styles(`variant-${variant}`),
      iconOnly && styles("icon-only"),
      this.props.fullWidth && styles("full-width"),
      this.props.class,
    );

    this.button = $(
      Elements.button,
      {
        class: cls,
        type: this.props.type ?? "button",
        title: this.props.title,
        "aria-label": this.props.ariaLabel,
        onclick: this.props.onClick,
      },
      this.props.icon ?? null,
      hasText ? $(Elements.span, {}, this.props.text!) : null,
    );
    this.button.disabled = this.props.disabled ?? false;
    return this.button;
  }

  setVariant(variant: UiButtonVariant): void {
    this.props.variant = variant;
    if (this.button) this.button.className = styles(`variant-${variant}`);
  }

  setDisabled(disabled: boolean): void {
    this.props.disabled = disabled;
    if (this.button) this.button.disabled = disabled;
  }

  setText(text: string): void {
    this.props.text = text;
    if (this.button) this.button.textContent = text;
  }
}
