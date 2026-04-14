import { Component } from "../../core/Component";
import { $, Elements } from "../../core/h";
import { Router } from "../../core/Router";
import { getStyles } from "../../utils/styles.util";
import { HomePage } from "../bk/home-page/home-page.view";
import { MoviePage } from "../bk/movie-page/movie-page.view";
import "./app-root.scss";

const styles = getStyles("AppRoot");

export class AppRoot extends Component {
  protected template(): HTMLElement {
    return $(Elements.div, { class: styles() });
  }

  protected onMounted(): void {
    Router.use("/", () => new HomePage())
      .use("/movie/:id", ({ id }) => new MoviePage({ movieId: id }))
      .use("/anime", () => new HomePage())
      .use("/films", () => new HomePage())
      .start(this.el);
  }
}
