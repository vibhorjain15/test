import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dv-radio-group',
  templateUrl: './dv-radio-group.component.html',
  styleUrls: ['./dv-radio-group.component.css'],
})
export class DvRadioGroupComponent implements OnInit {
  @Input() type: 'vertical' | 'horizontal' | 'none' = 'vertical';
  constructor() {}

  ngOnInit(): void {}
}
