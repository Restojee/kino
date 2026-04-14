import { resolveNode } from "../core/Component";
import { MovieCard } from "../components/bk/movie-card/movie-card.view";
import { UiSlider } from "../components/ui";
import { Movie } from "../types";
import { MoviesService } from "./movies.service";
import { BreakpointService } from "./breakpoint.service";

class MovieCarouselServiceClass {
  private slider?: UiSlider;
  private renderedIds: string[] = [];

  getRootEl(): HTMLElement {
    if (!this.slider) this.buildSlider();
    return resolveNode(this.slider!);
  }

  notifyMounted(): void {
    this.slider?.refresh();
  }

  private buildSlider(): void {
    const movies = MoviesService.getInstance().getMovies();
    this.renderedIds = movies.map((m) => m.id);

    this.slider = new UiSlider({
      slides: movies.map((m) => new MovieCard({ movie: m })),
      spaceBetween: BreakpointService.isMobile ? 10 : 20,
      mousewheel: true,
      observer: true,
      class: "MovieCarousel",
      onReachEnd: () => {
        void MoviesService.getInstance().loadMore();
      },
      onSlideChange: (swiper) => {
        const remaining = swiper.slides.length - (swiper.activeIndex + 1);
        if (remaining < 4) void MoviesService.getInstance().loadMore();
      },
    });

    MoviesService.getInstance().subscribe(() => {
      this.syncSlides(MoviesService.getInstance().getMovies());
    });
  }

  private syncSlides(movies: Movie[]): void {
    if (!this.slider) return;
    const nextIds = movies.map((m) => m.id);

    if (idsEqual(this.renderedIds, nextIds)) return;

    if (isPrefix(this.renderedIds, nextIds)) {
      const added = movies.slice(this.renderedIds.length);
      this.slider.appendSlides(added.map((m) => new MovieCard({ movie: m })));
      this.renderedIds = nextIds;
      return;
    }

    this.slider.setSlides(movies.map((m) => new MovieCard({ movie: m })));
    this.renderedIds = nextIds;
  }
}

function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function isPrefix(prev: string[], next: string[]): boolean {
  if (prev.length === 0) return next.length > 0;
  if (next.length < prev.length) return false;
  for (let i = 0; i < prev.length; i++) if (prev[i] !== next[i]) return false;
  return true;
}

export const MovieCarouselService = new MovieCarouselServiceClass();
