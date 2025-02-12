import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { HeatMapType } from '../../directives/heatmap/heatmap.type';
import { IRatingScaleDefinition } from './heatmap.type';
import * as png from 'save-svg-as-png';
import { jsPDF } from 'jspdf';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import {
  IRatingSchemeService,
  IRatingSchemeServiceRoot,
} from 'src/app2/services/rating-schemes/rating-schemes.type';
import { IRatingtypes } from 'src/app2/services/rating-types/rating-types.type';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { ratingConstants } from '../../constants/constant';
import * as excelJS from 'exceljs';
import * as saveAs from 'file-saver';
import { HeatmapService } from 'src/app2/services/heatmap/heatmap.service';
import { UtilsService } from 'src/app2/services/utils.service';
import * as d3 from 'd3';
import { LayoutUtilsService } from 'src/app2/services/layout-utils.service';
@Component({
  selector: 'heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css'],
})
export class HeatMapComponent implements OnInit {
  @Input() id: string = 'DvheatmapChartContainer'; // Heatmap container id
  @Input() heatmapCompleteDataResponse: IRatingSchemeServiceRoot;
  @Input() heatmapColor: Map<number, IRatingScaleDefinition[]>;
  @Input() rating: IRatingtypes;
  @Input() filterConfig: {
    isAverage: boolean;
    isDecimal: boolean;
    isWeightage: boolean;
  } = {
    isAverage: false,
    isDecimal: true,
    isWeightage: true,
  };

  @Output() fullScreenMode: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('downloadDropdown') downloadDropdown: BsDropdownDirective;
  @ViewChild('filterDropdown') filterDropdown: BsDropdownDirective;
  @ViewChild('container', { static: true }) container: ElementRef<HTMLElement>;

  isFullScreenMode: boolean = false;
  heatmapDataResponse: IRatingSchemeService[] = [];
  colors: Map<number, Map<number, string>> = new Map<
    number,
    Map<number, string>
  >(); // rating scale id vs map of (index, color)
  d3ColorScales: Map<number, any> = new Map<number, any>(); // rating scale id vs its d3Scale
  filename: string = 'heatmap ' + new Date().toDateString();
  loading: boolean = false;
  peerAverage = 'Peer Average';
  portfolioAverage = 'Portfolio Average';
  filter = {
    sortState: 'H2L',
    showAverageFirst: true,
    showWeightages: false,
    showDecimalPlaces: false,
    categoryOnly: false,
    showTextDisplay: true,
    showDateDisplay: true,
    showScaleName: false,
    showQuestions: false,
    showCategories: true,
  };
  HeatMapCopy: HeatMapType;
  heatmapData: HeatMapType = {
    orientation: 'x',
    data: [],
  };
  orientation: string = 'x';
  @Select(UserState.getFirmPreferenceData) firmPref;
  loading_prefs: boolean;
  isInverted: boolean;
  totalScoreScaleName: string = 'Rating Name';
  heatmapColumnCount: number = 0;

  constructor(
    private readonly heatmapService: HeatmapService,
    private readonly layoutUtilsService: LayoutUtilsService,
    private readonly utils: UtilsService
  ) {}

  CheckSortAverageData(sort = this.filter.sortState) {
    this.heatmapDataResponse = [];
    let { data, computed } = this.heatmapCompleteDataResponse;
    this.heatmapDataResponse = this.heatmapDataResponse.concat(data);
    this.heatmapDataResponse = this.heatmapDataResponse.sort((a, b) =>
      sort === 'H2L'
        ? +b.total_score - +a.total_score
        : +a.total_score - +b.total_score
    );
    if (this.filter.showAverageFirst) {
      this.heatmapDataResponse = [...computed, ...this.heatmapDataResponse];
    } else {
      this.heatmapDataResponse = [...this.heatmapDataResponse, ...computed];
    }
    this.getHeatmapObject();
  }

  ngOnInit() {
    this.getFirmPref();
    if (this.heatmapColor?.size) {
      this.createScaleMap();
    }
    this.CheckSortAverageData('H2L');
  }

