import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-modal.scss";

const styles = getStyles("UiModal");

export interface UiModalProps extends ComponentProps {
  title?: string;
  body: Renderable;
  footer?: Renderable;
  onClose: () => void;
}

export class UiModal extends Component<UiModalProps> {
  declare private titleEl: HTMLElement | null;

  private static _openCount = 0;
  private _isLocking = false;
  private _mouseDownOnBackdrop = false;
  private _closing = false;

  protected onMounted(): void {
    document.addEventListener("keydown", this.handleEsc);
    if (!this._isLocking) {
      this._isLocking = true;
      UiModal._openCount++;
      document.body.style.overflow = "hidden";
    }
  }

  protected onDestroyed(): void {
    document.removeEventListener("keydown", this.handleEsc);
    if (this._isLocking) {
      this._isLocking = false;
      UiModal._openCount = Math.max(0, UiModal._openCount - 1);
      if (UiModal._openCount === 0) {
        document.body.style.overflow = "";
      }
    }
  }

  private handleEsc = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.close();
  };

  close(): void {
    if (this._closing) return;
    this._closing = true;
    const el = this.el;
    el.classList.add(`${styles()}_closing`);
    const card = el.querySelector(`.${styles()}__card`) as HTMLElement;
    if (card) {
      card.addEventListener("animationend", () => this.props.onClose(), {
        once: true,
      });
    } else {
      this.props.onClose();
    }
  }

  setTitle(title: string): void {
    if (this.titleEl) this.titleEl.textContent = title;
  }

  protected template(): Renderable {
    const { title, body, footer } = this.props;

    this.titleEl = title
      ? $(Elements.h3, { class: `${styles()}__title` }, title)
      : null;

    const header = this.titleEl
      ? $(
          Elements.div,
          { class: `${styles()}__header` },
          this.titleEl,
          $(
            Elements.button,
            {
              class: `${styles()}__close`,
              type: "button",
              "aria-label": "Закрыть",
              onclick: () => this.close(),
            },
            "×",
          ),
        )
      : null;

    const footerEl = footer
      ? $(Elements.div, { class: `${styles()}__footer` }, footer)
      : null;

    const card = $(
      Elements.div,
      {
        class: `${styles()}__card`,
        role: "dialog",
        "aria-modal": "true",
      },
      header,
      $(Elements.div, { class: `${styles()}__body` }, body),
      footerEl,
    );

    return $(
      Elements.div,
      {
        class: styles(),
        onmousedown: (e: Event) => {
          this._mouseDownOnBackdrop = e.target === e.currentTarget;
        },
        onmouseup: (e: Event) => {
          if (this._mouseDownOnBackdrop && e.target === e.currentTarget) {
            this.close();
          }
          this._mouseDownOnBackdrop = false;
        },
      },
      card,
    );
  }
}
