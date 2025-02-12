import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NewAccessLevelServiceService {
  newAccessLevelSub: Subject<any> = new Subject();

  getUpdatedAccessLevels() {
    this.newAccessLevelSub.next();
  }
}
