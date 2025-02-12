import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'dv-divider',
  templateUrl: './dv-divider.component.html',
  styleUrls: ['./dv-divider.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvDividerComponent implements OnInit {
  @Input() type: 'vertical' | 'horizontal' = 'horizontal';
  @Input() horizontalMargin:
    | 'none'
    | 'micro'
    | 'tiny'
    | 'mini'
    | 'small'
    | 'medium'
    | 'large' = 'micro';
  @Input() verticalHeight: 'mini' | 'small' | 'medium' | 'large' = 'large';
  height = 45;
  margin = 5;
  ngOnInit(): void {
    if (this.verticalHeight === 'mini') this.height = 15;
    if (this.verticalHeight === 'small') this.height = 20;
    if (this.verticalHeight === 'medium') this.height = 30;
    if (this.verticalHeight === 'large') this.height = 45;

    switch (this.horizontalMargin) {
      case 'mini':
        this.margin = 15;
        return;
      case 'tiny':
        this.margin = 10;
        return;
      case 'none':
        this.margin = 0;
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
