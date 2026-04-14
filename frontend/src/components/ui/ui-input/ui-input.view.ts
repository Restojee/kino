import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-input.scss";

const styles = getStyles("UiInput");

export interface UiInputProps extends ComponentProps {
  type?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  onInput?: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  leading?: Renderable;
  trailing?: Renderable;
}

export class UiInput extends Component<UiInputProps> {
  declare private input: HTMLInputElement;

  protected template(): HTMLElement {
    this.input = this.buildInput();

    const wrapper = $(
      Elements.div,
      { class: `${styles()}__wrap` },
      this.props.leading
        ? $(
            Elements.span,
            { class: `${styles()}__adornment ${styles()}__adornment--leading` },
            this.props.leading,
          )
        : null,
      this.input,
      this.props.trailing
        ? $(
            Elements.span,
            {
              class: `${styles()}__adornment ${styles()}__adornment--trailing`,
            },
            this.props.trailing,
          )
        : null,
    );
    wrapper.classList.add(styles());
    if (this.props.leading) wrapper.classList.add(styles.mod("has-leading"));
    if (this.props.trailing) wrapper.classList.add(styles.mod("has-trailing"));
    return wrapper;
  }

  private buildInput(): HTMLInputElement {
    const input = $(Elements.input, {
      class: `${styles()}__native`,
      type: this.props.type ?? "text",
      placeholder: this.props.placeholder ?? "",
      name: this.props.name ?? "",
      value: this.props.value ?? "",
      oninput: () => this.props.onInput?.(input.value),
    });
    return input;
  }

  setValue(value: string): void {
    this.props.value = value;
    if (this.input) this.input.value = value;
  }

  getValue(): string {
    return this.input?.value ?? "";
  }

  getInput(): HTMLInputElement {
    return this.input;
  }
}
