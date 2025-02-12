import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-failed-upload-details',
  templateUrl: './failed-upload-details.component.html',
  styleUrls: ['./failed-upload-details.component.css'],
})
export class FailedUploadDetailsComponent implements OnInit {
  @Input() transactionId: number;
  transaction_diligences: any[];
  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.loadTransactionDiligences();
  }

  loadTransactionDiligences() {
    this.http
      .get('ExcelsyncTransactionDiligences', {
        params: { transaction_id: this.transactionId },
      })
      .subscribe((response: any) => {
        this.transaction_diligences = response;
        this.transaction_diligences.map(
          (x) => (x.errors = JSON.parse(x.status_description))
        );
      });
  }

  navigateToQuestionnaire(transaction) {
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId: transaction.duediligence_id }
    );
  }
}
