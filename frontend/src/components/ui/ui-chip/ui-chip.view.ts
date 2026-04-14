import clsx from "clsx";
import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-chip.scss";

const styles = getStyles("UiChip");

export type UiChipVariant = "solid" | "soft" | "outline";

export interface UiChipProps extends ComponentProps {
  label: string;
  icon?: HTMLElement;
  variant?: UiChipVariant;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export class UiChip extends Component<UiChipProps> {
  constructor(props: UiChipProps) {
    super(props);
  }

  setActive(active: boolean): void {
    this.el.classList.toggle("UiChip_active", active);
  }

  protected template(): HTMLElement {
    const {
      label,
      icon,
      variant = "soft",
      active,
      onClick,
      onRemove,
    } = this.props;

    const cls = clsx(
      styles(),
      `UiChip_variant-${variant}`,
      active && "UiChip_active",
      onClick && "UiChip_clickable",
    );

    const children: HTMLElement[] = [];

    if (icon) {
      const iconEl = $(Elements.span, { class: `${styles()}__icon` }, icon);
      children.push(iconEl);
    }

    children.push($(Elements.span, { class: `${styles()}__label` }, label));

    if (onRemove) {
      children.push(
        $(
          Elements.button,
          {
            class: `${styles()}__remove`,
            type: "button",
            title: "Убрать",
            "aria-label": `Убрать ${label}`,
            onclick: (e: Event) => {
              e.stopPropagation();
              onRemove();
            },
          },
          "×",
        ),
      );
    }

    return $(
      Elements.button,
      {
        class: cls,
        type: "button",
        onclick: onClick ? () => onClick() : undefined,
      },
      ...children,
    );
  }
}
