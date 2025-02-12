import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'parser-instructions',
  templateUrl: './parser-instructions.component.html',
  styleUrls: ['./parser-instructions.component.css']
})
export class ParserInstructionsComponent {
  @Input() tabsList: any;
  @Output() close: EventEmitter<any> = new EventEmitter();
  currentTab: number = 1;

  closeInstructions() {
    this.close.emit();
  }

  switchTab(tab) {
    this.currentTab = tab.id;
    tab.active = true;
  }
}
