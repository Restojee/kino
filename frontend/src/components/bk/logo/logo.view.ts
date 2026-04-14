import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { Router } from "../../../core/Router";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { getStyles } from "../../../utils/styles.util";
import "./logo.scss";

const styles = getStyles("Logo");

export type LogoSize = "lg" | "sm";

export interface LogoProps extends ComponentProps {
  size?: LogoSize;
}

export class Logo extends Component<LogoProps> {
  protected template(): HTMLElement {
    const size = this.props.size ?? "lg";
    const tag = size === "lg" ? Elements.h1 : Elements.h2;

    return $(
      tag,
      {
        class: `${styles()} ${styles(`size-${size}`)}`,
        onclick: () => Router.navigate("/"),
      },
      new UiText({
        tag: Elements.span,
        text: "БОБ",
        class: `${styles()}__dark`,
      }),
      new UiText({
        tag: Elements.span,
        text: "КИНО",
        class: `${styles()}__accent`,
      }),
    );
  }
}
