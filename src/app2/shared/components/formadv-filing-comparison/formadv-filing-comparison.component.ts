import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
@Component({
  selector: 'app-formadv-filing-comparison',
  templateUrl: './formadv-filing-comparison.component.html',
})
export class FormadvFilingComparisonComponent implements OnInit {
  @Input() firmCrd = null;
  @Input() question = null;
  @Input() dateRange = null;
  @Input() paginationEnabled = null;
  @Input() changesVisibleInline = null;
  @Input() thresholds = null;
  @Input() thresholdTypes = null;
  @Input() id = null;

  view_mode: string = 'table';
  rows: any = [];
  blackline_rows: any = [];
  filings_histories: any = [];
  threshold_question_rules: any = [];
  is_loading: boolean = true;
  current_page: number;
  total_pages: number;
  materialThresholds: any;
  changes_visible_inline: any;
  constructor(
    private readonly http: HttpClient,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    if (this.question) {
      this.loadFilingsHistory();
      if (this.thresholds && this.thresholds.length) {
        this.thresholds.map((threshold: { question_id: any }, key: any) => {
          if (threshold.question_id === this.question.id) {
            this.threshold_question_rules.push(threshold);
          }
        });
      }
    }
  }

  toggleViewMode() {
    if (this.view_mode === 'table') {
      this.view_mode = 'blackline';
    } else {
      this.view_mode = 'table';
    }
  }

  loadFilingsHistory() {
    if (
      this.current_page &&
      this.total_pages &&
      this.current_page === this.total_pages
    )
      return;
    const page_number = (this.current_page || 0) + 1;

    let params = `pageNumber=${page_number}&questionId=${this.question.id}&firmCrd=${this.firmCrd}&response_type=${this.question.response_type}`;
    if (this.dateRange) {
      params += `&start_at=${this.dateRange.start_at}&end_at=${this.dateRange.end_at}`;
    }
    this.is_loading = true;

    this.http
      .get(`formadv_filings/history?${params}`)
      .subscribe((response: any) => {
        this.current_page = response?.meta?.pageNumber || 0;
        this.total_pages = response?.meta?.totalPages || 0;

        this.populateFilingsHistories(response.results);
        this.computeRows(response.results);

        this.is_loading = false;
      });
  }

  computeMaterialChanges(rows: any) {
    this.question.has_material_changes = false;
    let i = 0;
    return (() => {
      const result = [];
      while (i < this.threshold_question_rules.length) {
        if (
          this.materialThresholds &&
          this.materialThresholds.isThresholdsValid(
            this.threshold_question_rules[i],
            rows,
            this.question.response_type
          )
        ) {
          this.question.has_material_changes = true;
          break;
        }
        result.push(i++);
      }
      return result;
    })();
  }

  populateFilingsHistories(histories: any) {
    if (this.filings_histories.length) {
      return;
    }
    histories.map((history: any) => this.filings_histories.push(history));
  }

  computeRows(histories) {
    let row = [];

    const blackline_rows = [];
    let parent = this;
    if (histories.length > 0) {
      histories[0].sequences.map(function (
        sequence: any,
        idx: string | number
      ) {
        row = [];

        histories.map(
          (
            filing_history: { sequences: { [x: string]: { response: any } } },
            idx_new: any
          ) =>
            row.push(
              filing_history.sequences[idx] != null
                ? filing_history.sequences[idx].response
                : undefined
            )
        );
        parent.rows.push(row);

        blackline_rows.push({
          current: row[0],
          previous: row[1],
        });
      });

      if (parent.thresholds) {
        parent.computeMaterialChanges(parent.rows);
      }
    }
  }

  navigateToUrl(params) {
    this.routerService.navigateWithParams(
      'app.form_adv.firm.question_history',
      params
    );
  }
}
