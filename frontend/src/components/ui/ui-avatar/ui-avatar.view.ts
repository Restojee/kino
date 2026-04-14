import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-avatar.scss";

const styles = getStyles("UiAvatar");

export type UiAvatarSize = "sm" | "md";

export interface UiAvatarProps extends ComponentProps {
  name: string;
  size?: UiAvatarSize;
}

export class UiAvatar extends Component<UiAvatarProps> {
  protected template(): HTMLElement {
    const size = this.props.size ?? "md";
    const letter = this.props.name.slice(0, 1).toUpperCase();
    return $(
      Elements.span,
      {
        class: `${styles()} ${styles(`size-${size}`)}`,
      },
      letter,
    );
  }
}
