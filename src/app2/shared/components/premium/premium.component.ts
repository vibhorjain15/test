import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-premium',
  templateUrl: './premium.component.html',
})
export class PremiumComponent {
  loading = false;
  requestTypes = {
    standardddq: 'Standard DDQ Management Module',
    esg: 'ESG Data Collection Module',
    rfp: 'RFP Automation',
    content: 'Intelligent Content Management',
    db: 'Database Profile Management',
  };
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  demosignup(focus) {
    this.loading = true;
    const params = {
      FTypeID: 2004,
      FeedbackText: `I’d like to schedule a demo for ${focus}`,
    };
    this.http
      .post('feedback', params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(() => {
        const message = 'Thank you for your feedback!';
        this.toaster.success(message, '', { timeOut: 5000 });
      });
  }
}
