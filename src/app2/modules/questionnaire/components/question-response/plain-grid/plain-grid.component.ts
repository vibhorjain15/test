import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'plain-grid',
  templateUrl: './plain-grid.component.html',
  styleUrls: ['./plain-grid.component.css'],
})
export class PlainGridComponent implements OnInit {
  @Input() data: any[][];
  @Input() rowHeaders: string[];
  @Input() colHeaders: string[];
  @Input() enableHeaders: boolean = true;
  @Input() trackChange = false;
  @Input() maxHeight = '500px';
  @Input() isLite = false;
  @Input() isPrintPreview: boolean = false;
  @Output() cellClickEmitIndex = new EventEmitter<any>();
  constructor() {}
  ngOnInit(): void {}

  // Function added to track which cell was clicked when in plain mode and to focus that cell when handontable is rendered
  handleCellClick(rowIndex, colIndex) {
    if (this.isLite) this.cellClickEmitIndex.emit({ rowIndex, colIndex });
  }
}
