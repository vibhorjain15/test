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
  @Output('returnUpdatedList') returnUpdatedList = new EventEmitter<any>();


  @HostListener('dragstart', ['$event'])
  onDragStart(e: any) {
    e.stopPropagation();
    e.dataTransfer.setData('text', this.elemPosition);
  }

  @HostListener('drop', ['$event'])
  onDrop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    let sourceElementIndex = e.dataTransfer.getData('text');
    let destElementIndex = this.elemPosition;
    let clonedList = [...this.list];
    if (sourceElementIndex !== destElementIndex) {
      clonedList.splice(sourceElementIndex, 1);
      clonedList.splice(destElementIndex, 0, this.list[sourceElementIndex]);
      this.returnUpdatedList.emit(clonedList);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }
}
