import "swiper/css";
import "swiper/css/navigation";

import { Component } from "../../../core/Component";
import { MovieCarouselService } from "../../../services/movie-carousel.service";
import "./movie-carousel.scss";

export class MovieCarousel extends Component {
  protected template(): HTMLElement {
    return MovieCarouselService.getRootEl();
  }

  protected onMounted(): void {
    MovieCarouselService.notifyMounted();
  }
}
