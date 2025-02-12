import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export class PendingRequest {
  url: string;
  method: string;
  options: any;
  subscription: Subject<any>;

  constructor(
    url: string,
    method: string,
    options: any,
    subscription: Subject<any>
  ) {
    this.url = url;
    this.method = method;
    this.options = options;
    this.subscription = subscription;
  }
}

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private requests$ = new Subject<any>();
  private queue: PendingRequest[] = [];

  constructor(private httpClient: HttpClient) {
    this.requests$.subscribe((request) => this.execute(request));
  }

  /** Call this method to add your http request to queue */
  invoke(url, method, options) {
    return this.addRequestToQueue(url, method, options);
  }

  private execute(requestData) {
    //One can enhance below method to fire post/put as well. (somehow .finally is not working for me)
    const req = this.httpClient.get(requestData.url).subscribe((res) => {
      const sub = requestData.subscription;
      sub.next(res);
      this.queue.shift();
      this.startNextRequest();
    });
  }

  private addRequestToQueue(url, method, options) {
    const sub = new Subject<any>();
    const request = new PendingRequest(url, method, options, sub);

    this.queue.push(request);
    if (this.queue.length === 1) {
      this.startNextRequest();
    }
    return sub;
  }

  private startNextRequest() {
    // get next request, if any.
    if (this.queue.length > 0) {
      this.execute(this.queue[0]);
    }
  }
}
