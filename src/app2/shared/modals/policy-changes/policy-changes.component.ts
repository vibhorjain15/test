import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'app-policy-changes',
  templateUrl: './policy-changes.component.html',
  styleUrls: ['./policy-changes.component.css'],
})
export class PolicyChangesComponent implements OnInit, AfterViewInit {
  @Input() title: string = 'Policy';
  @Input() type: 'acceptable' | 'readonly' = 'acceptable';
  @Input() acknowledge: boolean = false;
  @Input() policyDoc: string = 'This is sample policy doc';
  @Input() handleAccept: () => void;
  colorTheme = ColorTheme;
  canAccept = false; // Controls the disabled state of the accept button
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkScrollable();
    });
  }

  // Check if the content is scrollable
  checkScrollable(): void {
    const policyContent = document.getElementById('policyContent');
    if (policyContent) {
      if (policyContent.scrollHeight <= policyContent.clientHeight) {
        this.canAccept = true; // Enable the button immediately if not scrollable
      }
    }
  }

  // Handle the scroll event
  onScroll(event: any): void {
    const policyContent = event.target;
    if (
      Math.abs(
        policyContent.scrollHeight -
          policyContent.clientHeight -
          policyContent.scrollTop
      ) <= 1
    ) {
      this.canAccept = true;
      this.cdr.detectChanges();
    }
  }
  handleApprove(close) {
    this.handleAccept();
    close();
  }
}
