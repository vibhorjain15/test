import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-question-history',
  templateUrl: './question-history.component.html',
})
export class QuestionHistoryComponent implements OnInit {
  firmCrd = 1;
  $stateParams: any;
  dateRange: { start_at: any; end_at: any };
  question: any;

  constructor(
    private http: HttpClient,
    private readonly routerService: RouterService,
    private routerState: ActivatedRoute
  ) {}

  loadQuestion() {
    this.http
      .get(`Formadv_Questions/${ this.$stateParams.questionId}`)
      .subscribe((response) => {
        this.question = response;
      });
  }

  ngOnInit(): void {
    this.$stateParams = this.routerService.getState(this.routerState).params;
    this.firmCrd = this.$stateParams.firmCRD;
    this.dateRange = {
      start_at: this.$stateParams.start_at,
      end_at: this.$stateParams.end_at,
    };
    this.loadQuestion();
  }
}


