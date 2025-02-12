import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { finalize, take } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';

@Component({
  selector: 'app-product-tags',
  templateUrl: './product-tags.component.html',
  styleUrls: ['./product-tags.component.css'],
})
export class ProductTagsComponent implements OnInit {
  loading;
  systemStrategies;
  strategies;
  is_admin;
  allStrategies: any;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly NewModalFactory: CustomModalService,
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.is_admin = user.isAdmin;
        }
      });

    this.loadStrategies();
    this.systemStrategies = [];
    this.strategies = [];
  }

  loadStrategies() {
    this.loading = true;
    this.http.get('strategies ').subscribe((response: any) => {
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
    if (strategy.total_funds > 0){
      var message = `We’ve found ${strategy.total_funds} product(s) with this respective classification associated. Deleting this will remove the classification from all. Do you still want to delete?`
    }else{
      var message = `Are you sure you want to remove \"${strategy.name}\"?`
    }
      

    this.SweetAlert.confirm({
      title: message,
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
        this.toaster.success('Classification removed successfully!');
        this.allStrategies.splice(this.allStrategies.indexOf(strategy), 1);
        this.groupStrategy();
      });
  }

  addNewStrategy() {
    this.NewModalFactory.invoke('add-strategy', {
      initialState: {
        strategies: this.strategies,
        strategy: null,
        onSuccess: (response) => {
          this.allStrategies = response;
          this.groupStrategy();
        },
      },
    });
  }

  editStrategy(strategy: any, index: string | number) {
    this.NewModalFactory.invoke('add-strategy', {
      initialState: {
        strategies: null,
        strategy: strategy,
        onSuccess: (response) => {
          this.strategies[index] = response[0];
        },
      },
    });
  }
}

