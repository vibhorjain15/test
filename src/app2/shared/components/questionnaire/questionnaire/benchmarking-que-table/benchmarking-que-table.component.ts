import { Component, Input, OnInit } from '@angular/core';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';

@Component({
  selector: 'app-benchmarking-que-table',
  templateUrl: './benchmarking-que-table.component.html',
  styleUrls: ['./benchmarking-que-table.component.css'],
})
export class BenchmarkingQueTableComponent implements OnInit {
  @Input() templateId;
  @Input() questionId;
  @Input() tagId;
  @Input() startDate;
  @Input() endDate;
  aggregations: any;
  constructor(private readonly TemplateDataService: TemplateDataService) {}

  ngOnInit(): void {
    const params = {
      template_id: this.templateId,
      question_id: this.questionId,
      tag_id: this.tagId,
      start_date: this.startDate ?? null,
      end_date: this.endDate ?? null,
    };
    this.TemplateDataService.getaggregations({
      params,
    }).subscribe((res) => {
      this.aggregations = res;
    });
  }
}
