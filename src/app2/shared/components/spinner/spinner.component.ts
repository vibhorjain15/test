import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css'],
})
export class SpinnerComponent implements OnInit {
  @Input() size?: string;
  @Input() spinnerText?: string;
  @Input() includePanel?: boolean;
  @Input() broadSpinner?: boolean;
  @Input() spinnerHeight?: number;

  constructor() {}

  ngOnInit(): void {}
}
