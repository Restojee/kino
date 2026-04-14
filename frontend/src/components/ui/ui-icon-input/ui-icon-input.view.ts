import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import { Icon } from "../../../utils/icons.util";
import "./ui-icon-input.scss";

const styles = getStyles("UiIconInput");

export interface UiIconInputProps extends ComponentProps {
  placeholder?: string;
  value?: string;
  icon?: () => HTMLElement;
  onInput?: (value: string) => void;
  collapseOnBlur?: boolean;
  fullWidth?: boolean;
}

export class UiIconInput extends Component<UiIconInputProps> {
  private expanded = false;
  declare private input: HTMLInputElement;

  protected template(): HTMLElement {
    const iconFactory = this.props.icon ?? (() => Icon.search(18));

    this.input = $(Elements.input, {
      type: "text",
      class: `${styles()}__input`,
      placeholder: this.props.placeholder ?? "",
      value: this.props.value ?? "",
      oninput: () => {
        this.props.value = this.input.value;
        this.props.onInput?.(this.input.value);
      },
      onblur: () => {
        if ((this.props.collapseOnBlur ?? true) && !this.input.value)
          this.collapse();
      },
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          this.input.value = "";
          this.props.onInput?.("");
          this.collapse();
        }
      },
    });

    const button = $(
      Elements.button,
      {
        class: `${styles()}__button`,
        type: "button",
        onclick: () => this.expand(),
      },
      iconFactory(),
    );

    const isFullWidth = this.props.fullWidth;
    const root = $(
      Elements.div,
      {
        class: clsx(
          styles(),
          (this.expanded || isFullWidth) && `${styles()}_expanded`,
        ),
      },
      button,
      this.input,
    );

    if (isFullWidth) {
      this.expanded = true;
    }

    return root;
  }

  private static readonly EXPANDED_CLASS = "UiIconInput_expanded";

  private expand(): void {
    if (this.expanded) return;
    this.expanded = true;
    this.el.classList.add(UiIconInput.EXPANDED_CLASS);
    this.input.focus();
  }

  private collapse(): void {
    if (!this.expanded || this.props.fullWidth) return;
    this.expanded = false;
    this.el.classList.remove(UiIconInput.EXPANDED_CLASS);
  }
}
