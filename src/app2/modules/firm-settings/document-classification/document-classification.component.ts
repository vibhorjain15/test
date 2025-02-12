import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';

@Component({
  selector: 'app-document-classification',
  templateUrl: './document-classification.component.html',
  styleUrls: ['./document-classification.component.css'],
})
export class DocumentClassificationComponent implements OnInit {
  document_groups;
  is_admin;
  displaySidebarPanel;
  sidebarTitle;
  isInvestor: boolean;
  document_types = [];
  saving_tags: boolean;
  group_id: any;
  used_tags: any;
  sidebarTemplate: string;
  document_tags: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly routerService: RouterService,
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.isAdmin;
        }
      });
    this.getDetailsAndFormat();
  }

  getDetailsAndFormat() {
    const promises = [];
    promises.push(this.http.get('tags', { params: { type: 'Attachments' } }));
    promises.push(this.http.get('document_type_groupings'));
    promises.push(this.BaseDataService.getAttachmentTypes());
    forkJoin(promises).subscribe((responses: any) => {
      this.document_groups = responses[0];
      this.document_groups.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      this.document_types = responses[2];
      const groupedTags = this.Utils.groupByArray(responses[1], 'group_id');
      Object.entries(groupedTags).forEach(([groupId, groups]: any) => {
        const documentGroup = this.document_groups.find(
          (group) => group.id === +groupId
        );
        groups.sort((a, b) => {
          const nameA = a.type_name.toLowerCase();
          const nameB = b.type_name.toLowerCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
        documentGroup.tags = groups;
      });
    });
  }

  saveAssignment() {
    this.saving_tags = true;
    const param = {
      entity_type: 'DocumentGroup',
      entity_id: this.group_id,
      tags: this.document_tags,
    };
    this.http
      .post('document_type_groupings', param)
      .pipe(
        finalize(() => {
          this.saving_tags = false;
        })
      )
      .subscribe(
        (response: any) => {
          this.used_tags = response;
          this.getDetailsAndFormat();
          this.displaySidebarPanel = false;
          this.toaster.success('Document Type updated successfully');
        },
        (error: any) => {
          this.toaster.error('Unable to update Document Type!');
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Updating Document Type Failed', error);
          }
        }
      );
  }

  getMatcher(collection: any) {
    return function ($query: any) {
      if (!$query) {
        return collection;
      }
      const regex = new RegExp($query, 'i');
      return collection.filter((item) => regex.test(item.label));
    };
  }

  displayAssignTagsController(group) {
    this.sidebarTemplate =
      'firm/settings/document_classifications/assign_tags/template.html';
    this.sidebarTitle = group.name;
    this.displaySidebarPanel = true;
    this.group_id = group.id;
    this.document_tags = group.tags ? group.tags.map((tag) => tag.type_id) : [];
    this.document_tags = this.document_tags.filter((tag) =>
      this.document_types.some((type) => type.id === tag)
    );
  }

  initiateDocGroupAddition() {
    this.routerService.navigate('app.firm.settings.document_group_tags');
  }

  getActionLabel(group): string {
    return `Add a type in ${group.name}`;
  }

  getMessage(group): string {
    return `No types available. Why not add for ${group.name}?`;
  }
}

