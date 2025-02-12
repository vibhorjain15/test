import { MappedEntity } from 'src/app2/shared/models/mappedEntity.model';

export class MappedEntityViewModel extends MappedEntity {
  displayEntityType: string;
  badgeClass: string;
  entityUrl: string;
  projectUrl: string;
  tooltip: string;
}
