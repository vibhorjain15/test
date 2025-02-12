import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { ManageTaskService } from 'src/app2/services/manage-task.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take, tap } from 'rxjs/operators';
import { GetTeamMembers } from 'src/app2/store/user/user.action';
import { noHtmlValidator } from '../../validators/no-white-space.validator';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { DvValidators } from '../../validators/no-white-space.validator';
@Component({
  selector: 'manage-task',
  templateUrl: './manage-task.component.html',
  styleUrls: ['./manage-task.component.css'],
})
export class ManageTaskModal implements OnInit {
  @ViewChildren(DatePickerComponent) calendars: QueryList<DatePickerComponent>;
  edit_mode: boolean;
  minDate: Date;
  task_types: Array<any> = new Array<any>();
  frequencies: Array<any> = new Array<any>();
  teamMembers: Array<any> = new Array<any>();
  loading: boolean;
  taskForm: FormGroup;
  @Input() task: any;
  functions: Array<any>;
  assigned_to_user: any;
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  @Select(UserState.getTeamMembersData) teamMembers$;
  maxDate: Date;
  taskTypeLoading = false;
  frequencyListLoading = false;
  constructor(
    private readonly http: HttpClient,
    private readonly taskService: ManageTaskService,
    private readonly toaster: ToastrService,
    private datePipe: DatePipe,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.edit_mode = false;
    this.minDate = new Date();
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = data;
        this.createForm();
        this.getData();
      }
    });
  }

  createForm() {
    this.taskForm = new FormGroup({
      text: new FormControl(this.task ? this.task.text : '', [
        DvValidators.required,
        noHtmlValidator,
      ]),
      type: new FormControl('', Validators.required),
      due_date: new FormControl('', Validators.required),
      frequency: new FormControl(
        this.task && this.task.frequency ? this.task.frequency : null
      ),
    });
  }

  getData() {
    this.getTypes();
    this.getFrequencies();
    this.getTeamMembers();
    if (
      this.task &&
      this.task.entity_type !== 'User' &&
      this.task.entity_type !== 'Attachment'
    ) {
      this.getMyFunctions();
    }
  }

  getTypes() {
    const headers = new HttpHeaders();
    if (this.task && this.task.pageUrl) {
      headers.set('page-url', this.task.pageUrl);
    }
    this.taskTypeLoading = !this.taskTypeLoading;
    this.http
      .get('task_types', { headers: headers })
      .pipe(finalize(() => (this.taskTypeLoading = !this.taskTypeLoading)))
      .subscribe((response: Array<any>) => {
        this.task_types = response;
        if (this.task && this.task.id) {
          this.taskForm.get('type').patchValue(this.task.type);
          if (this.task.due_date) {
            this.setDateValue(new Date(this.task.due_date));
          }
        } else {
          this.taskForm.get('type').patchValue(this.task_types[6].id); //Defaulting to update
          this.setDateValue(moment().add(7, 'days').toDate());
        }
      });
  }

  getFrequencies() {
    const headers = new HttpHeaders();
    if (this.task && this.task.pageUrl) {
      headers.set('page-url', this.task.pageUrl);
    }
    this.frequencyListLoading = !this.frequencyListLoading;
    this.http
      .get('frequency', { headers: headers })
      .pipe(
        finalize(() => (this.frequencyListLoading = !this.frequencyListLoading))
      )
      .subscribe((response: Array<any>) => {
        this.frequencies = response;
        if (this.task && this.task.frequency) {
          this.taskForm.get('frequency').patchValue(+this.task.frequency);
        }
      });
  }

  setDateValue(date: Date) {
    this.taskForm.get('due_date').patchValue(date);
  }

  getTeamMembers() {
    this.teamMembers$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetTeamMembers());
          }
        })
      )
      .subscribe((teamMembers) => {
        if (teamMembers) {
          this.teamMembers = teamMembers;
          if (this.task && this.task.id) {
            this.edit_mode = true;
            if (this.task.assigned_to_function_id) {
              this.assigned_to_user = {
                id: this.task.assigned_to_function_id,
                fullName: this.task.assigned_to_function_name,
                type: ' function',
              };
            } else if (this.task.assigned_to) {
              this.assigned_to_user = {
                id: this.task.assigned_to,
                fullName: this.task.assigned_to_name,
                type: 'user',
              };
            }
          } else {
            this.assigned_to_user = this.current_user;
          }
        }
      });
  }

  getMyFunctions() {
    const params = {
      entity_id: this.task.entity_id,
      entity_type: this.task.entity_type,
    };
    this.http
      .get('function_assignments', { params: params })
      .subscribe((response: any) => {
        this.functions = response;
      });
  }

  submit(modalCallback) {
    this.calendars.forEach((x) => x?.close());
    if (!this.taskForm.valid) {
      this.taskForm.markAllAsTouched();
      return;
    } else {
      if (!this.assigned_to_user) {
        this.toaster.error('Please assign to a user role/team member');
        return;
      }
      this.loading = true;
      const payload: any = this.taskForm.value;
      if (this.assigned_to_user.type === 'function') {
        payload.assigned_to_function_id = this.assigned_to_user.id;
        payload.assigned_to = null;
      } else {
        payload.assigned_to = this.assigned_to_user.id;
        payload.assigned_to_function_id = null;
      }
      if (!payload.assigned_to && !payload.assigned_to_function_id) {
        this.toaster.error('Please assign to a user role/team member');
        this.loading = false;
        return;
      }
      payload.entity_id = +this.task.entity_id;
      payload.entity_type = this.task.entity_type;
      payload.due_date = this.datePipe.transform(
        payload.due_date,
        'MM-dd-yyyy'
      );
      if (!payload.frequency) {
        delete payload.frequency;
      }
      if (this.task.id) {
        payload.id = this.task.id;
      }
      if (this.edit_mode) {
        this.taskService.updateTask(
          payload,
          this.task?.pageUrl,
          () => {
            this.successCallback(modalCallback);
          },
          () => (this.loading = false)
        );
      } else {
        this.taskService.addTask(
          payload,
          this.task?.pageUrl,
          () => {
            this.successCallback(modalCallback);
          },
          () => (this.loading = false)
        );
      }
    }
  }

  successCallback(modalCallback: any) {
    this.loading = false;
    modalCallback();
  }

  actionChanged(selection) {
    this.assigned_to_user = selection;
  }
}
