import Swiper from "swiper";
import { Navigation, FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import clsx from "clsx";
import { Component, ComponentProps, Renderable } from "../../../core/Component";
import { $, $append, $replace, Elements } from "../../../core/h";
import { getStyles } from "../../../utils/styles.util";
import "./ui-slider.scss";

const styles = getStyles("UiSlider");

export interface UiSliderProps extends ComponentProps {
  slides?: Renderable[];
  spaceBetween?: number;
  freeMode?: boolean;
  grabCursor?: boolean;
  mousewheel?: boolean;
  observer?: boolean;
  class?: string;
  onReachEnd?: () => void;
  onSlideChange?: (swiper: Swiper) => void;
}

export class UiSlider extends Component<UiSliderProps> {
  private swiper?: Swiper;
  private wrapperEl!: HTMLElement;

  protected template(): HTMLElement {
    this.wrapperEl = $(Elements.div, { class: "swiper-wrapper" });

    const cls = clsx(styles(), "swiper", this.props.class);
    const root = $(Elements.div, { class: cls }, this.wrapperEl);

    const initial = this.props.slides ?? [];
    $append(this.wrapperEl, ...initial.map((s) => this.wrapSlide(s)));

    return root;
  }

  protected onMounted(): void {
    this.initSwiper();
  }

  protected onDestroyed(): void {
    this.swiper?.destroy(true, true);
    this.swiper = undefined;
  }

  /** Replace all slides */
  setSlides(slides: Renderable[]): void {
    $replace(this.wrapperEl, ...slides.map((s) => this.wrapSlide(s)));
    this.swiper?.update();
  }

  appendSlides(slides: Renderable[]): void {
    $append(this.wrapperEl, ...slides.map((s) => this.wrapSlide(s)));
    this.swiper?.update();
  }

  getSwiperInstance(): Swiper | undefined {
    return this.swiper;
  }

  refresh(): void {
    this.swiper?.update();
  }

  private wrapSlide(child: Renderable): HTMLElement {
    return $(Elements.div, { class: "swiper-slide" }, child);
  }

  private initSwiper(): void {
    const el = this.el;
    if (!el) return;

    const modules = [FreeMode];
    if (this.props.mousewheel !== false) modules.push(Mousewheel);
    if (this.props.observer) modules.push(Navigation);

    const on: Record<string, unknown> = {};
    if (this.props.onReachEnd) on.reachEnd = this.props.onReachEnd;
    if (this.props.onSlideChange)
      on.slideChange = () => this.props.onSlideChange?.(this.swiper!);

    this.swiper = new Swiper(el, {
      modules,
      slidesPerView: "auto",
      spaceBetween: this.props.spaceBetween ?? 18,
      freeMode: this.props.freeMode !== false,
      mousewheel:
        this.props.mousewheel !== false ? { forceToAxis: true } : false,
      grabCursor: this.props.grabCursor !== false,
      observer: this.props.observer ?? false,
      observeParents: this.props.observer ?? false,
      on,
    });
  }
}
