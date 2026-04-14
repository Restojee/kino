import { Review, Comment } from "../types";
import { ApiService } from "../api/api.service";
import { Service } from "../core/Service";

export class ReviewsService extends Service {
  private static instance: ReviewsService;
  static getInstance(): ReviewsService {
    if (!ReviewsService.instance) {
      ReviewsService.instance = new ReviewsService();
    }
    return ReviewsService.instance;
  }

  reviews: Review[] = [];
  currentPlaceId: string | null = null;

  private api = ApiService.getInstance();

  private constructor() {
    super();
  }

  getReviews(): Review[] {
    return this.reviews;
  }

  async setCurrentPlace(placeId: string): Promise<void> {
    this.currentPlaceId = placeId;
    await this._load();
  }

  async addReview(review: Omit<Review, "id" | "comments">): Promise<void> {
    try {
      const newReview: Review = {
        ...review,
        id: Date.now().toString(),
        comments: [],
      };
      await this.api.post<Review>("reviews", newReview);
      await this._load();
    } catch (e) {
      console.error("Failed to add review:", e);
    }
  }

  async addComment(
    reviewId: string,
    comment: Omit<Comment, "id">,
  ): Promise<void> {
    try {
      const review = this.reviews.find((r) => r.id === reviewId);
      if (!review) return;
      const updated: Review = {
        ...review,
        comments: [
          ...review.comments,
          { ...comment, id: Date.now().toString() },
        ],
      };
      await this.api.put<Review>(`reviews/${reviewId}`, updated);
      await this._load();
    } catch (e) {
      console.error("Failed to add comment:", e);
    }
  }

  private async _load(): Promise<void> {
    if (!this.currentPlaceId) return;
    try {
      this.reviews = await this.api.get<Review[]>(
        `reviews?placeId=${this.currentPlaceId}`,
      );
    } catch (e) {
      console.error("Failed to load reviews:", e);
      this.reviews = [];
    }
    this.emit();
  }
}
