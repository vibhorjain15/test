import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ManageEventService } from 'src/app2/services/manage-event.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  errorMessageMap,
  hierarchyConstants,
  keywordConstants,
} from '../../constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { DvValidators } from '../../validators/no-white-space.validator';
import { DatePickerComponent } from 'src/app2/shared/components/date-picker/date-picker.component';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
})
export class ManageEventModal implements OnInit, OnDestroy {
  @ViewChildren(DatePickerComponent) calendars: QueryList<DatePickerComponent>;

  global_hierarchy_option: any;
  eventDateFormat: string;
  edit_mode: boolean;
  minDate: Date;
  durations: { name: string; id: number }[];
  times: { name: string; id: number }[];
  hierarchyConstants = hierarchyConstants;
  keywordConstants = keywordConstants;
  entities: Array<any> = new Array<any>();
  types: any;
  eventForm: FormGroup;
  loading: boolean;
  entities_loading: boolean;
  @Input() entity_id: number;
  @Input() entity_type: string;
  @Input() event: any;
  @Input() response: any; //get updated data - used in meeting details page
  @Input() onSuccess?: any;
  errorMessageMap = errorMessageMap;

  @Select(UserState.getCurrentUserData) user;
  currentFirm: any = {};
  note_types = [{ id: 1116, value: 'General' }];
  note: any = {};
  isNoteEnabled: boolean = false;
  notesOptions: { fullscreen: boolean; undoRedo: boolean; height: number };
  dateFilter: { startDate: any; endDate: any; range: any };
  submitClicked: boolean;
  typesLoading: boolean;
  cancelRequest$ = new Subject<void>();
  constructor(
    private readonly Utils: UtilsService,
    private http: HttpClient,
    private readonly eventService: ManageEventService,
  ) {}

  ngOnInit(): void {
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
    this.global_hierarchy_option = this.hierarchyConstants.Strategy;
    this.eventDateFormat = 'YYYY-MM-DDTHH:mm:ss';
    this.edit_mode = false;
    this.minDate = moment('1970-01-01').toDate();
    this.durations = this.eventService.getDurationValues();
    this.times = this.eventService.getTimeValues();

    this.user.pipe(take(1))
      .subscribe((user: any) => {
        if (user && user?.firmInfo) {
          this.currentFirm = {
            id: user?.firmInfo.id,
            name: 'My Firm',
          };
        }
      });

    this.eventForm = new FormGroup({
      id: new FormControl(this.event && this.event.id ? this.event.id : 0),
      name: new FormControl(
        this.event && this.event.name ? this.event.name : null,
        DvValidators.required
      ),
      entity_id: new FormControl(null, Validators.required),
      event_start_at: new FormControl(
        this.event && this.event.event_start_at
          ? this.Utils.getLocalDateTime(this.event.event_start_at).toDate()
          : null,
        Validators.required
      ),
      start_time: new FormControl(
        this.event && this.event.event_start_at
          ? this.getStartAtTime(this.event.event_start_at)
          : this.getNearestHourDropdownId()
      ),
      duration: new FormControl(
        this.event && this.event.event_start_at && this.event.event_end_at
          ? moment
              .duration(
                moment(this.event.event_end_at).diff(
                  moment(this.event.event_start_at)
                )
              )
              .as('minutes')
          : 30
      ),
      event_type: new FormControl(null, Validators.required),
    });

    if (this.event) {
      this.edit_mode = true;
    }
    this.setEntityType(this.entity_type);
    this.getEventTypes();
  }

  getStartAtTime(event_start_at: any) {
    // Adjust `start_time` assignment to match hour and half-hour (minute) component
    const startTimeMoment = this.Utils.getLocalDateTime(event_start_at);
    const hour = startTimeMoment.hour();
    const minutes = startTimeMoment.minute();
    const dropdownId = hour * 2 + (minutes === 30 ? 1 : 0);
    return dropdownId;
  }

  getNearestHourDropdownId() {
    //it gets the current running hour. It could 12, 1, 2, 3 etc. if minutes > 30 ? upper hour : lower hour.
    const currentTime = moment();
    const hour =
      currentTime.minutes() >= 30 ? currentTime.hour() + 1 : currentTime.hour();
    const dropdownId = hour * 2; // to get hour id multipying by 2 because 30mins = +1 in ids.
    return dropdownId >= 48 ? 0 : dropdownId; // Reset to 0 for midnight rollover
  }

  handleSelectedData(data) {
    this.note = data;
  }
  handleNoteEnabledChange(data) {
    if (data) {
      this.eventForm.addControl(
        'type',
        new FormControl(null, Validators.required)
      );
      this.getNotesTypes();
    } else {
      this.eventForm.removeControl('type');
    }
  }
  getNotesTypes() {
    this.http.get(`touch_points`).subscribe((response: any) => {
      this.note_types = response;
    });
  }

  setEntityType(entity_type: string) {
    this.entities_loading = true;
    this.entity_type = entity_type;
    if (
      entity_type.toLowerCase() === this.keywordConstants.Firm.toLowerCase()
    ) {
      this.getFirms();
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Strategy.toLowerCase()
    ) {
      this.getAllStrategies();
    } else {
      this.getFunds();
    }
  }

