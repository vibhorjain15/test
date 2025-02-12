import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import * as c3 from 'c3';
import { take, tap } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-donut-chart',
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.css'],
})
export class DonutChartComponent implements OnInit, AfterViewInit {
  @Input() config;
  @ViewChild('donutChart') donutChart;
  c3Config: any;
  chartInitialized: boolean;

  constructor(private readonly Utils: UtilsService) {}

  initChart() {
    if (
      this.donutChart?.nativeElement &&
      this.c3Config &&
      !this.chartInitialized
    ) {
      c3.generate({
        bindto: this.donutChart.nativeElement,
        ...this.c3Config,
      });
      this.chartInitialized = true;
    }
  }

  @Select(UserState.getFirmPreferenceData) firmPref;

  ngOnInit(): void {
    this.init();
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  init() {
    const labelProperty = this.config.options.labelProperty || 'label';
    const valueProperty = this.config.options.valueProperty || 'value';
    this.firmPref.pipe(take(1)).subscribe((pref) => {
      if (pref) {
        const colorScheme = this.Utils.getFirmColorScheme(pref) || [
          '#a90e63',
          '#ffc23f',
          '#f08700',
          '#702169',
          '#087e8b',
        ];
        const donutChartConfig: any = {
          data: { type: 'donut' },
          color: { pattern: colorScheme },
        };
        const columns = this.config.options.data.map((record) => [
          record[labelProperty],
          record[valueProperty],
        ]);
        donutChartConfig.data.columns = columns;
        this.c3Config = donutChartConfig;
        this.initChart();
      }
    });
  }
}
