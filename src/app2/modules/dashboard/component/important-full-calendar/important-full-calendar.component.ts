import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGrigPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import * as moment from 'moment';
import tippy from 'tippy.js';
@Component({
  selector: 'app-important-full-calendar',
  templateUrl: './important-full-calendar.component.html',
  styleUrls: ['./important-full-calendar.component.css'],
})
export class ImportantFullCalendarComponent implements OnInit {
  @Input() isManger;
  calendarEvents: EventInput[] = [];
  entity_type: string;
  entity_id: any;
  firstDay = 1;
  isAllDataLoaded: boolean = false;
  options: any;
  constructor(
    private readonly http: HttpClient,
    private readonly customModalFactory: CustomModalService,
    private cd: ChangeDetectorRef,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.entity_type = keywordConstants.Firm;
    this.options = {
      header: {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      },
      plugins: [dayGridPlugin, timeGrigPlugin, interactionPlugin],
      defaultDate: moment().format('YYYY-MM-DD'),
      timezone: 'local',
      firstDay: 1,
      editable: true,
      eventLimit: true,
      timeFormat: 'ha',
      displayEventEnd: true,
      eventTimeFormat: {
        hour: 'numeric',
        minute: '2-digit',
        meridiem: 'short',
      },
    };
    this.getCalendarList();
  }
  getCalendarList() {
    this.http.get(`/dashboard/firmcalendar`).subscribe((response: any) => {
      this.calendarEvents = response.eventArray;
      this.calendarEvents.forEach((event) => {
        event.start = this.Utils.getLocalDateTimeGeneric(event?.start);
        event.end = this.Utils.getLocalDateTimeGeneric(event?.end);
        event.color='darkgreen'
      });
      this.cd.detectChanges();
      this.isAllDataLoaded = true;
    });
  }
  getFirmPref() {
    this.http.get(`firm_preferences`).subscribe((response: any) => {
      this.entity_id = response.firm_id;
    });
  }
  //Open Add New Event model
  addEvent() {
    this.customModalFactory.invoke('manage-event', {
      initialState: {
        entity_type: this.entity_type,
        entity_id: this.entity_id,
      },
      class: 'gray modal-lg',
      closeInterceptor: () => {
        return new Promise<void>((resolve) => {
          resolve();
          this.isAllDataLoaded = false;
          this.getCalendarList();
        });
      },
    });
  }

  showTooltip(eventInfo: any) {
    const eventElement: HTMLElement = eventInfo.el;
    const tooltipContent = eventInfo.event.title;
    tippy(eventElement, {
      content: tooltipContent,
      theme: 'light-border',
    });
  }
}
