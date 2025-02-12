import { Component, Input, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'dv-nudge',
  templateUrl: './dv-nudge.component.html',
  styleUrls: ['./dv-nudge.component.css'],
})
export class DvNudgeComponent implements OnInit {
  @Input() nudge: any;
  currentTime: number;
  leadText: string;
  constructor() {}

  ngOnInit(): void {
    this.currentTime = new Date().getHours();
    this.leadText = this.getLeadText();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.nudge?.currentValue) {
      this.nudge = changes.nudge.currentValue;
    }
  }

  getLeadText(): string {
    if (this.currentTime < 4) {
      return 'Sleep is a good thing. Get some rest!';
    } else if (this.currentTime < 7) {
      return 'You are getting an early start!';
    } else if (this.currentTime < 10) {
      return 'Good Morning!';
    } else if (this.currentTime < 12) {
      return 'Have an awesome day!';
    } else if (this.currentTime < 16) {
      return 'Good Afternoon!';
    } else if (this.currentTime < 18) {
      return 'Good Evening!';
    } else {
      return 'Hi there Vaulter!';
    }
  }
}