  changeEntityType(entity_type: string) {
    this.entities = [];
    this.entity_id = null;
    this.eventForm.get('entity_id').patchValue('');
    this.eventForm.get('entity_id').markAsUntouched();
    this.setEntityType(entity_type);
  }

  setDateValue(date: Date) {
    this.eventForm.get('event_start_at').patchValue(date);
  }

  getFirms() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    this.cancelApiCall();
    this.http
      .post('service/dvapi_service/firm_search', params)
      .pipe(takeUntil(this.cancelRequest$))
      .subscribe((response: any) => {
        if (response) {
          response.data.unshift(this.currentFirm);
        }
        this.assignEntityValue(response);
      });
  }

  getFunds() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    this.cancelApiCall();
    this.http
      .post('service/dvapi_service/fund_search', params)
      .pipe(takeUntil(this.cancelRequest$))
      .subscribe((response: any) => {
        this.assignEntityValue(response);
      });
  }

  getAllStrategies() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    this.cancelApiCall();
    this.http
      .post('service/dvapi_service/product_search', params)
      .pipe(takeUntil(this.cancelRequest$))
      .subscribe((response: any) => {
        this.assignEntityValue(response);
      });
  }

  assignEntityValue(response) {
    this.entities = response.data;
    if (this.entity_id) {
      const entity = this.entities.find(
        (entity) => entity.id == this.entity_id
      );
      if (entity) this.eventForm.get('entity_id').patchValue(+this.entity_id);
    }
    this.entities_loading = false;
  }

  getEventTypes() {
    this.typesLoading = true;
    this.http
      .get('event_types')
      .pipe(finalize(() => (this.typesLoading = false)))
      .subscribe((response: any) => {
        if (this.event?.event_type_id) {
          this.eventForm
            .get('event_type')
            .patchValue(+this.event.event_type_id);
        }
        this.types = response;
      });
  }

  generatePageUrl() {
    let pageUrl = '';
    const entity_id = this.eventForm.get('entity_id').value;
    if (
      this.entity_type.toLowerCase() ===
      this.keywordConstants.Firm.toLowerCase()
    ) {
      pageUrl = `app/firms/${entity_id}/events`;
    } else if (
      this.entity_type.toLowerCase() ===
      this.keywordConstants.Product.toLowerCase()
    ) {
      const fundIndex = this.entities.findIndex(
        (fund) => fund.id === entity_id
      );
      const firmId = this.entities[fundIndex].firm_id;
      pageUrl = `app/firms/${firmId}/funds/${entity_id}/events`;
    }
    return pageUrl;
  }

  submit(modalCallback) {
    this.calendars.forEach((x) => x?.close());
    this.submitClicked = this.isNoteEnabled;
    if (!this.eventForm.valid) {
      this.eventForm.markAllAsTouched();
      return;
    } else {
      this.loading = true;
      const formObj = this.eventForm.value;
      formObj.entity_type = this.entity_type;
      formObj.event_start_at = moment(formObj.event_start_at).format(
        'YYYY-MM-DD'
      );
      const selectedTimeId = formObj.start_time; // The selected time slot's ID, e.g., 5 for "2:30 AM"
      const hour = Math.floor(selectedTimeId / 2); // Divide by 2 to get the hour (integer part)
      const minute = selectedTimeId % 2 === 1 ? 30 : 0; // Remainder 1 indicates a half-hour
      const startTime = moment(formObj.event_start_at)
        .hour(hour)
        .minute(minute);
      formObj.event_end_at = moment(formObj.event_start_at)
        .hour(hour)
        .minute(minute)
        .add(formObj.duration, 'minutes')
        .utc()
        .format(this.eventDateFormat);
      formObj.event_start_at = startTime.utc().format(this.eventDateFormat);
      if (this.isNoteEnabled && !this.note?.text) {
        this.loading = false;
        return;
      }
      if (this.isNoteEnabled && !this.eventForm.get('type').value) {
        this.loading = false;
        return;
      }
      if (
        this.isNoteEnabled &&
        this.note?.text &&
        this.eventForm.get('type').value
      ) {
        formObj.note = this.note;
        formObj.note['type'] = this.eventForm.get('type').value;
      }
      delete formObj.type;
      if (this.edit_mode) {
        this.eventService.updateEvent(
          formObj,
          (res) => {
            this.successCallback(modalCallback);
          },
          (error) => {
            this.loading = false;
          }
        );
      } else {
        this.eventService.addEvent(
          formObj,
          this.generatePageUrl(),
          () => {
            this.successCallback(modalCallback);
          },
          () => {
            this.loading = false;
          }
        );
      }
    }
  }

  successCallback(modalCallback) {
    this.loading = false;
    if (this.onSuccess) {
      this.onSuccess();
    }
    modalCallback();
  }

  cancelApiCall() {
    this.cancelRequest$.next();
  }

  ngOnDestroy() {
    this.cancelRequest$.next();
    this.cancelRequest$.complete();
  }
}
