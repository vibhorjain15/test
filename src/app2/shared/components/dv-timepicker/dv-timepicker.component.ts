import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dv-timepicker',
  templateUrl: './dv-timepicker.component.html',
  styleUrls: ['./dv-timepicker.component.css'],
})
export class DvTimepickerComponent implements OnInit {
  @Input() selectedTime: Date;
  constructor() {}

  ngOnInit(): void {}
}
