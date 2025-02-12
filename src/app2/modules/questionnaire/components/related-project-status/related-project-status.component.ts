import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'related-project-status',
  templateUrl: './related-project-status.component.html',
  styleUrls: ['./related-project-status.component.css'],
})
export class RelatedProjectStatusComponent implements OnInit {
  @Input() project: any;

  constructor() {}

  ngOnInit(): void {}

  handleClick(project) {
    if (project.entity_type == 'Vehicle')
      window.open(
        `/#/app/diligence/${project.fromfirm_id}/firms/${project.tofirm_id}/funds/${project.parent_entity_id}/vehicles/${project.entity_id}/projects/${project.id}/questionnaire`
      );
    else if (project.entity_type == 'Fund')
      window.open(
        `/#/app/diligence/${project.fromfirm_id}/firms/${project.tofirm_id}/strategies/${project.parent_entity_id}/funds/${project.entity_id}/projects/${project.id}/questionnaire`
      );
  }
}
