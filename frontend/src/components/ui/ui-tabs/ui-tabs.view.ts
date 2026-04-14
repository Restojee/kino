import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { UiButton } from "../ui-button/ui-button.view";
import { UiSlider } from "../ui-slider/ui-slider.view";
import { getStyles } from "../../../utils/styles.util";
import "./ui-tabs.scss";

const styles = getStyles("UiTabs");

export interface UiTab {
  id: string;
  label: string;
}

export interface UiTabsProps extends ComponentProps {
  tabs: UiTab[];
  active: string;
  onChange: (id: string) => void;
  slider?: boolean;
}

export class UiTabs extends Component<UiTabsProps> {
  private btnRefs: UiButton[] = [];

  protected template(): Renderable {
    const { tabs, active, slider } = this.props;

    const buttons = tabs.map((tab) => this.buildBtn(tab, active));
    this.btnRefs = buttons;

    if (slider) {
      return new UiSlider({
        slides: buttons,
        spaceBetween: 10,
        mousewheel: false,
        class: styles(),
      });
    }

    return $(Elements.div, { class: styles(), role: "tablist" }, ...buttons);
  }

  setActive(id: string): void {
    const { tabs } = this.props;
    tabs.forEach((tab, i) => {
      const btn = this.btnRefs[i];
      if (!btn) return;
      btn.setClassName(
        clsx(`${styles()}__tab`, tab.id === id && `${styles()}__tab_active`),
      );
    });
  }

  private buildBtn(tab: UiTab, active: string): UiButton {
    const isActive = tab.id === active;
    return new UiButton({
      variant: "ghost",
      text: tab.label,
      class: clsx(`${styles()}__tab`, isActive && `${styles()}__tab_active`),
      onClick: () => this.props.onChange(tab.id),
    });
  }
}
