import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-crd',
  templateUrl: './upload-crd.component.html',
})
export class UploadCrdComponent implements OnInit, OnDestroy {
  @Input() selectedUser: number;
  @Input() onSuccess: any;
  crds = new FormControl('', Validators.required);
  crdsCopy;
  valueChangesSubscription$: Subscription;
  loading = false;
  constructor(private http: HttpClient, private toaster: ToastrService) {}

  ngOnDestroy(): void {
    if (this.valueChangesSubscription$) {
      this.valueChangesSubscription$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.valueChangesSubscription$ = this.crds.valueChanges.subscribe(
      (response) => {
        this.crdsCopy = response?.trim();
      }
    );
  }

  submit() {
    const arrayMapping = [];
    const arrayCRDs: string[] = this.crds.value.split('\n');

    arrayCRDs.forEach((crd) => {
      if (parseInt(crd) && crd) {
        arrayMapping.push({ firmCRD: crd });
      }
    });

    if (!arrayCRDs.length) return;
    this.loading = true;

    const payload = {
      assigned_to: this.selectedUser || null,
      mappings: arrayMapping,
    };

    this.http.post('Firm_FirmCRD_Mappings/bulk', payload).subscribe(
      () => {
        this.toaster
          .success(`Tracking added for ${arrayMapping.length} CRDs`, '')
          .onHidden.toPromise()
          .then(() => {
            this.onSuccess();
            this.crds.reset();
            this.crdsCopy = null;
            this.loading = false;
          });
      },
      (e) => {
        this.loading = false;
      }
    );
  }
}
