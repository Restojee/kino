import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $replace, $text, Elements } from "../../../core/h";
import { AuthService } from "../../../services/auth.service";
import { getStyles } from "../../../utils/styles.util";
import { UiButton } from "../../ui/ui-button/ui-button.view";
import { UiInput } from "../../ui/ui-input/ui-input.view";
import { UiModal } from "../../ui/ui-modal/ui-modal.view";
import { UiText } from "../../ui/ui-text/ui-text.view";
import "./auth-modal.scss";

const styles = getStyles("AuthModal");

type Mode = "login" | "register";

export interface AuthModalProps extends ComponentProps {
  onClose: () => void;
  onAuthenticated?: () => void;
}

export class AuthModal extends Component<AuthModalProps> {
  declare private mode: Mode;
  declare private busy: boolean;
  declare private error: string | null;

  declare private email: string;
  declare private password: string;
  declare private name: string;

  declare private emailInput: UiInput;
  declare private passInput: UiInput;
  declare private nameInput: UiInput;
  declare private submitBtn: UiButton;
  declare private modal: UiModal;

  declare private loginTab: UiButton;
  declare private registerTab: UiButton;
  declare private nameField: HTMLElement;
  declare private errorEl: HTMLDivElement;
  declare private hintEl: HTMLParagraphElement;

  constructor(props: AuthModalProps) {
    super(props);
    this.mode = "login";
    this.busy = false;
    this.error = null;
    this.email = "";
    this.password = "";
    this.name = "";
  }

  protected onDestroyed(): void {
    this.modal?.destroy();
  }

  protected template(): Renderable {
    const tabs = this.buildTabs();
    const nameField = this.buildNameField();
    const emailField = this.buildField("Email", this.buildEmailInput());
    const passField = this.buildField("Пароль", this.buildPasswordInput());
    const errorEl = this.buildErrorBlock();
    const actions = this.buildActions();
    const hintEl = this.buildHint();

    const body = $(
      Elements.form,
      {
        class: `${styles()}__form`,
        onsubmit: (e: Event) => {
          e.preventDefault();
          this.submit();
        },
      },
      tabs,
      nameField,
      emailField,
      passField,
      errorEl,
      actions,
      hintEl,
    );

    this.modal = new UiModal({
      title: "Вход в КИНО",
      body,
      onClose: () => this.props.onClose(),
    });
    return this.modal;
  }

  private buildTabs(): HTMLElement {
    this.loginTab = this.buildTabButton("login", "Вход");
    this.registerTab = this.buildTabButton("register", "Регистрация");
    return $(
      Elements.div,
      { class: `${styles()}__tabs` },
      this.loginTab,
      this.registerTab,
    );
  }

  private buildTabButton(mode: Mode, label: string): UiButton {
    const active = this.mode === mode;
    return new UiButton({
      variant: "ghost",
      text: label,
      class: clsx(`${styles()}__tab`, active && styles("tab-active")),
      onClick: () => this.setMode(mode),
    });
  }

  private buildEmailInput(): Renderable {
    this.emailInput = new UiInput({
      type: "email",
      placeholder: "you@example.com",
      value: this.email,
      onInput: (v) => {
        this.email = v;
      },
    });
    return this.emailInput;
  }

  private buildPasswordInput(): Renderable {
    this.passInput = new UiInput({
      type: "password",
      placeholder: "••••••••",
      value: this.password,
      onInput: (v) => {
        this.password = v;
      },
    });
    return this.passInput;
  }

  private buildNameField(): HTMLElement {
    this.nameInput = new UiInput({
      type: "text",
      placeholder: "Как к вам обращаться",
      value: this.name,
      onInput: (v) => {
        this.name = v;
      },
    });
    this.nameField = this.buildField("Имя", this.nameInput);
    this.nameField.style.display = this.mode === "register" ? "" : "none";
    return this.nameField;
  }

  private buildField(label: string, input: Renderable): HTMLElement {
    return $(
      Elements.label,
      { class: `${styles()}__field` },
      new UiText({
        tag: Elements.span,
        text: label,
        variant: "label",
        class: `${styles()}__label`,
      }),
      input,
    );
  }

  private buildErrorBlock(): HTMLElement {
    this.errorEl = $(Elements.div, {
      class: `${styles()}__error`,
    }) as HTMLDivElement;
    this.errorEl.style.display = "none";
    return this.errorEl;
  }

  private buildActions(): HTMLElement {
    this.submitBtn = new UiButton({
      type: "button",
      variant: "primary",
      text: this.mode === "login" ? "Войти" : "Создать аккаунт",
      onClick: () => this.submit(),
    });
    return $(Elements.div, { class: `${styles()}__actions` }, this.submitBtn);
  }

  private buildHint(): HTMLElement {
    this.hintEl = $(Elements.p, {
      class: `${styles()}__hint`,
    }) as HTMLParagraphElement;
    this.renderHint(this.mode);
    return this.hintEl;
  }

  private setMode(mode: Mode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.applyMode();
    this.setError(null);
  }

  private setBusy(busy: boolean): void {
    if (this.busy === busy) return;
    this.busy = busy;
    this.applyBusy();
  }

  private setError(error: string | null): void {
    if (this.error === error) return;
    this.error = error;
    this.applyError();
  }

  private applyMode(): void {
    const s = styles();
    this.loginTab.setClassName(
      clsx(`${s}__tab`, this.mode === "login" && styles("tab-active")),
    );
    this.registerTab.setClassName(
      clsx(`${s}__tab`, this.mode === "register" && styles("tab-active")),
    );

    this.nameField.style.display = this.mode === "register" ? "" : "none";
    this.modal.setTitle(this.mode === "login" ? "Вход в КИНО" : "Регистрация");

    this.submitBtn.setText(this.submitLabel());
    this.renderHint(this.mode);
  }

  private applyBusy(): void {
    this.submitBtn.setDisabled(this.busy);
    this.submitBtn.setText(this.submitLabel());
  }

  private applyError(): void {
    if (this.error) {
      this.errorEl.textContent = this.error;
      this.errorEl.style.display = "";
    } else {
      this.errorEl.textContent = "";
      this.errorEl.style.display = "none";
    }
  }

  private submitLabel(): string {
    if (this.busy) return "...";
    return this.mode === "login" ? "Войти" : "Создать аккаунт";
  }

  private renderHint(mode: Mode): void {
    if (mode === "login") {
      $replace(
        this.hintEl,
        $text("Нет аккаунта? "),
        new UiButton({
          variant: "ghost",
          text: "Зарегистрируйтесь",
          class: `${styles()}__link`,
          onClick: () => this.setMode("register"),
        }),
      );
    } else {
      $replace(
        this.hintEl,
        $text("Уже есть аккаунт? "),
        new UiButton({
          variant: "ghost",
          text: "Войти",
          class: `${styles()}__link`,
          onClick: () => this.setMode("login"),
        }),
      );
    }
  }

  private async submit(): Promise<void> {
    if (this.busy) return;
    const email = this.email.trim();
    const password = this.password;
    const name = this.name.trim();

    if (!email || !password || (this.mode === "register" && !name)) {
      this.setError("Заполните все поля");
      return;
    }

    this.setBusy(true);
    this.setError(null);

    try {
      const auth = AuthService.getInstance();
      if (this.mode === "login") {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, name);
      }
      this.props.onAuthenticated?.();
      this.props.onClose();
    } catch (e) {
      this.setError(e instanceof Error ? e.message : "Что-то пошло не так");
    } finally {
      this.setBusy(false);
    }
  }
}
