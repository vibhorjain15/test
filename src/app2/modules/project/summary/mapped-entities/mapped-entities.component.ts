import { Component, Input, OnInit } from '@angular/core';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { MappedEntity } from 'src/app2/shared/models/mappedEntity.model';
import { MappedEntityViewModel } from '../../viewmodels/mappedEntity';
@Component({
  selector: 'mapped-entities',
  templateUrl: './mapped-entities.component.html',
  styleUrls: ['./mapped-entities.component.css'],
})
export class MappedEntitiesComponent implements OnInit {
  mappedEntities: MappedEntityViewModel[];

  @Input() diligenceId: number;

  constructor(private readonly projectSummaryService: ProjectSummaryService) {}

  ngOnInit(): void {
    this.projectSummaryService
      .getReviewProjects(this.diligenceId)
      .subscribe((data: MappedEntity[]) => {
        let mappedEntities = data.map((item) => {
          let mappedEntity: MappedEntityViewModel = {
            ...item,
            displayEntityType: null,
            badgeClass: null,
            entityUrl: null,
            projectUrl: null,
            tooltip: '',
          };
          switch (mappedEntity.entity_type) {
            case keywordConstants.Firm:
              mappedEntity.displayEntityType = 'Firm';
              mappedEntity.badgeClass = 'badge-warning';
              mappedEntity.entityUrl = `#/app/firms/${mappedEntity.entity_id}/profile/monitor`;
              break;
            case keywordConstants.Product:
              mappedEntity.displayEntityType = 'Product';
              mappedEntity.badgeClass = 'badge-success';
              mappedEntity.entityUrl = `#/app/funds/${mappedEntity.entity_id}/profile/monitor`;
              break;
            case keywordConstants.Strategy:
              mappedEntity.displayEntityType = 'Strategy';
              mappedEntity.badgeClass = 'badge-info';
              mappedEntity.entityUrl = `#/app/strategies/${mappedEntity.entity_id}/profile/monitor`;
              break;
            case keywordConstants.Vehicle:
              mappedEntity.displayEntityType = 'Vehicle';
              mappedEntity.badgeClass = 'badge-primary';
              mappedEntity.entityUrl = `#/app/vehicles/${mappedEntity.entity_id}/profile/monitor`;
              break;
            case keywordConstants.Review:
              mappedEntity.displayEntityType = 'Review';
              mappedEntity.badgeClass = 'badge-default';
              if (mappedEntity.entity_id == -1) {
                mappedEntity.entity_name = mappedEntity.tofirm_name;
              }
              break;
          }

          if (
            mappedEntity.status != 'Invited' &&
            mappedEntity.status != 'Deleted'
          ) {
            mappedEntity.projectUrl = `#/app/diligence/projects/${mappedEntity.id}/summary`;
          }

          switch (mappedEntity.status) {
            case 'Invited':
              mappedEntity.tooltip =
                'Projects in invited status cannot be viewed';
              break;
            case 'Deleted':
              mappedEntity.tooltip = 'Deleted projects cannot be viewed';
              break;
          }

          return mappedEntity;
        });
        this.mappedEntities = mappedEntities;
      });
  }
}

