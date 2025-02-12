import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dv-divider-with-label',
  templateUrl: './dv-divider-with-label.component.html',
  styleUrls: ['./dv-divider-with-label.component.css'],
})
export class DvDividerWithLabelComponent implements OnInit {
  @Input() type: 'vertical' | 'horizontal' = 'horizontal';
  @Input() horizontalMargin: 'tiny' | 'mini' | 'small' | 'medium' | 'large' =
    'tiny';
  @Input() verticalHeight: 'mini' | 'small' | 'medium' | 'large' = 'large';
  @Input() textAlign: 'left' | 'center' | 'right' = 'left';
  @Input() label: any = 'Divider-Label';
  @Input() textOverflowBreakLine: boolean = false;
  height = 2;
  margin = 5;
  ngOnInit(): void {
    if (this.verticalHeight === 'mini') this.height = 1;
    if (this.verticalHeight === 'small') this.height = 2;
    if (this.verticalHeight === 'medium') this.height = 3;
    if (this.verticalHeight === 'large') this.height = 4;

    switch (this.horizontalMargin) {
      case 'mini':
        this.margin = 15;
        return;
      case 'small':
        this.margin = 20;
        return;
      case 'medium':
        this.margin = 30;
        return;
      case 'large':
        this.margin = 45;
        return;
    }
  }
}
