import {
  Component,
  Input,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'dv-drag-panel-list',
  templateUrl: './dv-drag-panel-list.component.html',
  styleUrls: ['./dv-drag-panel-list.component.css'],
})
export class DvDragpanelListComponent {
  mouseDownOnHandle: boolean = false;
  leftSideLength = 0; // Initial width of the question-container
  @ViewChild('mainPanel') mainPanel: ElementRef;
  @ViewChild('rightPanel') rightPanel: ElementRef;
  @ViewChild('leftPanel') leftPanel: ElementRef;
  @Input() minSidePanelWidth: number = 250;
  isDragging = false;
  private xOffset = 0; // how much space is there on the left side of the panel that is not to be added

  @Input() isSidePanelOpened: boolean = true;

  changeResizeMode(event, value: boolean): void {
    let initialX = event.clientX; // starting position of drag
    this.xOffset = this.leftPanel.nativeElement.offsetWidth - initialX;
    this.leftSideLength = this.leftPanel.nativeElement.offsetWidth;
    this.isDragging = true;
  }
  @HostListener('document:mouseup', [])
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      let mainPanelWidth = this.mainPanel.nativeElement.offsetWidth;
      let currentX = event.clientX; //the end position of drag
      // to avoid side panel to go out of the window //most of the cases xoffset is -ve
      if (
        currentX + this.xOffset + this.minSidePanelWidth + 12 <=
        mainPanelWidth
      ) {
        this.leftSideLength = currentX + this.xOffset;
      }
    }
  }
}
