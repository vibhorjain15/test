import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ManageEventService } from 'src/app2/services/manage-event.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-dv-meetings',
  templateUrl: './dv-meetings.component.html',
  styleUrls: ['./dv-meetings.component.css'],
})
export class DvMeetingsComponent implements OnInit, OnChanges {
  @Input() entityType;
  @Input() entityId;
  @Input() dateFilter;
  meetings = [];
  customDateFilter: any;

  constructor(
    private readonly ModalFactory: CustomModalService,
    private readonly Utils: UtilsService,
    private readonly routerService: Router,
    private readonly eventService: ManageEventService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.customDateFilter = this.dateFilter;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.dateFilter?.currentValue !== changes?.dateFilter?.previousValue
    ) {
      this.customDateFilter = changes?.dateFilter?.currentValue;
      this.getMeetings();
    }
  }

  getMeetings() {
    const params: any = {
      entity_type: this.entityType,
      entity_id: this.entityId,
    };
    if (this.customDateFilter) {
      params.start_date = this.customDateFilter.startDate;
      params.end_date = this.customDateFilter.endDate;
    }
    this.eventService.getAllEvents(params, () => {
      this.meetings = this.eventService.events;
    });
  }

  addMeeting() {
    this.ModalFactory.invoke('manage-event', {
      initialState: {
        entity_type: this.entityType,
        entity_id: this.entityId,
        onSuccess: () => {
          this.getMeetings();
        },
      },
      class: 'gray modal-lg',
    });
  }

  editMeeting(meeting) {
    this.ModalFactory.invoke('manage-event', {
      initialState: {
        entity_type: this.entityType,
        entity_id: this.entityId,
        event: meeting,
        onSuccess: () => {
          this.getMeetings();
        },
      },
      class: 'gray modal-lg',
    });
  }

  getMeetingsDate(meetingDate) {
    return this.Utils.getLocalDateTime(meetingDate).toDate();
  }

  navigateToMeetingsDetail(meetingId) {
    this.routerService.navigate([`../../meetings/${meetingId}/detail`], {
      relativeTo: this.activatedRoute,
    });
  }
}
