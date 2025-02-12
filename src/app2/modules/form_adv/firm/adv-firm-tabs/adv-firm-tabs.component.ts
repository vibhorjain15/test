import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

import { SubscriptionLike } from 'rxjs';
import { filter } from 'rxjs/operators';

import { RouterService } from 'src/app2/services/router.service';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';

const AdvFirmTabState = {
  Snapshot: 'app.form_adv.firm.snapshot',
  PotentialFlags: 'app.form_adv.firm.potential_flags',
  PrivateFunds: 'app.form_adv.firm.private_funds',
  OwnersOrAffiliates: 'app.form_adv.firm.related_entities',
  History: 'app.form_adv.firm.filings_history',
  QuestionHistory: 'app.form_adv.firm.question_history',
} as const;

@Component({
  selector: 'app-adv-firm-tabs',
  templateUrl: './adv-firm-tabs.component.html',
})
export class AdvFirmTabsComponent implements OnInit {
  readonly baseState: string = 'app.form_adv.firm';
  currentTab: string;
  advFirmTabState = AdvFirmTabState;
  locationSubscription: SubscriptionLike;
  tabList: Array<dvTabsList> = [
    {
      name: 'Snapshot',
      link: AdvFirmTabState.Snapshot,
      active: false,
      condition: true,
    },
    {
      name: 'Potential Flags',
      link: AdvFirmTabState.PotentialFlags,
      active: false,
      condition: true,
    },
    {
      name: 'Private Funds',
      link: AdvFirmTabState.PrivateFunds,
      active: false,
      condition: true,
    },
    {
      name: 'Owners / Affiliates',
      link: AdvFirmTabState.OwnersOrAffiliates,
      active: false,
      condition: true,
    },
    {
      name: 'History',
      link: AdvFirmTabState.History,
      active: false,
      condition: true,
    },
    {
      name: 'Question History',
      link: AdvFirmTabState.QuestionHistory,
      active: false,
      condition: false,
    },
  ];
  firmCRD: any;

  constructor(
    private router: RouterService,
    private routerState: ActivatedRoute,
    private route: Router
  ) {
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
  }

  ngOnInit(): void {
    this.highlightTab();
    this.route.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.highlightTab();
      });
  }

  highlightTab(): void {
    const currentState = window.location.href;
    if (currentState.includes('snapshot')) {
      this.currentTab = 'app.form_adv.firm.snapshot';
    } else if (currentState.includes('potential_flags')) {
      this.currentTab = 'app.form_adv.firm.potential_flags';
    } else if (currentState.includes('private_funds')) {
      this.currentTab = 'app.form_adv.firm.private_funds';
    } else if (currentState.includes('related_entities')) {
      this.currentTab = 'app.form_adv.firm.related_entities';
    } else if (currentState.includes('filings_history')) {
      this.currentTab = 'app.form_adv.firm.filings_history';
    } else if (currentState.includes('question_history')) {
      this.currentTab = 'app.form_adv.firm.question_history';
    }
    this.tabList.forEach(
      (tab: dvTabsList) => (tab.active = tab.link === this.currentTab)
    );
  }

  handleTabChange(tabIndex: number): void {
    this.router.navigateWithParams(this.tabList[tabIndex].link, {
      firmCRD: this.firmCRD,
    });
  }
}