  createScaleMap() {
    this.heatmapColor.forEach((definitions, scaleId) => {
      const requiredScaleData = new Map(
        definitions.map((val) => [val.value, val.color_code])
      );
      this.colors.set(scaleId, requiredScaleData);
    });
    this.createD3ScaleForEachRatingScale();
  }

  createD3ScaleForEachRatingScale() {
    // moved to parent component as it is used in excel export along with the directive
    this.colors.forEach((colorMap, scaleId) => {
      const maxScore = colorMap.size === 1 ? 5 : colorMap.size;
      const scaleArray = [...Array(maxScore).keys()].map((x) => x - 1);
      const colorScheme: any = [...colorMap.values()];
      this.d3ColorScales.set(
        scaleId,
        d3.scaleLinear().domain(scaleArray).range(colorScheme)
      );
    });
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.orientation = response.enable_yaxis_entity ? 'y' : 'x';
        this.isInverted = response.invert_color;
        this.loading_prefs = false;
      }
    });
  }

  getHeatmapObject() {
    this.heatmapData = {
      orientation: this.orientation,
      data: [],
    };
    this.heatmapDataResponse.map((parentval, parentIndex) => {
      let incementalVal = 0;
      parentval.ratings.map((rating) => {
        // category and subcategory level ratings
        rating.value.map((data, index) => {
          this.heatmapData.data.push(
            this.getRatingObject(data, parentval, parentIndex, incementalVal)
          );
          incementalVal = incementalVal + 1;

          // question level ratings
          if (this.filter.showQuestions && data.question_ratings?.length) {
            data.question_ratings.map((question, questionIndex) => {
              this.heatmapData.data.push(
                this.getRatingObject(
                  question,
                  parentval,
                  parentIndex,
                  incementalVal
                )
              );
              incementalVal = incementalVal + 1;
            });
          }
        });
      });

      // final score
      this.heatmapData.data.push(
        this.getFinalRatingObject(parentval, parentIndex, incementalVal)
      );
      // final score with scale name
      this.heatmapData.data.push(
        this.getFinalRatingObject(
          parentval,
          parentIndex,
          incementalVal + 1,
          true
        )
      );
    });
    this.clone();
    this.recalculateColumnCount();
  }

  getRatingObject(data, parentval, parentIndex, incementalVal) {
    const isAbsolute = this.heatmapColor.get(data.rating_scale_id)?.length
      ? this.heatmapColor.get(data.rating_scale_id)[0].scale_mode ===
        ratingConstants.Absolute
      : false;
    const ogScore = isAbsolute
      ? `${data.score_value?.split('.00')[0]}`
      : `${Math.round(Number(data.score_value))}`;
    const rating_scale_name = this.heatmapService.getDisplayText(
      data.rating_scale_name
    );
    return {
      entity_name: parentval.entity_name + '**' + parentval.duediligence_id,
      entity_name_without_dates:
        parentval.entity_name_without_dates + '**' + parentval.duediligence_id,
      column: parentIndex + 1,
      key: this.heatmapService.getDisplayText(data.key),
      value: incementalVal + 1,
      weight: data.weightage,
      scoreValue: data.is_na ? ratingConstants.notRatedValue : data.score_value,
      chartText: data.score_value ? ogScore : rating_scale_name,
      colorVal: data.is_na ? ratingConstants.notRatedValue : data.value,
      isCategory: data.category_level === 1,
      isFinalScore: false,
      rating_scale_id: data.rating_scale_id,
      rating_scale_name: rating_scale_name,
      category_level: data.category_level,
    };
  }

  getFinalRatingObject(
    parentval,
    parentIndex,
    incementalVal,
    showScaleName: boolean = false
  ) {
    const isAbsolute = this.heatmapColor.get(parentval.rating_scale_id)?.length
      ? this.heatmapColor.get(parentval.rating_scale_id)[0].scale_mode ===
        ratingConstants.Absolute
      : false;
    const ogTotalScore = isAbsolute
      ? `${parentval.total_score}`
      : `${Math.round(Number(parentval.total_score))}`;
    const rating_scale_name = this.heatmapService.getDisplayText(
      parentval.rating_scale_name
    );

    return {
      entity_name: parentval.entity_name + '**' + parentval.duediligence_id,
      entity_name_without_dates:
        parentval.entity_name_without_dates + '**' + parentval.duediligence_id,
      column: parentIndex + 1,
      key: showScaleName
        ? this.heatmapService.getDisplayText(this.totalScoreScaleName)
        : 'Total Score',
      value: incementalVal + 1,
      weight: null,
      scoreValue:
        parentval.total_rating == ratingConstants.notRatedValue
          ? ratingConstants.notRatedValue
          : parentval.total_score,
      chartText:
        showScaleName ||
        !parentval.total_score ||
        parentval.total_score === ratingConstants.notRatedValue
          ? rating_scale_name
          : ogTotalScore,
      colorVal: parentval.total_rating,
      isCategory: true,
      isFinalScore: true,
      rating_scale_id: parentval.rating_scale_id,
      rating_scale_name: rating_scale_name,
      category_level: parentval.category_level,
    };
  }

  clone() {
    this.HeatMapCopy = JSON.parse(JSON.stringify(this.heatmapData));
  }

  toggleOrientation() {
    this.orientation = this.orientation === 'x' ? 'y' : 'x';
    this.heatmapData.orientation = this.orientation;
    this.deepCopyHeatmapObject();
    this.recalculateColumnCount();
  }

  deepCopyHeatmapObject() {
    this.heatmapData = JSON.parse(JSON.stringify(this.heatmapData));
  }

  recalculateColumnCount(): void {
    const values =
      this.heatmapData.orientation === 'y'
        ? this.heatmapData.data.map((data) => data.key)
        : this.heatmapData.data.map((data) => data.entity_name);
    const uniqueValues = new Set(values);
    this.heatmapColumnCount = uniqueValues.size + 1;
  }

  sortHeatmap(sort: 'L2H' | 'H2L') {
    this.filter.sortState = sort;
    this.CheckSortAverageData(sort);
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleAverageFirst() {
    this.filter.showAverageFirst = !this.filter.showAverageFirst;
    this.CheckSortAverageData();
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleWeightage() {
    this.filter.showWeightages = !this.filter.showWeightages;
    this.filter.showScaleName = false;
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleDecimalPlaces() {
    this.filter.showDecimalPlaces = !this.filter.showDecimalPlaces;
    this.filter.showScaleName = false;
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleCategoryOnly() {
    this.filter.categoryOnly = !this.filter.categoryOnly;
    if (this.filter.categoryOnly) {
      this.filter.showCategories = true;
      this.filter.showQuestions = false;
    }
    this.textDisplay();
    this.deepCopyHeatmapObject();
    this.recalculateColumnCount();
  }

  toggleCategory() {
    this.filter.showCategories = !this.filter.showCategories;
    this.textDisplay();
    this.deepCopyHeatmapObject();
    this.recalculateColumnCount();
  }

  toggleTextDisplay() {
    this.filter.showTextDisplay = !this.filter.showTextDisplay;
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleDatesDisplay() {
    this.filter.showDateDisplay = !this.filter.showDateDisplay;
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleScaleName() {
    this.filter.showScaleName = !this.filter.showScaleName;
    this.filter.showTextDisplay = true;
    this.textDisplay();
    this.deepCopyHeatmapObject();
  }

  toggleQuestions() {
    this.filter.showQuestions = !this.filter.showQuestions;
    this.getHeatmapObject();
    this.textDisplay();
    this.deepCopyHeatmapObject();
    this.recalculateColumnCount();
  }

  textDisplay() {
    if (this.filter.showTextDisplay) {
      if (this.filter.showScaleName) {
        this.heatmapData.data = this.HeatMapCopy.data.map((val) => ({
          ...val,
          chartText: val.rating_scale_name,
        }));
      } else if (this.filter.showDecimalPlaces && this.filter.showWeightages) {
        this.heatmapData.data = this.HeatMapCopy.data.map((val) => {
          if (val.key === this.totalScoreScaleName) {
            return val;
          }
          let localVal = Number.isInteger(Number(val.scoreValue))
            ? `${Number(val.scoreValue)}.00`
            : `${val.scoreValue}`;
          return {
            ...val,
            chartText: `${val.scoreValue ? localVal : val.rating_scale_name} ${
              val.weight ? '(' + val.weight + '%)' : ''
            }`,
          };
        });
      } else if (this.filter.showDecimalPlaces) {
        this.heatmapData.data = this.HeatMapCopy.data.map((val) => {
          if (val.key === this.totalScoreScaleName) {
            return val;
          }
          let localVal = Number.isInteger(Number(val.scoreValue))
            ? `${Number(val.scoreValue)}.00`
            : `${val.scoreValue}`;

          if (val.key === 'Total Score') {
            return {
              ...val,
              chartText: val.scoreValue ? localVal : val.rating_scale_name,
            };
          }
          return {
            ...val,
            chartText: val.scoreValue ? localVal : val.rating_scale_name,
          };
        });
      } else if (this.filter.showWeightages) {
        this.heatmapData.data = this.HeatMapCopy.data.map((val) => ({
          ...val,
          chartText: `${val.chartText} ${
            val.weight ? '(' + val.weight + '%)' : ''
          }`,
        }));
      } else {
        this.heatmapData.data = this.HeatMapCopy.data.map((val) => ({
          ...val,
          chartText: val.chartText,
        }));
      }
    } else {
      this.heatmapData.data = this.HeatMapCopy.data.map((val) => ({
        ...val,
        chartText: '',
      }));
    }
    if (this.filter.categoryOnly || !this.filter.showCategories) {
      this.heatmapData.data = this.heatmapData.data.filter((val) =>
        this.filter.categoryOnly
          ? val.isCategory
          : val.isFinalScore || !val.isCategory
      );
      let label = this.heatmapData.data[0].entity_name;
      let count = 1;
      this.heatmapData.data = this.heatmapData.data.map((val, index) => {
        if (label !== val.entity_name) {
          count = 1;
          label = val.entity_name;
        }
        let local = {
          ...val,
          value: count,
        };
        count += 1;
        return local;
      });
    }

    this.heatmapData.data = this.heatmapData.data.map((val) => {
      let local = val.entity_name_without_dates;
      let id = local.split('**')[1];
      if (val.entity_name.split('**')[0] === this.portfolioAverage) {
        local = this.portfolioAverage + '**' + id;
      } else if (val.entity_name.split('**')[0] === this.peerAverage) {
        local = this.peerAverage + '**' + id;
      }
      return {
        ...val,
        entity_name: this.filter.showDateDisplay ? val.entity_name : local,
      };
    });
  }

  svg_to_pdf() {
    let localDoc = document.getElementById(`#${this.id}svg`);
    png.svgAsPngUri(localDoc, {}, (uri) => {
      let img = new Image();
      img.src = uri;
      let doc = new jsPDF('p', 'mm', 'a4');
      const bufferX = 5;
      const bufferY = 5;
      const imgProps = (<any>doc).getImageProperties(img);
      const pdfWidth = doc.internal.pageSize.getWidth() - 2 * bufferX;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(
        img,
        'PNG',
        bufferX,
        bufferY,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST'
      );
      doc.save(this.filename);
    });
  }

  saveAsPng() {
    png.saveSvgAsPng(
      document.getElementById(`#${this.id}svg`),
      this.filename + '.png'
    );
  }

  saveAsExcel(isCSV: boolean = false) {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.filename);
    const chartData = this.heatmapService.getChartData();
    this.addScoreAndEntitiesData(chartData, worksheet);
    this.addTemplateData(worksheet);
    this.setColumnsWidth(chartData, worksheet);
    this.downloadFile(workbook, isCSV);
  }

  addScoreAndEntitiesData(chartData: any, worksheet: excelJS.Worksheet) {
    chartData.forEach((obj) => {
      const cell = worksheet.getCell(obj.chart.y + 1, obj.chart.x + 1);
      cell.value =
        !obj.chart.label || isNaN(obj.chart.label)
          ? obj.chart.label
          : +obj.chart.label;

      let color: string;
      if (cell.row == '1' || cell.col == '1') {
        color = '126b82';
      } else {
        color = obj.chart.scoreValue
          ? this.utils.rgbToHex(
              this.heatmapService.getColorFill(obj, this.d3ColorScales)
            )
          : this.colors.get(obj.chart.rating_scale_id).get(0);
        color = color.replace('#', '');
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };

      let fontColor: string;
      if (cell.row == '1' || cell.col == '1') {
        fontColor = 'ffffff';
      } else {
        fontColor =
          this.utils.isColorLightOrDark(
            obj.chart.scoreValue
              ? this.heatmapService.getColorFill(obj, this.d3ColorScales)
              : this.colors.get(obj.chart.rating_scale_id).get(0)
          ) === 'dark'
            ? 'ffffff'
            : '333333';
      }
      cell.font = {
        color: { argb: fontColor },
        bold: cell.row == '1' || cell.col == '1',
      };
      this.alignCellAndAddBorder(cell);
    });
  }

  addTemplateData(worksheet: excelJS.Worksheet) {
    worksheet.getCell(1, 1).value = '';
    this.heatmapData.data
      .filter((data) => data.column === 1)
      .forEach((obj, index) => {
        const row = this.orientation === 'x' ? index + 2 : 1;
        const column = this.orientation === 'x' ? 1 : index + 2;
        const cell = worksheet.getCell(row, column);
        cell.value = this.heatmapService.getDisplayText(obj.key);

        let color = obj.isCategory ? 'eeeeee' : 'ffffff';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };

        cell.font = {
          bold: obj.isCategory,
          italic: obj.category_level === 3,
        };
        this.alignCellAndAddBorder(cell);
      });
  }

  setColumnsWidth(chartData: any, worksheet: excelJS.Worksheet) {
    const columnCount = Math.max(...chartData.map((obj) => obj.chart.x));
    [...Array(columnCount + 1).keys()].map(
      (count) => (worksheet.getColumn(count + 1).width = 25)
    );
  }

  alignCellAndAddBorder(cell: excelJS.Cell) {
    cell.alignment = {
      vertical: 'top',
      horizontal: 'center',
      wrapText: true,
    };
    const borderStyle: Partial<excelJS.Border> = {
      style: 'thin',
      color: { argb: '808080' },
    };
    cell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle,
    };
  }

  downloadFile(workbook: excelJS.Workbook, isCSV: boolean) {
    if (!isCSV) {
      workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
        });
        saveAs(blob, this.filename + '.xlsx');
      });
    } else {
      workbook.csv.writeBuffer().then((data) => {
        const blob = new Blob([data], {
          type: 'text/csv;charset=utf-8',
        });
        saveAs(blob, this.filename + '.csv');
      });
    }
  }

  toggleDropdown(dropdownName: 'filterDropdown' | 'downloadDropdown'): void {
    switch (dropdownName) {
      case 'filterDropdown':
        this.downloadDropdown.hide();
        this.filterDropdown.isOpen
          ? this.filterDropdown.hide()
          : this.filterDropdown.show();
        break;
      case 'downloadDropdown':
        this.filterDropdown.hide();
        this.downloadDropdown.isOpen
          ? this.downloadDropdown.hide()
          : this.downloadDropdown.show();
        break;
    }
  }

  hideDropdowns(): void {
    this.filterDropdown.hide();
    this.downloadDropdown.hide();
  }

  toggleFullScreenMode(isFullScreenMode): void {
    this.hideDropdowns();
    this.layoutUtilsService[
      !isFullScreenMode ? 'exitFullscreenMode' : 'enterFullscreenMode'
    ](this.container.nativeElement);
    this.isFullScreenMode = isFullScreenMode;
    this.fullScreenMode.emit(this.isFullScreenMode);
    let style = document.createElement('style');
    document.head.appendChild(style);
    if (this.isFullScreenMode) {
      style.sheet.insertRule(
        `
          bs-dropdown-container { 
            z-index: 1081 !important;
          }
        `,
        0
      );
    } else {
      style.remove();
    }
  }
}
