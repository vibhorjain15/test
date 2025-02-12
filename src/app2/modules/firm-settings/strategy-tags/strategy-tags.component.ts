import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ModalService } from 'src/app2/services/modal.service';
import { finalize } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-strategy-tags',
  templateUrl: './strategy-tags.component.html',
  styleUrls: ['./strategy-tags.component.css'],
})
export class StrategyTagsComponent implements OnInit {
  loading;
  systemStrategies: any[];
  strategies: any[];
  allStrategies: any;

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadStrategies();
    this.systemStrategies = [];
    this.strategies = [];
  }

  loadStrategies() {
    this.loading = true;
    this.http.get('strategies').subscribe((response: any) => {
      this.allStrategies = response;
      this.groupStrategy();
      this.loading = false;
    });
  }

  groupStrategy() {
    this.allStrategies.sort((a, b) => {
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
    this.systemStrategies = [];
    this.strategies = [];
    this.allStrategies.forEach((strategy) => {
      if (strategy.is_system) {
        this.systemStrategies.push(strategy);
      } else {
        this.strategies.push(strategy);
      }
    });
  }

  displayTagRemovalConfirmation(strategy, index) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${strategy.name}\"?`,
      confirmButtonText: 'Yes',
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeStrategy(strategy, index, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeStrategy(strategy, index, resolve) {
    const params = [];
    strategy.is_active = false;
    params.push(strategy);
    this.http
      .put('strategies', params)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Strategy removed successfully!');
        this.allStrategies.splice(this.allStrategies.indexOf(strategy), 1);
        this.groupStrategy();
      });
  }

}

