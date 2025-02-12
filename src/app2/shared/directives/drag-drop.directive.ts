import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[DvDragDrop]',
})
export class DragDropDirective {
  constructor() {}

  @HostBinding('attr.draggable') draggable = true;
  @Input('elemPosition') elemPosition: number = 0;
  @Input('list') list: any;
  @Input() id? = 1;
  @Output('returnUpdatedList') returnUpdatedList = new EventEmitter<any>();
  @Output('handleDragStart') handleDragStart? = new EventEmitter<any>();
  dragDropId;
  @HostListener('dragstart', ['$event'])
  onDragStart(e: any) {
    this.handleDragStart.emit();
    e.stopPropagation();
    e.dataTransfer.setData('text', this.elemPosition);
    e.dataTransfer.setData('list', JSON.stringify(this.list));
    e.dataTransfer.setData('id', this.id);
  }

  @HostListener('drop', ['$event'])
  onDrop(e: any) {
    e.preventDefault();
    let sourceElementIndex = e.dataTransfer.getData('text');
    let sourceList = e.dataTransfer.getData('list');
    let id = e.dataTransfer.getData('id');
    let destElementIndex = this.elemPosition;
    let clonedList = [...JSON.parse(sourceList)];
    if (id !== 'nestedQuestion' && id == this.id) {
      if (sourceElementIndex !== destElementIndex) {
        this.updateReorderList(
          clonedList,
          sourceElementIndex,
          destElementIndex
        );
      }
    }
    if (id === 'nestedQuestion') {
      if (
        clonedList[sourceElementIndex].parentID ===
        this.list[destElementIndex].parentID
      ) {
        this.updateReorderList(
          clonedList,
          sourceElementIndex,
          destElementIndex
        );
      }
    }
  }

  updateReorderList(
    list: Array<any>,
    sourceElementIndex: number,
    destElementIndex: number
  ) {
    list.splice(sourceElementIndex, 1);
    list.splice(destElementIndex, 0, this.list[sourceElementIndex]);
    this.returnUpdatedList.emit(list);
  }

  @HostListener('dragover', ['$event'])
  onDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }
}
