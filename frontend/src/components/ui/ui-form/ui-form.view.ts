import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-form.scss";

const styles = getStyles("UiForm");

export interface UiFormProps extends ComponentProps {
  onSubmit?: (e: SubmitEvent) => void;
}

export class UiForm extends Component<UiFormProps> {
  declare private form: HTMLFormElement;

  protected template(): HTMLElement {
    this.form = $(Elements.form, {
      class: styles(),
      onsubmit: (e: Event) => {
        e.preventDefault();
        this.props.onSubmit?.(e as SubmitEvent);
      },
    });
    this.form.noValidate = true;
    return this.form;
  }

  getForm(): HTMLFormElement {
    return this.form;
  }
}
