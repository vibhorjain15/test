import { Component, OnInit, ViewChild } from '@angular/core';
import { Select } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take } from 'rxjs/operators';
import { ManageEventService } from 'src/app2/services/manage-event.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import { DvDocumentsComponent } from '../../dv-documents/dv-documents.component';
import { Location } from '@angular/common';

@Component({
  selector: 'meetings-detail',
  templateUrl: './meetings-detail.component.html',
  styleUrls: ['./meetings-detail.component.css'],
})
export class MeetingsDetailComponent implements OnInit {
  meetingId: number;
  entityType: string;
  meeting: any;
  localTime: Date;
  eventStartTime: string;
  eventEndTime: string;
  notesOptions: any;
  @Select(UserState.getCurrentUserData) user;
  currentUser: any;
  dateFilter: { startDate: any; endDate: any; range: any };
  @ViewChild('documentWidget') documentWidget: DvDocumentsComponent;

  constructor(
    private readonly routerService: RouterService,
    private readonly eventService: ManageEventService,
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly sweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private _location: Location
  ) {}

  ngOnInit(): void {
    this.meetingId = +this.routerService.getState().params.Id;
    this.entityType = 'Meeting';
    this.notesOptions = {
      fullscreen: true,
      undoRedo: true,
      height: 180,
    };
    this.dateFilter = {
      startDate: null,
      endDate: null,
      range: null,
    };
    this.getCurrentUser();
    this.getMeetingDetail();
  }

  getCurrentUser() {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
        }
      });
  }

  getMeetingDetail() {
    this.eventService
      .getEventById(this.meetingId)
      .subscribe((response: any) => {
        this.meeting = response;
        this.convertTimeToLocal();
      });
  }

  convertTimeToLocal() {
    // same logic as angularJS
    this.localTime = this.Utils.getLocalDateTime(
      this.meeting.event_start_at
    ).toDate();
    this.eventStartTime = this.Utils.getLocalDateTime(
      this.meeting.event_start_at
    ).format('LT');
    this.eventEndTime = this.Utils.getLocalDateTime(
      this.meeting.event_end_at
    ).format('LT');
  }

  addDocument() {
    this.documentWidget.addDocument();
  }
  useExistingDocument() {
    this.documentWidget.useExistingDocument();
  }
  goBack() {
    this._location.back();
  }

  editMeeting() {
    this.ModalFactory.invoke('manage-event', {
      initialState: {
        event: this.meeting,
        entity_type: this.meeting.entity_type,
        entity_id: this.meeting.entity_id,
        response: (response: any) => {
          this.meeting = { ...response, entity_name: this.meeting.entity_name };
          this.convertTimeToLocal();
        },
      },
      class: 'gray modal-lg',
    });
  }

  deleteMeeting() {
    this.sweetAlert.confirm({
      title: 'Are you sure you want to delete this meeting?',
      confirmButtonText: 'Yes, please.',
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.eventService
            .deleteEvent(this.meetingId)
            .pipe(finalize(() => resolve()))
            .subscribe(() => {
              this.toaster.success('Meeting deleted successfully');
              this.routerService.navigateWithParams('app.dash', {
                dashType: 'Monitor',
              });
            });
        });
      },
    });
  }
}
