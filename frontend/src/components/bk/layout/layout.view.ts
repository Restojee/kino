import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { Router } from "../../../core/Router";
import { getStyles } from "../../../utils/styles.util";
import { UiIconButton } from "../../ui/ui-icon-button/ui-icon-button.view";
import { Icon, IconSize } from "../../../utils/icons.util";
import { HeaderActions } from "../header-actions/header-actions.view";
import { Logo } from "../logo/logo.view";
import "./layout.scss";

const styles = getStyles("Layout");

export interface LayoutProps extends ComponentProps {
  content: Renderable;
  showBack?: boolean;
}

export class Layout extends Component<LayoutProps> {
  protected template(): Renderable {
    return $(
      Elements.main,
      { class: styles() },
      this.buildDesktopHero(),
      this.buildMobileHeader(),
      this.buildContent(),
    );
  }

  private buildDesktopHero(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__hero` },
      $(Elements.div, { class: `${styles()}__hero-bg` }),
      $(
        Elements.div,
        { class: `${styles()}__hero-content` },
        $(
          Elements.div,
          { class: `${styles()}__top` },
          new Logo({ size: "lg" }),
          $(
            Elements.div,
            { class: `${styles()}__top-right` },
            new HeaderActions(),
          ),
        ),
      ),
      $(Elements.img, {
        class: `${styles()}__pusheen`,
        src: "/assets/bk/pusheen-cats.png",
        alt: "Pusheen cats",
      }),
    );
  }

  private buildMobileHeader(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__mobile-header` },
      $(
        Elements.div,
        { class: `${styles()}__mobile-top` },
        this.buildMobileLeading(),
        new Logo({ size: "sm" }),
        new HeaderActions(),
      ),
    );
  }

  private buildMobileLeading(): Renderable {
    if (this.props.showBack) {
      return new UiIconButton({
        icon: Icon.arrowLeft(IconSize.lg),
        variant: "ghost",
        title: "Назад",
        class: `${styles()}__mobile-back`,
        onClick: () => Router.navigate("/"),
      });
    }
    return $(Elements.span, { class: `${styles()}__mobile-spacer` });
  }

  private buildContent(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__content` },
      this.props.content,
    );
  }
}
