import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-portfolio-analytics',
  templateUrl: './portfolio-analytics.component.html',
  styleUrls: ['./portfolio-analytics.component.css'],
})
export class PortfolioAnalyticsComponent implements OnInit {
  dataIsLoaded;
  promises;
  typeDonutChartConfig;
  auditorDonutChartConfig;
  pbDonutChartConfig;
  custodianDonutChartConfig;
  adminDonutChartConfig;
  manager_focus_map;
  auditors: any;
  fund_types: any;
  pbs: any;
  admins: any;
  custodians: any;
  geographies: any;
  dashboardConfig;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.promises = [];
    this.typeDonutChartConfig = {
      type: 'donut_chart',
      title: 'Fund Types',
      col:'4',
      options: {
        data: [],
      },
    };
    this.auditorDonutChartConfig = {
      type: 'donut_chart',
      title: 'Auditors',
      options: {
        data: [],
      },
    };
    this.pbDonutChartConfig = {
      type: 'donut_chart',
      title: 'Prime Broker',
      options: {
        data: [],
      },
    };
    this.custodianDonutChartConfig = {
      type: 'donut_chart',
      title: 'Custodian',
      options: {
        data: [],
      },
    };
    this.adminDonutChartConfig = {
      type: 'donut_chart',
      title: 'Administrator',
      options: {
        data: [],
      },
    };
    this.manager_focus_map = {
      type: 'mapael',
      title: 'Manager Location',
      col:'8',
      options: {
        data: [],
      },
    };
    const audit_promise = this.http
      .get('formadv_analytics/service_provider', {
        params: { Type: 'Auditor' },
      })
      .pipe(
        tap((response: any) => {
          this.auditors = response;
          const auditor_obj = [];
          this.auditors.forEach((item) => {
            auditor_obj.push({ label: item.label, value: item.value });
          });
          this.auditorDonutChartConfig.options.data = auditor_obj;
        })
      );
    this.promises.push(audit_promise);
    const type_promise = this.http.get('formadv_analytics/strategy').pipe(
      tap((response: any) => {
        this.fund_types = response;
        const obj = [];
        this.fund_types.forEach((item) => {
          obj.push({ label: item.label, value: item.value });
        });
        this.typeDonutChartConfig.options.data = obj;
      })
    );
    this.promises.push(type_promise);
    const pb_promise = this.http
      .get('formadv_analytics/service_provider', {
        params: { Type: 'PrimeBroker' },
      })
      .pipe(
        tap((response: any) => {
          this.pbs = response;
          const pb_obj = [];
          this.pbs.forEach((item) => {
            pb_obj.push({ label: item.label, value: item.value });
          });
          this.pbDonutChartConfig.options.data = pb_obj;
        })
      );
    this.promises.push(pb_promise);
    const admin_promise = this.http
      .get('formadv_analytics/service_provider', {
        params: { Type: 'Administrator' },
      })
      .pipe(
        tap((response: any) => {
          this.admins = response;
          const admin_obj = [];
          this.admins.forEach((item) => {
            admin_obj.push({ label: item.label, value: item.value });
          });
          this.adminDonutChartConfig.options.data = admin_obj;
        })
      );
    this.promises.push(admin_promise);
    const custody_promise = this.http
      .get('formadv_analytics/service_provider', {
        params: { Type: 'Custodian' },
      })
      .pipe(
        tap((response: any) => {
          this.custodians = response;
          const custodian_obj = [];
          this.custodians.forEach((item) => {
            custodian_obj.push({ label: item.label, value: item.value });
          });
          this.custodianDonutChartConfig.options.data = custodian_obj;
        })
      );
    this.promises.push(custody_promise);
    const geo_promise = this.http.get('formadv_analytics/country').pipe(
      tap((response: any) => {
        this.geographies = response;
        const geography_obj = [];
        this.geographies.forEach((item) => {
          if (item.value === 1) {
            geography_obj.push({
              country: item.label,
              tooltip: item.value + ' manager',
            });
          } else {
            geography_obj.push({
              country: item.label,
              tooltip: item.value + ' managers',
            });
          }
        });
        this.manager_focus_map.options.data = geography_obj;
      })
    );
    this.promises.push(geo_promise);
    forkJoin(this.promises).subscribe(() => {
      this.dataIsLoaded = true;
      this.dashboardConfig = {
        rows: [
          {
            columns: [
              { colSpan: 2, widgets: [this.manager_focus_map] },
              { colSpan: 1, widgets: [this.typeDonutChartConfig] },
            ],
          },
          {
            columns: [
              { colSpan: 1, widgets: [this.auditorDonutChartConfig] },
              { colSpan: 1, widgets: [this.pbDonutChartConfig] },
            ],
          },
          {
            columns: [
              { colSpan: 1, widgets: [this.adminDonutChartConfig] },
              { colSpan: 1, widgets: [this.custodianDonutChartConfig] },
            ],
          },
        ],
      };
    });
  }
}

