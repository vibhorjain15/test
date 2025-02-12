import {
  AfterViewInit,
  Component,
  ComponentRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { SidePanelService } from 'src/app2/services/side-panel.service';

@Component({
  selector: 'side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.css'],
})
export class SidePanelComponent implements AfterViewInit, OnChanges {
  @ViewChild('sidePanelContainer', { read: ViewContainerRef }) container;
  @Input() activePanelId = -1;
  componentRef: ComponentRef<any>;

  constructor(private SidePanelServirce: SidePanelService) {}

  ngAfterViewInit(): void {
    this.SidePanelServirce.setContainerRef(this.container);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.activePanelId &&
      changes.activePanelId.currentValue !== changes.activePanelId.previousValue
    ) {
      this.SidePanelServirce.setContainerRef(this.container);
    }
  }
}
