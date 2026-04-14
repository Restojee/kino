import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $append, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-textarea.scss";

const styles = getStyles("UiTextarea");

export interface UiTextareaProps extends ComponentProps {
  placeholder?: string;
  rows?: number;
  value?: string;
  onInput?: (value: string) => void;
  trailing?: Renderable;
}

export class UiTextarea extends Component<UiTextareaProps> {
  declare private textarea: HTMLTextAreaElement;
  declare private wrapper: HTMLDivElement;
  declare private trailingSlot: HTMLSpanElement;

  protected template(): HTMLElement {
    this.textarea = $(Elements.textarea, {
      class: `${styles()}__native`,
      placeholder: this.props.placeholder ?? "",
      rows: this.props.rows ?? 4,
      oninput: () => this.props.onInput?.(this.textarea.value),
    });
    this.textarea.value = this.props.value ?? "";

    this.trailingSlot = $(Elements.span, {
      class: `${styles()}__adornment ${styles()}__adornment--trailing`,
    });
    if (this.props.trailing) $append(this.trailingSlot, this.props.trailing);
    else this.trailingSlot.style.display = "none";

    this.wrapper = $(
      Elements.div,
      {
        class: `${styles()} ${styles("wrap")}`,
      },
      this.textarea,
      this.trailingSlot,
    );
    if (this.props.trailing)
      this.wrapper.classList.add(styles.mod("has-trailing"));
    return this.wrapper;
  }

  setValue(value: string): void {
    this.props.value = value;
    if (this.textarea) this.textarea.value = value;
  }

  getValue(): string {
    return this.textarea?.value ?? "";
  }

  getTextarea(): HTMLTextAreaElement {
    return this.textarea;
  }
}
