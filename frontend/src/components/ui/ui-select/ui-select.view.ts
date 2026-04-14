import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-select.scss";

const styles = getStyles("UiSelect");

export interface UiSelectOption {
  value: string;
  label: string;
}

export interface UiSelectProps extends ComponentProps {
  options?: UiSelectOption[];
  value?: string;
  placeholder?: string;
  name?: string;
  onChange?: (value: string) => void;
  trailing?: Renderable;
}

export class UiSelect extends Component<UiSelectProps> {
  declare private select: HTMLSelectElement;
  declare private wrapper: HTMLDivElement;

  protected template(): HTMLElement {
    const options = this.props.options ?? [];
    const children: HTMLOptionElement[] = [];

    if (this.props.placeholder) {
      const placeholder = $(
        Elements.option,
        { value: "" },
        this.props.placeholder,
      );
      placeholder.disabled = true;
      placeholder.selected = !this.props.value;
      children.push(placeholder);
    }

    for (const opt of options) {
      const option = $(Elements.option, { value: opt.value }, opt.label);
      option.selected = opt.value === this.props.value;
      children.push(option);
    }

    this.select = $(
      Elements.select,
      {
        class: `${styles()}__native`,
        name: this.props.name ?? "",
        onchange: () => this.props.onChange?.(this.select.value),
      },
      ...children,
    );

    const trailingSlot = this.props.trailing
      ? $(
          Elements.span,
          { class: `${styles()}__adornment ${styles()}__adornment--trailing` },
          this.props.trailing,
        )
      : null;

    this.wrapper = $(
      Elements.div,
      {
        class: `${styles()} ${styles("wrap")}`,
      },
      this.select,
      trailingSlot,
    );
    if (this.props.trailing)
      this.wrapper.classList.add(styles.mod("has-trailing"));

    return this.wrapper;
  }

  setValue(value: string): void {
    this.props.value = value;
    if (this.select) this.select.value = value;
  }

  getValue(): string {
    return this.select?.value ?? "";
  }
}
