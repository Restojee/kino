import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-spinner.scss";

const styles = getStyles("UiSpinner");

export interface UiSpinnerProps extends ComponentProps {
  size?: number;
}

export class UiSpinner extends Component<UiSpinnerProps> {
  protected template(): HTMLElement {
    const size = this.props.size ?? 16;
    return $(Elements.span, {
      class: styles(),
      style: { width: `${size}px`, height: `${size}px` },
      role: "status",
      "aria-label": "Загрузка",
    });
  }
}
