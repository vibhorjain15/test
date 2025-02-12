import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'app-open-api',
  templateUrl: './open-api.component.html',
  styleUrls: ['./open-api.component.css'],
})
export class OpenApiComponent implements OnInit {
  loading_api_key;
  api_key;
  generating_api_key: boolean;

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.loading_api_key = true;
    this.http
      .get('api_keys')
      .pipe(finalize(() => (this.loading_api_key = false)))
      .subscribe((response: any) => (this.api_key = response));
  }

  generateAPIKey(resolve = null) {
    this.generating_api_key = true;
    this.http
      .put('api_keys', {})
      .pipe(
        finalize(() => {
          this.generating_api_key = false;
          if (resolve) {
            resolve();
          }
        })
      )
      .subscribe((response: any) => {
        this.api_key = response;
      });
  }

  regenerateAPIKey() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to reset the api key?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.generateAPIKey(resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }
}
