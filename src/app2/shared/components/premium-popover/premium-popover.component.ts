import { Component, Input } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'premium-popover',
  templateUrl: './premium-popover.component.html',
  styleUrls: ['./premium-popover.component.css'],
})
export class PremiumPopoverComponent {
  @Input() title: string = 'Unlock this feature';
  @Input() subtitle: string = `Don't miss out on valuable connections!`;
  constructor(private readonly router: RouterService) {}
  goToPremium() {
    this.router.navigate('app.premium');
  }
}
