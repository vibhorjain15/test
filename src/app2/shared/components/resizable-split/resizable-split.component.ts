import {
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
@Component({
  selector: 'dv-resizable-split',
  templateUrl: './resizable-split.component.html',
  styleUrls: ['./resizable-split.component.css'],
})
export class ResizableSplitComponent implements OnChanges, OnInit {
  @Input() overlay: boolean = false;
  @Input() rightOpen: boolean = false;
  @Input() leftOpen: boolean = true;
  @Input() minPanelWidth = 20;
  @Input() initialLeftPanelWidth = 23;
  @Input() initialCenterPanelWidth = 47;
  @Input() initialRightPanelWidth = 30;
  @Input() top: string = '42px';
  @ContentChild('[leftPanel]') leftPanel: ElementRef | undefined;
  @ContentChild('[centerPanel]') centerPanel: ElementRef | undefined;
  @ContentChild('[rightPanel]') rightPanel: ElementRef | undefined;
  gutterSize = 10;
  isResizing = false;
  resizingPanel: string;
  initialX: number;
  resizeStep = 1;

  leftPanelWidth = 33.33;
  centerPanelWidth = 33.33;
  rightPanelWidth = 33.33;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    this.handleWidth();
  }
  ngOnInit(): void {
    this.handleWidth();
  }
  catToggle() {
    this.leftOpen = !this.leftOpen;
    this.handleWidth();
  }
  overlayToggle() {
    this.overlay = !this.overlay;
    this.handleWidth();
  }
  handleWidth() {
    this.leftPanelWidth = this.initialLeftPanelWidth;
    this.centerPanelWidth = this.initialCenterPanelWidth;
    this.rightPanelWidth = this.initialRightPanelWidth;
    if (!this.leftOpen || this.overlay) {
      this.centerPanelWidth += this.leftPanelWidth - 1;
      this.leftPanelWidth = 1;
    }
    if (!this.rightOpen || this.overlay) {
      this.centerPanelWidth += this.rightPanelWidth;
      this.rightPanelWidth = 0;
    }
  }
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isResizing) {
      const deltaX = event.clientX - this.initialX;
      const stepFactor = deltaX > 0 ? 1 : -1;

      if (this.resizingPanel === 'left') {
        // Ensure the left panel doesn't go below the minimum width
        this.leftPanelWidth = Math.max(
          this.leftPanelWidth + stepFactor * this.resizeStep,
          this.minPanelWidth
        );

        // Ensure the left panel doesn't exceed the maximum width
        this.leftPanelWidth = Math.min(
          this.leftPanelWidth,
          100 - this.rightPanelWidth - this.minPanelWidth
        );
      } else if (this.resizingPanel === 'right') {
        // Ensure the right panel doesn't go below the minimum width
        this.rightPanelWidth = Math.max(
          this.rightPanelWidth - stepFactor * this.resizeStep,
          this.minPanelWidth
        );

        // Ensure the right panel doesn't exceed the maximum width
        this.rightPanelWidth = Math.min(
          this.rightPanelWidth,
          100 - this.leftPanelWidth - this.minPanelWidth
        );
      }

      // Calculate the minimum allowable width for the center panel
      const minCenterPanelWidth =
        100 - this.leftPanelWidth - this.rightPanelWidth;

      // Update the center panel width, ensuring it doesn't go below the minimum
      this.centerPanelWidth = Math.max(minCenterPanelWidth, this.minPanelWidth);

      // Update the initialX for the next move
      this.initialX = event.clientX;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
  }

  onGutterMouseDown(event: MouseEvent, panel: string): void {
    if (
      (panel == 'left' && this.leftOpen) ||
      panel == 'right' ||
      this.rightOpen
    ) {
      this.isResizing = true;
      this.resizingPanel = panel;
      this.initialX = event.clientX;
    }
  }
}
