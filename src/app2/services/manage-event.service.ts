import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManageEventService {
  constructor(
    private readonly http: HttpClient,
    private toaster: ToastrService
  ) {}

  private eventsList: Array<any> = new Array<any>();

  get events() {
    return this.eventsList;
  }

  getAllEvents(params, success) {
    this.http
      .get('entity_events', { params: params })
      .subscribe((response: any) => {
        this.eventsList = response;
        success();
      });
  }

  addEvent(payload, pageUrl, successCallback,errorCallback) {
    const headers = new HttpHeaders();
    if (pageUrl) {
      headers.set('page-url', pageUrl);
    }
    this.http.post(`entity_events`, payload, { headers: headers }).subscribe(
      (response: any) => {
        this.toaster.success('Event successfully added');
        successCallback();
      }, (error) => {
        errorCallback(error);
      });
  }

  updateEvent(payload, successCallback, errorCallback) {
    this.http.put(`entity_events/${payload.id}`, payload).subscribe(
      (response: any) => {
        this.toaster.success('Event successfully updated');
        successCallback(response);
      },
      (error) => {
          errorCallback(error);
      }
    );
  }

  getDurationValues() {
    return [
      {
        name: '15 Mins',
        id: 15,
      },
      {
        name: '30 Mins',
        id: 30,
      },
      {
        name: '1 Hr',
        id: 60,
      },
      {
        name: '1 Hr 15 Mins',
        id: 75,
      },
      {
        name: '1 Hr 30 Mins',
        id: 90,
      },
      {
        name: '1 Hr 45 Mins',
        id: 105,
      },
      {
        name: '2 Hrs',
        id: 120,
      },
      {
        name: '2 Hr 15 Mins',
        id: 135,
      },
      {
        name: '2 Hr 30 Mins',
        id: 150,
      },
      {
        name: '2 Hr 45 Mins',
        id: 165,
      },
      {
        name: '3 Hrs',
        id: 180,
      },
      {
        name: '3 Hr 15 Mins',
        id: 195,
      },
      {
        name: '3 Hr 30 Mins',
        id: 210,
      },
      {
        name: '3 Hr 45 Mins',
        id: 225,
      },
      {
        name: '4 Hrs',
        id: 240,
      },
      {
        name: '4 Hr 15 Mins',
        id: 255,
      },
      {
        name: '4 Hr 30 Mins',
        id: 270,
      },
      {
        name: '4 Hr 45 Mins',
        id: 285,
      },
      {
        name: '5 Hrs',
        id: 300,
      },
      {
        name: '5 Hr 15 Mins',
        id: 315,
      },
      {
        name: '5 Hr 30 Mins',
        id: 330,
      },
      {
        name: '5 Hr 45 Mins',
        id: 345,
      },
      {
        name: '6 Hrs',
        id: 360,
      },
      {
        name: '6 Hr 15 Mins',
        id: 375,
      },
      {
        name: '6 Hr 30 Mins',
        id: 390,
      },
      {
        name: '6 Hr 45 Mins',
        id: 405,
      },
      {
        name: '7 Hrs',
        id: 420,
      },
      {
        name: '7 Hr 15 Mins',
        id: 435,
      },
      {
        name: '7 Hr 30 Mins',
        id: 450,
      },
      {
        name: '7 Hr 45 Mins',
        id: 465,
      },
      {
        name: '8 Hr',
        id: 480,
      },
    ];
  }

  getTimeValues() {
    return [
      {
        name: '12:00 AM',
        id: 0,
      },
      {
        name: '12:30 AM',
        id: 1,
      },
      {
        name: '1:00 AM',
        id: 2,
      },
      {
        name: '1:30 AM',
        id: 3,
      },
      {
        name: '2:00 AM',
        id: 4,
      },
      {
        name: '2:30 AM',
        id: 5,
      },
      {
        name: '3:00 AM',
        id: 6,
      },
      {
        name: '3:30 AM',
        id: 7,
      },
      {
        name: '4:00 AM',
        id: 8,
      },
      {
        name: '4:30 AM',
        id: 9,
      },
      {
        name: '5:00 AM',
        id: 10,
      },
      {
        name: '5:30 AM',
        id: 11,
      },
      {
        name: '6:00 AM',
        id: 12,
      },
      {
        name: '6:30 AM',
        id: 13,
      },
      {
        name: '7:00 AM',
        id: 14,
      },
      {
        name: '7:30 AM',
        id: 15,
      },
      {
        name: '8:00 AM',
        id: 16,
      },
      {
        name: '8:30 AM',
        id: 17,
      },
      {
        name: '9:00 AM',
        id: 18,
      },
      {
        name: '9:30 AM',
        id: 19,
      },
      {
        name: '10:00 AM',
        id: 20,
      },
      {
        name: '10:30 AM',
        id: 21,
      },
      {
        name: '11:00 AM',
        id: 22,
      },
      {
        name: '11:30 AM',
        id: 23,
      },
      {
        name: '12:00 PM',
        id: 24,
      },
      {
        name: '12:30 PM',
        id: 25,
      },
      {
        name: '1:00 PM',
        id: 26,
      },
      {
        name: '1:30 PM',
        id: 27,
      },
      {
        name: '2:00 PM',
        id: 28,
      },
      {
        name: '2:30 PM',
        id: 29,
      },
      {
        name: '3:00 PM',
        id: 30,
      },
      {
        name: '3:30 PM',
        id: 31,
      },
      {
        name: '4:00 PM',
        id: 32,
      },
      {
        name: '4:30 PM',
        id: 33,
      },
      {
        name: '5:00 PM',
        id: 34,
      },
      {
        name: '5:30 PM',
        id: 35,
      },
      {
        name: '6:00 PM',
        id: 36,
      },
      {
        name: '6:30 PM',
        id: 37,
      },
      {
        name: '7:00 PM',
        id: 38,
      },
      {
        name: '7:30 PM',
        id: 39,
      },
      {
        name: '8:00 PM',
        id: 40,
      },
      {
        name: '8:30 PM',
        id: 41,
      },
      {
        name: '9:00 PM',
        id: 42,
      },
      {
        name: '9:30 PM',
        id: 43,
      },
      {
        name: '10:00 PM',
        id: 44,
      },
      {
        name: '10:30 PM',
        id: 45,
      },
      {
        name: '11:00 PM',
        id: 46,
      },
      {
        name: '11:30 PM',
        id: 47,
      },
    ];
  }

  getEventById(id) {
    return this.http.get(`entity_events/${id}`);
  }

  deleteEvent(id) {
    return this.http.delete(`entity_events/${id}`);
  }
}
