import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-generic',
  templateUrl: './generic-tags.component.html',
  styleUrls: ['./generic-tags.component.css'],
})
export class GenericTagsComponent implements OnInit {
  tagsList = [];
  userType;
  tags;
  is_investor: boolean;
  is_admin: any;
  firmPreferences;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) getFirmPreferences;
  constructor(
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.getFirmPreferences.pipe(take(2)).subscribe((firmPreferences) => {
      if (firmPreferences) {
        this.firmPreferences = firmPreferences;
        let issueTag = this.tagsList?.find((item) => item.name === 'Issue');
        if (issueTag) {
          issueTag.label = `${
            this.firmPreferences.issue_tracker_default_name ?? 'Recommendation'
          } Tracker`;
        }
      }
    });
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.is_investor = user.isInvestor;
          this.initialize();
        }
      });
  }

  initialize() {
    this.userType = this.is_investor ? 'investor' : 'manager';
    this.tagsList = [
      {
        label: 'Asset Allocation',
        name: 'AssetAllocation',
        desc: 'your asset allocation buckets, eg, Core fixed income, Global equities, Liability hedging',
        hidden_from: 'manager',
      },
      {
        label: 'Conviction Level',
        name: 'Conviction',
        desc: 'your conviction level, eg. High, Low',
        hidden_from: 'manager',
      },
      {
        label: 'Geographic Focus',
        name: 'Geography',
        desc: 'manager geographic focus, eg. Western Europe, Africa',
        hidden_from: 'manager',
      },
      {
        label: 'Investment Thesis',
        name: 'InvestmentThesis',
        desc: 'your investment thesis, eg. EM growth, USD strength',
        hidden_from: 'manager',
      },
      {
        label: 'Watch List',
        name: 'WatchList',
        desc: 'your watchlist criteria, eg. Quant, Qual, Keyman',
        hidden_from: 'manager',
      },
      {
        label: 'Relationship Status',
        name: 'Status',
        desc: 'your manager, fund status, eg. Prospective, Current, Terminated',
      },
      {
        label: 'Question Category',
        name: 'Question',
        desc: 'questions categories, eg. Legal, Investments, Firm-level',
        hidden_from: 'investor',
      },
      {
        label: `${
          this.firmPreferences.issue_tracker_default_name ?? 'Recommendation'
        } Tracker`,
        name: 'Issue',
        desc: 'question, project and entities eg. Performance, Policy and Procedures',
      },
    ];
    this.tags = {};
    this.getTags();
  }

  getTags() {
    this.tagsList.forEach((tag) => {
      this.loadTags(tag.name);
    });
  }

  loadTags(type) {
    this.http.get('tags', { params: { type } }).subscribe((response: any) => {
      this.tags[type] = response;
      this.sortTags(type);
    });
  }

  sortTags(type) {
    this.tags[type].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }
}

