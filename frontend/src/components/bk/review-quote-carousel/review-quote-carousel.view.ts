import { Component } from "../../../core/Component";
import { ReviewQuotesService } from "../../../services/review-quotes.service";
import { ReviewQuote } from "../../../types";
import { UiSlider } from "../../ui/ui-slider/ui-slider.view";
import { ReviewQuoteCard } from "../review-quote-card/review-quote-card.view";
import "./review-quote-carousel.scss";

export class ReviewQuoteCarousel extends Component {
  private slider!: UiSlider;
  private renderedIds: string[] = [];

  protected onCreated(): void {
    this.addEffect(
      ReviewQuotesService.getInstance().subscribe(() => this.syncSlides()),
    );
  }

  protected template(): UiSlider {
    const quotes = ReviewQuotesService.getInstance().getQuotes();
    this.renderedIds = quotes.map((q) => q.id);

    this.slider = new UiSlider({
      slides: quotes.map((q) => this.buildCard(q)),
      spaceBetween: 18,
      mousewheel: true,
      observer: true,
      class: "ReviewQuoteCarousel",
    });

    return this.slider;
  }

  private syncSlides(): void {
    const quotes = ReviewQuotesService.getInstance().getQuotes();
    const nextIds = quotes.map((q) => q.id);
    if (idsEqual(this.renderedIds, nextIds)) return;

    this.slider.setSlides(quotes.map((q) => this.buildCard(q)));
    this.renderedIds = nextIds;
  }

  private buildCard(quote: ReviewQuote): ReviewQuoteCard {
    return new ReviewQuoteCard({ quote });
  }
}

function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
