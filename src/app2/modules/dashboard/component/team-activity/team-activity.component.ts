import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import * as D3punchcard from 'src/vendor/d3.punchcard/JS/d3.punchcard';
import * as $ from 'jquery';
import * as d3 from 'd3';

@Component({
  selector: 'app-team-activity',
  templateUrl: './team-activity.component.html',
})
export class TeamActivityComponent implements AfterViewInit {
  @Input('punchcard')
  punchcardDataSource: any;

  @Input('punchcard-options')
  punchcardOptionsDataSource: any;
  @Input('dateRange') private dateRange: any;
  @Input('rowHeaderLabel') private rowHeaderLabel: string;
  @Input('colHeaderLabel') private colHeaderLabel: string;
  @Input('cellValueLabel') private cellValueLabel: string;
  @ViewChild('punchcard') private chartContainer: ElementRef;
  @Input('heading') public title;

  constructor() {}

  ngAfterViewInit() {
    if (
      this.punchcardDataSource.length > 0 &&
      this.punchcardDataSource[0].length > 0
    ) {
      const perMonthwd: any = this.dateRange?.range
        ? Number(this.dateRange?.range)
        : 36;
      let perMonthwdhPlus: any = perMonthwd * 10 * 200;
      let chart = new D3punchcard({
        data: this.punchcardDataSource,
        cellValueLabel: this.cellValueLabel,
        element: this.chartContainer.nativeElement,
        colHeaderLabel: this.colHeaderLabel,
        rowHeaderLabel: this.rowHeaderLabel,
        rowHeaderTextToolTip: (data) => {
          return data.fullName;
        },
        tooltipText: (data) => {
          var str;
          if (!data.count) {
            str = 'No activity';
          } else if (data.count === 1) {
            str = 'One activity';
          } else {
            str = data.count + ' activities';
          }
          return str + ' on ' + data.audit_date;
        },
      });
      chart.draw({
        width: window.outerWidth * perMonthwd + perMonthwdhPlus,
      });
    }
  }
  ngOnDestroy() {
    d3.selectAll(".d3-tip").remove();
  }
}
