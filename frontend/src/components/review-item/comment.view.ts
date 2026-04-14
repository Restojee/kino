import { Component, ComponentProps } from "../../core/Component";
import { $, Elements } from "../../core/h";
import { Comment as CommentType } from "../../types";

export interface CommentProps extends ComponentProps {
  comment: CommentType;
}

export class Comment extends Component<CommentProps> {
  constructor(props: CommentProps) {
    super(props);
  }

  protected template(): HTMLElement {
    const { comment: c } = this.props;

    return $(
      Elements.div,
      { class: "comment" },
      $(
        Elements.div,
        { class: "commentHeader" },
        $(Elements.strong, {}, c.author),
        $(
          Elements.span,
          { class: "commentDate" },
          new Date(c.date).toLocaleDateString("ru-RU"),
        ),
      ),
      $(Elements.p, { class: "commentText" }, c.text),
    );
  }
}
