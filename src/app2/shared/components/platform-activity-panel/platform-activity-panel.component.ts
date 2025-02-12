import { Component, Input, OnInit } from '@angular/core';
import { NotificationDataService } from 'src/app2/services/notification-data.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-platform-activity-panel',
  templateUrl: './platform-activity-panel.component.html',
  styleUrls: ['./platform-activity-panel.component.css'],
})
export class PlatformActivityPanelComponent implements OnInit {
  @Input() preview: boolean;
  @Input() name;
  is_loading;
  notifications;
  loading: boolean;
  current_page: number;
  total_pages: any;
  total_items: any;

  constructor(
    private readonly NotificationDataservice: NotificationDataService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.current_page = 1;
    this.notifications = [];
    this.getNotifications();
  }

  markAllAsRead() {
    this.loading = true;
    this.NotificationDataservice.markAllAsRead().subscribe(() => {
      this.notifications = this.notifications.map((notification) => {
        notification.unread = false;
        return notification;
      });
      this.loading = false;
    });
  }

  markAsRead(notification) {
    if (notification.unread) {
      this.NotificationDataservice.markAsRead(notification.id).subscribe(() => {
        notification.unread = false;
      });
    }
  }

  getNotifications(event = null) {
    if (event) {
      this.current_page = event.page;
    }
    const params = { pageNumber: this.current_page };
    this.is_loading = true;
    this.NotificationDataservice.getNotifications(params).subscribe(
      (response: any) => {
        this.current_page = response.meta.pageNumber;
        this.total_pages = response.meta.totalPages;
        this.total_items = response.meta.totalRecords;
        this.notifications = response.results;
        this.is_loading = false;
      }
    );
  }

  closeMenu() {
    // TODO: Replace $
    // return $('.navbar-collapse').collapse('hide');
    this.routerService.navigate(`app.diligence.platform_activity`);
  }

  refreshNotifications() {
    this.notifications = [];
    this.current_page = null;
    this.getNotifications();
  }

  getRedirectUrl(notification) {
    let href;
    switch (notification.type) {
      case 'invitation':
        href = this.routerService.href('app.diligence.projects.activity', {
          type: 'in-progress',
        });
        break;
      case 'duediligence':
        href = this.routerService.href('app.diligence.project.questionnaire', {
          diligenceId: notification.targetID,
        });
        break;

      case 'followup':
        href = this.routerService.href('app.diligence.project.questionnaire', {
          diligenceId: notification.targetID,
          status: 'Followup',
        });
        break;

      case 'diligencefollowup':
        href = this.routerService.href('app.diligence.project.summary', {
          diligenceId: notification.targetID,
        });
        break;

      case 'workflow':
        href = this.routerService.href('app.workflow_automation.detail', {
          Id: notification.targetID,
        });
        break;

      case 'documentShared':
        href = this.routerService.href('app.content.document.detail', {
          documentId: notification.targetID,
        });
        break;

      case 'documentVersionChanged':
        href = this.routerService.href('app.content.document.detail', {
          documentId: notification.targetID,
        });
        break;
    }
    return href;
  }
}
