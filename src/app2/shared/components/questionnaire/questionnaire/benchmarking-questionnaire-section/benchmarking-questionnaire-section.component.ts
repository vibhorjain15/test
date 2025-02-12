import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'benchmarking-questionnaire-section',
  templateUrl: './benchmarking-questionnaire-section.component.html',
  //   styleUrls: ['./platforme-activity-panl.component.css'],
})
export class BenchmarkingQuestionnaireSectionComponent implements OnInit {
  @Input() questionresponse;
  @Input() templateId;
  @Input() responseType;
  @Input() tagId;
  @Input() startDate;
  @Input() endDate;
  constructor() {}
  ngOnInit(): void {}
}
