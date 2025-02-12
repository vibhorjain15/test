import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InviteUserService {
  private selectedTab: string = 'Active';
  private newUser: any;

  setSelectedTab(tab: string, newUser: any = null) {
    this.selectedTab = tab;
    this.newUser = newUser;
  }

  getSelectedTab() {
    return this.selectedTab;
  }

  getNewUser() {
    return this.newUser;
  }
}
