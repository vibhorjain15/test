import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';
import { IssueType } from '../../constants/constant';

@Component({
  selector: 'app-associated-name',
  templateUrl: './associated-name.component.html',
  styleUrls: ['./associated-name.component.css'],
})
export class AssociatedNameComponent {
  params;
  link: any;
  linkFlag: any;
  constructor(private readonly routerService: RouterService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (!params?.node.group) {
      this.params.url = this.navigateUrl(params.data);
      const value = this.params.data?.entity_type.toLowerCase();
      this.linkFlag =
        (value == IssueType.Product.toLowerCase() &&
          this.params.data.grid_entity_type?.toLowerCase() ==
            IssueType.Product.toLowerCase()) ||
        (value == IssueType.Project.toLowerCase() &&
          this.params.data.grid_entity_type?.toLowerCase() ==
            IssueType.Project.toLowerCase()) ||
        (value == IssueType.Vehicle.toLowerCase() &&
          this.params.data.grid_entity_type?.toLowerCase() ==
            IssueType.Vehicle.toLowerCase()) ||
        (value == IssueType.Firm.toLowerCase() &&
          this.params.data.grid_entity_type?.toLowerCase() ==
            IssueType.Firm.toLowerCase()) ||
        (value == IssueType.Strategy.toLowerCase() &&
          this.params.data.grid_entity_type?.toLowerCase() ==
            IssueType.Strategy.toLowerCase());
    }
  }

  navigateUrl(data) {
    const entity_type = data.entity_type.toLowerCase();
    if (entity_type == IssueType.Vehicle.toLowerCase()) {
      const params = {
        vehicleId: data.entity_id,
        recommendationId: data.id,
      };
      return this.routerService.href(
        `app.vehicles.profile.recommendations`,
        params
      );
    } else if (entity_type == IssueType.Product.toLowerCase()) {
      const params = {
        fundId: data.entity_id,
        recommendationId: data.id,
      };
      return this.routerService.href(
        `app.funds.profile.recommendations`,
        params
      );
    } else if (entity_type == IssueType.Firm.toLowerCase()) {
      const params = {
        firmId: data.entity_id,
        recommendationId: data.id,
      };
      return this.routerService.href(
        `app.firms.profile.recommendations`,
        params
      );
    } else if (entity_type == IssueType.Strategy.toLowerCase()) {
      const params = {
        strategyId: data.entity_id,
        recommendationId: data.id,
      };
      return this.routerService.href(
        `app.strategies.profile.recommendations`,
        params
      );
    } else if (entity_type == IssueType.Project.toLowerCase()) {
      const params = {
        diligenceId: data.entity_id,
        recommendationId: data.id,
      };
      return this.routerService.href(
        `app.diligence.project.recommendations`,
        params
      );
    } else if (entity_type == IssueType.Question.toLowerCase()) {
      const params = {
        diligenceId: data.diligence_id,
        categoryId: data?.category_id,
        questionId: data?.entity_id,
        '#': `child_section_${data?.subcategory_id}`,
        panel: 'recommendation',
      };
      return `/#/app/diligence/projects/${params.diligenceId}/questionnaire/category/${params.categoryId}/question/${params.questionId}?panel=${params.panel}#${params['#']}`;
    }
  }
}
