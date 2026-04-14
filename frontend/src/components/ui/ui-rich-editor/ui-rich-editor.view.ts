import Quill from "quill";
import "quill/dist/quill.snow.css";

import { Component, ComponentProps } from "../../../core/Component";
import { $, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-rich-editor.scss";

const styles = getStyles("UiRichEditor");

export interface UiRichEditorProps extends ComponentProps {
  value?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
}

export class UiRichEditor extends Component<UiRichEditorProps> {
  private quill?: Quill;
  declare private wrapper: HTMLDivElement;
  declare private host: HTMLDivElement;

  constructor(props?: UiRichEditorProps) {
    const host = $(Elements.div, { class: `${styles()}__host` });
    const wrapper = $(Elements.div, { class: styles() }, host);

    super({
      ...props,
      children: { wrapper },
    });

    this.wrapper = wrapper as HTMLDivElement;
    this.host = host as HTMLDivElement;

    this.quill = new Quill(this.host, {
      theme: "snow",
      placeholder: this.props.placeholder ?? "Напишите что-нибудь…",
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link"],
          ["clean"],
        ],
      },
    });

    if (this.props.value) {
      this.quill.clipboard.dangerouslyPasteHTML(this.props.value);
    }

    this.quill.on("text-change", () => {
      this.props.onChange?.(this.getValue());
    });
  }

  protected template(): HTMLElement {
    return this.props.children!.wrapper as HTMLDivElement;
  }

  protected onDestroyed(): void {
    this.quill = undefined;
  }

  getValue(): string {
    if (!this.quill) return "";
    const html = this.quill.root.innerHTML.trim();
    if (html === "<p><br></p>" || html === "<p></p>" || html === "") return "";
    return html;
  }

  setValue(html: string): void {
    if (!this.quill) return;
    if (html) {
      this.quill.clipboard.dangerouslyPasteHTML(html);
    } else {
      this.quill.setText("");
    }
  }

  isEmpty(): boolean {
    return this.getValue() === "";
  }

  focus(): void {
    this.quill?.focus();
  }
}
