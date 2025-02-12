import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { DvHandsontableComponent } from 'src/app2/shared/components';
import { HandsOnTableGridHelper } from 'src/app2/shared/helpers/handsOnTableGridHelper';
@Component({
  selector: 'app-import-grid',
  templateUrl: './import-grid.component.html',
  styleUrls: ['./import-grid.component.css'],
})
export class ImportGridModal implements OnInit, AfterViewInit, OnChanges {
  @Input() rows;
  @Input() columns;
  @Input() dataset;

  additionalHandsOnTableSettings;
  isModalReady = false;
  handsOnTableId = 'grid-handsontable-' + Math.random();

  @ViewChild('grid') gridRef: DvHandsontableComponent;

  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.additionalHandsOnTableSettings = {
      height: 300,
      stretchH: 'all',
      selectionMode: 'range',
      outsideClickDeselects: false,
    };
    if (this.columns) {
      this.updateColumns();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.columns?.currentValue) {
      this.updateColumns();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isModalReady = true;
    }, 500);
  }

  import(close) {
    let hotInstance = this.gridRef.getHotInstance();
    let data = hotInstance.getData();
    this.clipboardService.copy(HandsOnTableGridHelper.getTableString(data));
    this.toaster.success('Response copied to clipboard');
    close();
  }

  importSelection(close) {
    let hotInstance = this.gridRef.getHotInstance();
    const selected = hotInstance.getSelected() || [];
    let data = [];

    selected.forEach((item) => {
      data = data.concat(
        hotInstance.getData(...item.map((index) => (index < 0 ? 0 : index)))
      );
    });

    this.clipboardService.copy(HandsOnTableGridHelper.getTableString(data));
    this.toaster.success('Response copied to clipboard');
    close();
  }

  updateColumns() {
    this.additionalHandsOnTableSettings = {
      ...this.additionalHandsOnTableSettings,
      columns: this.columns
        .sort((item1, item2) => item1.order < item2.order)
        .map((column, index) => {
          return {
            title: column.name,
            data: `column_${index}`,
          };
        }),
    };
  }
}
