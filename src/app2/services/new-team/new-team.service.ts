import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NewTeamServiceService {
  newTeamSub: Subject<any> = new Subject();

  getUpdatedTeams() {
    this.newTeamSub.next();
  }
}
