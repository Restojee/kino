import { Component } from "../../../core/Component";
import { Renderable } from "../../../core/Component";
import { MoviesService } from "../../../services/movies.service";
import { BreakpointService } from "../../../services/breakpoint.service";
import { UiTabs } from "../../ui/ui-tabs/ui-tabs.view";

const TABS = [
  { id: "latest", label: "Последние" },
  { id: "best", label: "Лучшее" },
  { id: "pending", label: "В ожидании" },
];

export class FilterTabs extends Component {
  private tabs!: UiTabs;

  protected onCreated(): void {
    this.addEffect(MoviesService.getInstance());
  }

  protected template(): Renderable {
    this.tabs = new UiTabs({
      tabs: TABS,
      active: MoviesService.getInstance().getSortTab(),
      slider: BreakpointService.isMobile,
      onChange: (id) =>
        MoviesService.getInstance().setSortTab(
          id as "latest" | "best" | "pending",
        ),
    });
    return this.tabs;
  }

  protected onUpdated(): void {
    this.tabs.setActive(MoviesService.getInstance().getSortTab());
  }
}
