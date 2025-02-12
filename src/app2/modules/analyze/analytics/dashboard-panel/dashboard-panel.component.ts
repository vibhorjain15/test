import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { LayoutUtilsService } from 'src/app2/services/layout-utils.service';

@Component({
  selector: 'app-dashboard-panel',
  templateUrl: './dashboard-panel.component.html',
  styleUrls: ['./dashboard-panel.component.css'],
})
export class DashboardPanelComponent implements OnInit {
  @Input() config;
  widgetTitle;
  fullscreen_mode;
  @ViewChild('container') container;

  constructor(private readonly LayoutUtils: LayoutUtilsService) {}

  ngOnInit(): void {
    this.widgetTitle = this.config.title;
  }

  enterFullscreenMode() {
    this.LayoutUtils.enterFullscreenMode(this.container.nativeElement);
    window.dispatchEvent(new Event('resize'));
    this.fullscreen_mode = true;
  }
  exitFullscreenMode() {
    this.LayoutUtils.exitFullscreenMode(this.container.nativeElement);
    window.dispatchEvent(new Event('resize'));
    this.fullscreen_mode = false;
  }
}
