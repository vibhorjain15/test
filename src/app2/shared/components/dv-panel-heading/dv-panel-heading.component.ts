import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dv-panel-heading',
  templateUrl: './dv-panel-heading.component.html',
  styleUrls: ['./dv-panel-heading.component.css'],
})
export class DvPanelHeadingComponent {
  @Input() heading: string = '';
  @Input() controls: PanelControl[] = [];
}

export type PanelControl = {
  isDisabled?: boolean;
  tooltip?: string;
  class?: string;
  handleClick: Function;
  text: string;
  leftIcon?: string;
  condition?: boolean;
  iconName?: string;
  iconClass?: string;
  type?: string;
};
