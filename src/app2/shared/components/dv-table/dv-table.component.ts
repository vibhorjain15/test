import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

type colType = {
  width: number;
  title: string;
};
type Node = {
  value: string;
  children?: Node[];
  span?: number;
};
type Row = {
  isSectionEnd: boolean;
  values: Node[];
};

export type TableNw = {
  nodes?: Node[];
};
@Component({
  selector: 'dv-table',
  templateUrl: './dv-table.component.html',
  styleUrls: ['./dv-table.component.css'],
})
export class DvTabelComponent implements OnInit {
  @Input() rows: TableNw | any = [];
  @Input() cols: colType[] = [];
  @Input() isAccordion = false;
  @Input() headersAlignment: 'center' | 'left' | 'right' = 'center';
  @Output() handleEdit: EventEmitter<any> = new EventEmitter();
  @Output() handleDelete: EventEmitter<any> = new EventEmitter();
  renderTable: Row[];
  constructor() {}
  isOpen = false;

  ngOnInit(): void {
    this.rows.forEach((row) => {
      row['accordion'] = true;
    });
  }

  dfs(node: Node, isParent: boolean = false) {
    node.span = 0;
    this.renderTable[this.renderTable.length - 1].values.push(node);
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        if (i > 0) {
          this.renderTable.push({
            isSectionEnd: isParent && i == node.children.length - 1,
            values: [],
          });
        }
        this.dfs(node.children[i]);
        node.span += node.children[i].span;
      }
    } else {
      node.span = 1;
    }
  }

  onEdit(list, index, mainIndex) {
    const info = {
      mainIndex: mainIndex,
      localIndex: index,
    };
    this.handleEdit.emit(info);
  }
  onDelete(list, index, mainIndex) {
    const info = {
      mainIndex: mainIndex,
      localIndex: index,
    };
    this.handleDelete.emit(info);
  }
}
