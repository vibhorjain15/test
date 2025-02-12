import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'initial-bubbles',
  templateUrl: './initial-bubbles.component.html',
  styleUrls: ['./initial-bubbles.component.css'],
})
export class InitialBubblesComponent implements OnInit {
  @Input() initials;

  /*
   * This component calculates color based on initials provided
   * The color generated will be same for a pair of initial always which will be consistent throughout
   * Incase if only 1 letter is provided, it will add a fixed number 120 to get a better color
   * */
  constructor() {}

  ngOnInit(): void {}

  getColor(initials: string): string {
    let asciiSum = 0;
    for (let i = 0; i < initials?.length; i++) {
      asciiSum += initials.charCodeAt(i);
    }
    if (initials.length == 1) asciiSum += 120;
    const hue = asciiSum % 360;
    return `hsl(${hue}, 50%, 50%)`;
  }
}
