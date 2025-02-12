import { SweetAlertService } from './../../../services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-dv-subscriber-selection',
  templateUrl: './dv-subscriber-selection.component.html',
  styleUrls: ['./dv-subscriber-selection.component.css'],
})
export class DvSubscriberSelectionComponent implements OnInit {
  @Input() selection;
  @Input() functions;
  @Output() selectionChanged = new EventEmitter<any>();
  @Input() singleMode: boolean = false;
  @Input() showHeader: boolean = false;
  @Input() infoTooltipText = '';

  constructor(
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selection?.currentValue) {
      this.selection = changes.selection.currentValue;
    }
  }

  addSubscriber(event) {
    const subscriber = event.member;
    const type = event.type;
    if (this.singleMode) {
      if (type === 'function') {
        this.selection = {
          id: subscriber.function_id,
          fullName: subscriber.function_name,
          type: 'function',
        };
      } else {
        subscriber.type = 'user';
        this.selection = subscriber;
      }
      this.selectionChanged.emit(this.selection);
    } else {
      const subsciberIds =
        this.selection?.map((selection) => selection.id) ?? [];
      if (subsciberIds.includes(subscriber.function_id)) {
        this.toaster.warning('same user role can not be assigned again', '', {
          timeOut: 2000,
        });
        return;
      } else if (subsciberIds.includes(subscriber.id)) {
        this.toaster.warning('same user can not be assigned again', '', {
          timeOut: 2000,
        });
        return;
      }
      if (type === 'function') {
        this.selection.push({
          id: subscriber.function_id,
          fullName: subscriber.function_name,
          type: 'function',
        });
      } else {
        subscriber.type = 'user';
        this.selection.push(subscriber);
      }
      this.selectionChanged.emit(this.selection);
    }
  }

  removeSubscriber(subscriber, resolve) {
    if (this.singleMode) {
      this.selection = null;
      this.selectionChanged.emit(this.selection);
    } else {
      const index = this.selection.findIndex(
        (func) => func.id === subscriber.id
      );
      if (index > -1) {
        this.selection.splice(index, 1);
      }
      this.selectionChanged.emit(this.selection);
    }
    resolve();
  }

  displaySubscriberRemovalConfirmation(subscriber) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to unsubscribe ${subscriber.fullName}?`,
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeSubscriber(subscriber, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }
}
