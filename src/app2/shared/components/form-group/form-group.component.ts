import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-group',
  templateUrl: './form-group.component.html',
  styleUrls: ['./form-group.component.css'],
})
export class FormGroupComponent implements OnInit {
  @Input() modelController: FormControl = null;
  @Input() fieldName? = '';
  @Input() showRightIcon? = true;
  @Input() showWrongIcon? = false;
  @Input() label?;
  @Input() labelClass? = 'control-label';
  @Input() isRequired? = false;
  @Input() labelCol? = 3;
  @Input() elementCol? = 8;
  @Input() errorMessage? = '';
  @Input() elementClass? = '';
  @Input() tabClass = '';
  @Input() removeSpace? = false;

  constructor() {}

  ngOnInit(): void {}
}
