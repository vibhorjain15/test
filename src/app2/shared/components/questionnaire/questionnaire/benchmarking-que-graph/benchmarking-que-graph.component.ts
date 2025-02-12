import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import * as c3 from 'c3';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { HttpClient } from '@angular/common/http';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { DiligeneceGridTemplateService } from '../diligence_grid_template.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
@Component({
  selector: 'app-benchmarking-que-graph',
  templateUrl: './benchmarking-que-graph.component.html',
  styleUrls: ['./benchmarking-que-graph.component.css'],
})
export class BenchmarkingQueGraphComponent implements OnInit, OnChanges {
  @Input() templateId;
  @Input() questionId;
  @Input() tagId;
  @Input() responseType;
  @Input() startDate;
  @Input() endDate;
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  aggregations: any;
  is_grid: boolean;
  type: any;
  total_count: number;
  response_display: any;
  item = [];
  sidebarTemplate: string;
  displaySidebarPanel: boolean = false;
  sidebarTitle;
  sidebarContent;
  documents;
  gridName = 'benchmarking_report';
  gridSelectedData = [];
  diligencestemplate: any;
  chart_index = 0;
  return_chart_config: any;
  @Select(UserState.getFirmPreferenceData) firmPref;
  colorScheme: any;
  chart_type: any;
  is_rotated: any;
  bar_width;
  data_count;
  chart_height;
  category;
  columns;
  config;
  @HostListener('document:click', ['$event'])
  DocumentClick(event: Event) {
    this.displaySidebarPanel = false;
  }
  constructor(
    private readonly TemplateDataService: TemplateDataService,
    private readonly store: Store,
    private readonly DiligeneceGrid: DiligeneceGridTemplateService,
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private readonly modal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.is_grid = this.responseType == 'Grid' ? true : false;
    this.diligencestemplate =
      this.DiligeneceGrid.getDiligeneceTemplateGridColumn();
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.colorScheme = this.Utils.getFirmColorScheme(pref);
      }
    });
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.diligencestemplate })
    );

    let type = 'bar';
    if (
      this.responseType == 'Boolean' ||
      this.responseType == 'BooleanPlus' ||
      this.responseType == 'NoPlus'
    ) {
      type = 'pie';
    } else if (this.responseType == 'Grid') {
      type = 'stackedbar';
    }
    this.chart_type = type;
    this.is_rotated =
      this.responseType == 'Integer' ||
      this.responseType == 'Percentage' ||
      this.responseType == 'Date' ||
      this.responseType == 'Numeric' ||
      this.responseType == 'Attachment' ||
      this.responseType == 'ReturnTable' ||
      this.responseType == 'Dropdown' ||
      this.responseType == 'DynamicGrid' ||
      this.responseType == 'aumTable' ||
      this.responseType == 'CheckBox' ||
      this.responseType == 'Bookends'
        ? true
        : false;
    this.chart_index = this.questionId;
  }

  getAggregations() {
    const params = {
      question_id: this.questionId,
      template_id: this.templateId,
      tag_id: this.tagId,
      start_date: this.startDate ?? null,
      end_date: this.endDate ?? null,
    };
    const promises = this.TemplateDataService.getaggregations({
      params,
    }).toPromise();
    promises.then((res) => {
      this.aggregations = res;
      this.total_count = 0;
      if (this.aggregations?.project_count) {
        this.total_count = this.aggregations.project_count;
      }

      for (let index = 0; index < this.aggregations.length; index++) {
        const element = this.aggregations[index];
        this.total_count += element.count;
        this.item.push([element?.response_display, element?.count]);
      }
      if (this.chart_type == 'bar') {
        this.setBarConfig(this.config, res);
      } else if (this.chart_type == 'stackedbar') {
        this.setStackedBarConfig(this.config, res);
      } else {
        this.generateChart(res);
      }
    });
  }

  generateChart(res) {
    c3.generate({
      bindto: `#chart_${this.chart_index}`,
      data: {
        columns: this.item,
        type: this.chart_type,
        empty: {
          label: {
            text: 'Chart not available',
          },
        },
        onclick: (d, element) => {
          this.displayTagsController(this.questionId, this.templateId, d, res);
        },
      },
      axis: {
        rotated: this.is_rotated,
      },
      color: {
        pattern: this.colorScheme,
      },
      onrendered: () => {
        this.addAccessibilityFeatures();
      },
    });
  }

  setBarConfig(chartConfig, response) {
    const labels = response.map((book) => book.response_display);
    const y = response.map((book) => book.count);

    labels.splice(0, 0, 'x');
    y.splice(0, 0, 'count');
    this.bar_width = 30;
    this.data_count = response.length;

    this.chart_height =
      this.data_count * this.bar_width +
      (this.data_count - 1) * (this.bar_width * 0.6);
    this.chart_height = Math.max(this.chart_height, 420);
    c3.generate({
      bindto: `#chart_${this.chart_index}`,
      data: {
        x: 'x',
        columns: [labels, y],
        type: this.chart_type,
        empty: {
          label: {
            text: 'Chart not available',
          },
        },
        onclick: (d, element) => {
          this.displayTagsController(
            this.questionId,
            this.templateId,
            d,
            response
          );
        },
      },
      axis: {
        rotated: true,
        x: {
          type: 'category',
        },
      },
      size: {
        height: this.chart_height,
      },
      bar: {
        width: this.bar_width,
      },
      color: {
        pattern: this.colorScheme,
      },
      onrendered: () => {
        this.addAccessibilityFeatures();
      },
    });
  }

  setStackedBarConfig(chartConfig, response) {
    this.bar_width = 30;
    this.data_count = response.yaxis ? response.yaxis.count : 0;
    this.chart_height =
      this.data_count * this.bar_width +
      (this.data_count - 1) * (this.bar_width * 0.6);
    this.chart_height = Math.max(this.chart_height, 420);
    c3.generate({
      bindto: `#chart_${this.chart_index}`,
      data: {
        groups: [response.yaxis ? response.yaxis : []],
        columns: response.valueArray ? response.valueArray : [],
        type: 'bar',
        labels: true,
        empty: {
          label: {
            text: 'Chart not available',
          },
        },
      },
      grid: {
        y: {
          lines: [{ value: 0 }],
        },
      },
      axis: {
        rotated: false,
        x: {
          type: 'category',
          categories: response.yaxis ? response.yaxis : [],
        },
      },
      size: {
        height: this.chart_height,
      },
      bar: {
        width: this.bar_width,
      },
      color: {
        pattern: this.colorScheme,
      },
      onrendered: () => {
        this.addAccessibilityFeatures();
      },
    });
  }

  getDiligenceList(questionId, templateId, d, res) {
    const params = {};
    params['boolean_value'] = d.name == 'Yes' ? true : false;
    this.endDate ? (params['end_date'] = this.endDate) : '';
    params['question_id'] = questionId;
    this.startDate ? (params['start_date'] = this.startDate) : '';
    params['template_id'] = templateId;
    if (d.name == 'count') {
      if (
        res[d.index].responseMeta?.numericA_max !== undefined &&
        res[d.index].responseMeta.numericA_max !== null
      ) {
        params['numericA_max'] = res[d.index].responseMeta.numericA_max;
      }
      if (
        res[d.index].responseMeta?.numericA_min !== undefined &&
        res[d.index].responseMeta.numericA_min !== null
      ) {
        params['numericA_min'] = res[d.index].responseMeta.numericA_min;
      }
      if (res[d.index].responseMeta?.list_value_id) {
        params['list_value_id'] = res[d.index].responseMeta.list_value_id;
      }
    }

    this.http.get('diligences', { params }).subscribe((response: any) => {
      this.displaySidebarPanel = true;
      this.documents = response;
    });
  }

  onRowSelected = (row) => {
    if (row.node.selected) {
      this.gridSelectedData.push(row.data.permission);
    } else {
      const index = this.gridSelectedData.findIndex(
        (x) => x.id === row.data.permission.id
      );
      if (index !== -1) {
        this.gridSelectedData.splice(index, 1);
      }
    }
  };

  displayTagsController(questionId, templateId, d, response) {
    this.displaySidebarPanel = false;
    this.sidebarTemplate = 'sidebars/dd_by_responses/template.html';
    this.sidebarTitle = 'Due Diligences';
    this.sidebarContent = 'notes';
    this.getDiligenceList(questionId, templateId, d, response);
  }
  addAccessibilityFeatures() {
    const chartElement = this.chartContainer.nativeElement.querySelector('svg');
    if (chartElement) {
      const focusableElements = chartElement.querySelectorAll('tspan');
      focusableElements.forEach((el, index) => {
        el.setAttribute('aria-label', `Data point ${index + 1}`);
        el.setAttribute('role', 'img');
        el.style.backgroundColor = '#ffffff';
        el.style.fill = '#000000';
      });
    }
  }

  ngOnChanges() {
    //Api call will get triggered after generting each graph for generating next one.
    this.getAggregations();
  }
}
