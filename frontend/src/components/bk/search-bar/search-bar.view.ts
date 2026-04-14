import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { SearchService } from "../../../services/search.service";
import { UiIconInput } from "../../ui/ui-icon-input/ui-icon-input.view";

export interface SearchBarProps extends ComponentProps {
  placeholder?: string;
  fullWidth?: boolean;
}

export class SearchBar extends Component<SearchBarProps> {
  protected template(): Renderable {
    const search = SearchService.getInstance();
    const field = new UiIconInput({
      placeholder: this.props.placeholder ?? "Поиск по названию",
      value: search.getQuery(),
      onInput: search.setQuery.bind(search),
      fullWidth: this.props.fullWidth,
    });
    return field;
  }
}
