import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $replace, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import { Icon } from "../../../utils/icons.util";
import "./editable-field.scss";

const styles = getStyles("EditableField");

export type EditableEditorCtor<I extends Component = Component> = new (
  props: { trailing?: Renderable } & Record<string, unknown>,
) => I;

export interface EditableFieldProps<
  T,
  I extends Component = Component,
> extends ComponentProps {
  display: Renderable;
  editor: EditableEditorCtor<I>;
  editorProps?: Record<string, unknown>;
  read: (editor: I) => T;
  reset: (editor: I) => void;
  onSave: (value: T) => void;
  layout?: "inline" | "block";
}

export class EditableField<
  T = unknown,
  I extends Component = Component,
> extends Component<EditableFieldProps<T, I>> {
  protected state = { editing: false };
  private editorInstance: I | null = null;
  private rootEl!: HTMLElement;
  private _editorProps?: Record<string, unknown>;

  protected template(): HTMLElement {
    const layout = this.props.layout ?? "inline";
    this.rootEl = $(Elements.div, {
      class: `${styles()} ${styles(`layout-${layout}`)}`,
    });
    return this.rootEl;
  }

  protected onUpdated(): void {
    const layout = this.props.layout ?? "inline";
    this.tearDownEditor();

    if (this.state.editing) {
      this.rootEl.className = `${styles()} ${styles("editing")} ${styles(`layout-${layout}`)}`;
      const controls = this.buildControls();
      this.editorInstance = new this.props.editor({
        ...(this._editorProps ?? this.props.editorProps ?? {}),
        trailing: controls,
      }) as I;
      $replace(this.rootEl, this.editorInstance);
    } else {
      this.rootEl.className = `${styles()} ${styles(`layout-${layout}`)}`;
      $replace(
        this.rootEl,
        $(Elements.div, { class: `${styles()}__display` }, this.props.display),
        this.buildPencil(),
      );
    }
  }

  private buildPencil(): HTMLElement {
    return $(
      Elements.button,
      {
        class: `${styles()}__pencil`,
        type: "button",
        title: "Редактировать",
        onclick: () => this.enter(),
      },
      Icon.pencil(14),
    );
  }

  private buildControls(): HTMLElement {
    return $(
      Elements.div,
      { class: `${styles()}__actions` },
      this.buildAction("save"),
      this.buildAction("cancel"),
    );
  }

  private buildAction(kind: "save" | "cancel"): HTMLElement {
    const isSave = kind === "save";
    return $(
      Elements.button,
      {
        class: `${styles()}__action ${styles()}__action--${kind}`,
        type: "button",
        title: isSave ? "Сохранить" : "Отмена",
        onclick: isSave ? () => this.commit() : () => this.cancel(),
      },
      isSave ? Icon.check(14) : Icon.x(14),
    );
  }

  private enter(): void {
    this.state.editing = true;
  }

  private commit(): void {
    if (!this.editorInstance) return;
    const value = this.props.read(this.editorInstance);
    this.props.onSave(value);
    this.state.editing = false;
  }

  private cancel(): void {
    if (this.editorInstance) this.props.reset(this.editorInstance);
    this.state.editing = false;
  }

  setEditorProps(editorProps: Record<string, unknown>): void {
    this._editorProps = editorProps;
  }

  private tearDownEditor(): void {
    this.editorInstance?.destroy();
    this.editorInstance = null;
  }
}
