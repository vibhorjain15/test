import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import { DeleteAllRecommendationData } from '../modules/recommendation/store/recommendation.action';
import { DeleteAllData } from '../store/user/user.action';
import { DisconnectWebSocket } from '@ngxs/websocket-plugin';
import { DeleteAllGridData } from '../store/grid/grid.model';

@Injectable({
  providedIn: 'root',
})
export class ResetStoreService {
  constructor(
    private readonly store: Store,
    private readonly RatingService: RatingService
  ) {}

  ResetStoreData() {
    this.store.dispatch(new DeleteAllData());
    this.store.dispatch(new DeleteAllGridData());
    this.store.dispatch(new DeleteAllRecommendationData());
    this.store.dispatch(new DisconnectWebSocket());
    this.RatingService.resetRatingScalesData();
  }
}
