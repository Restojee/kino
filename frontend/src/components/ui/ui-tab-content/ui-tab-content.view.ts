import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { UiSlider } from "../ui-slider/ui-slider.view";
import { UiButton } from "../ui-button/ui-button.view";
import clsx from "clsx";
import { getStyles } from "../../../utils/styles.util";
import "./ui-tab-content.scss";

const styles = getStyles("UiTabContent");

export interface TabDef {
  id: string;
  label: string;
  content: () => Renderable;
}

export interface UiTabContentProps extends ComponentProps {
  tabs: TabDef[];
  active?: string;
  slider?: boolean;
}

export class UiTabContent extends Component<UiTabContentProps> {
  private tabBarEl!: Renderable;
  private panelEl!: HTMLElement;
  private activeId!: string;
  private btnRefs: UiButton[] = [];

  protected template(): Renderable {
    const { tabs, slider } = this.props;
    this.activeId = this.props.active ?? tabs[0]?.id ?? "";

    const buttons = tabs.map((tab) => this.buildTabBtn(tab));
    this.btnRefs = buttons;

    if (slider) {
      this.tabBarEl = new UiSlider({
        slides: buttons,
        spaceBetween: 10,
        mousewheel: false,
        class: `${styles()}__bar`,
      });
    } else {
      this.tabBarEl = $(
        Elements.div,
        { class: `${styles()}__bar` },
        ...buttons,
      );
    }

    this.panelEl = $(Elements.div, { class: `${styles()}__panel` });
    this.renderPanel();

    return $(Elements.div, { class: styles() }, this.tabBarEl, this.panelEl);
  }

  private buildTabBtn(tab: TabDef): UiButton {
    return new UiButton({
      variant: "ghost",
      text: tab.label,
      class: clsx(
        `${styles()}__tab`,
        tab.id === this.activeId && `${styles()}__tab_active`,
      ),
      onClick: () => this.setActive(tab.id),
    });
  }

  private setActive(id: string): void {
    if (id === this.activeId) return;
    this.activeId = id;
    this.syncTabs();
    this.renderPanel();
  }

  private syncTabs(): void {
    const { tabs } = this.props;
    tabs.forEach((tab, i) => {
      const btn = this.btnRefs[i];
      if (!btn) return;
      btn.setClassName(
        clsx(
          `${styles()}__tab`,
          tab.id === this.activeId && `${styles()}__tab_active`,
        ),
      );
    });
  }

  private renderPanel(): void {
    const tab = this.props.tabs.find((t) => t.id === this.activeId);
    if (!tab) return;
    $replace(this.panelEl, tab.content());
  }
}
