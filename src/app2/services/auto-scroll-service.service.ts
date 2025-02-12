import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AutoScrollServiceService {
  afterScrollEvent: EventEmitter<any> = new EventEmitter();
  constructor() {}
}
