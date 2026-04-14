import { Component, Renderable } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { AuthService } from "../../../services/auth.service";
import { getStyles } from "../../../utils/styles.util";
import { UiAvatar } from "../../ui/ui-avatar/ui-avatar.view";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiIconButton } from "../../ui/ui-icon-button/ui-icon-button.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import { AddMovieModal } from "../add-movie-modal/add-movie-modal.view";
import { AuthModal } from "../auth-modal/auth-modal.view";
import { Icon, IconSize } from "../../../utils/icons.util";
import { BreakpointService } from "../../../services/breakpoint.service";
import "./header-actions.scss";

const styles = getStyles("HeaderActions");

export class HeaderActions extends Component {
  private authModal: AuthModal | null = null;
  private addModal: AddMovieModal | null = null;
  private get isMobile() {
    return BreakpointService.isMobile;
  }

  private addAreaEl!: HTMLElement;
  private authAreaEl!: HTMLElement;

  protected onCreated(): void {
    this.addEffect(AuthService.getInstance());
    this.addEffect(BreakpointService);
  }

  protected onDestroyed(): void {
    this.authModal?.destroy();
    this.addModal?.destroy();
  }

  protected template(): HTMLElement {
    this.addAreaEl = $(Elements.div);
    this.authAreaEl = $(Elements.div);
    return $(
      Elements.div,
      { class: styles() },
      this.addAreaEl,
      this.authAreaEl,
    );
  }

  protected onUpdated(): void {
    $replace(this.addAreaEl, this.buildAddBtn());
    this.syncAuth();
  }

  private buildAddBtn(): Renderable {
    const isAuth = AuthService.getInstance().isAuthenticated();
    const title = isAuth ? "Добавить фильм" : "Войдите, чтобы добавлять фильмы";
    const onAdd = () => {
      if (!AuthService.getInstance().isAuthenticated()) {
        this.openAuth();
        return;
      }
      this.openAdd();
    };

    return this.isMobile
      ? new UiIconButton({
          icon: Icon.film(IconSize.md),
          variant: "dark",
          title,
          onClick: onAdd,
        })
      : new UiButton({
          variant: "dark",
          text: "Фильм",
          icon: Icon.film(IconSize.lg),
          title,
          onClick: onAdd,
        });
  }

  private syncAuth(): void {
    const isAuth = AuthService.getInstance().isAuthenticated();

    if (isAuth) {
      const user = AuthService.getInstance().getUser()!;
      $replace(this.authAreaEl, this.buildUserCluster(user));
    } else {
      const loginBtn = this.isMobile
        ? new UiIconButton({
            icon: Icon.user(IconSize.md),
            variant: "secondary",
            title: "Войти",
            onClick: () => this.openAuth(),
          })
        : new UiButton({
            variant: "secondary",
            text: "Войти",
            icon: Icon.user(IconSize.lg),
            onClick: () => this.openAuth(),
          });
      $replace(this.authAreaEl, loginBtn);
    }
  }

  private buildUserCluster(user: {
    name?: string;
    email: string;
  }): HTMLElement {
    const displayName = user.name || user.email;
    return $(
      Elements.div,
      { class: `${styles()}__user` },
      new UiAvatar({ name: displayName, size: "sm" }),
      this.isMobile
        ? null
        : new UiText({
            tag: Elements.span,
            text: displayName,
            class: `${styles()}__user-name`,
          }),
      new UiIconButton({
        icon: Icon.x(IconSize.md),
        variant: "ghost",
        title: "Выйти",
        onClick: () => AuthService.getInstance().logout(),
      }),
    );
  }

  private openAuth(): void {
    if (this.authModal) return;
    this.authModal = new AuthModal({
      onClose: () => {
        this.authModal?.destroy();
        this.authModal = null;
      },
    });
    this.authModal.mount(document.body);
  }

  private openAdd(): void {
    if (this.addModal) return;
    this.addModal = new AddMovieModal({
      onClose: () => {
        this.addModal?.destroy();
        this.addModal = null;
      },
    });
    this.addModal.mount(document.body);
  }
}
