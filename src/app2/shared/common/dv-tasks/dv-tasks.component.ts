import { swal } from 'sweetalert2/dist/sweetalert2.js';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ManageTaskService } from 'src/app2/services/manage-task.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dv-tasks',
  templateUrl: './dv-tasks.component.html',
  styleUrls: ['./dv-tasks.component.css'],
})
export class DvTasksComponent implements OnInit, OnDestroy, OnChanges {
  @Input() entityType;
  @Input() entityId;
  @Input() dateFilter;
  @Input() pageUrl;
  tasks = [];
  customDateFilter: any;
  loadingTasks: boolean;
  subscription: Subscription;

  constructor(
    private readonly http: HttpClient,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private taskService: ManageTaskService
  ) {}

  ngOnInit(): void {
    this.customDateFilter = this.dateFilter;
    this.subscribeForTaskChanges();
    this.getTasks();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.dateFilter?.currentValue !== changes?.dateFilter?.previousValue
    ) {
      this.customDateFilter = changes?.dateFilter?.currentValue;
      this.getTasks();
    }
  }

  subscribeForTaskChanges() {
    this.subscription = this.taskService.tasksChanged$.subscribe(() => {
      this.tasks = this.taskService.tasks;
    });
  }

  getTasks() {
    this.loadingTasks = true;
    const params: any = {
      entity_type: this.entityType,
      entity_id: this.entityId,
      openToDos: true,
    };
    if (this.customDateFilter) {
      params.start_date = this.customDateFilter.startDate;
      params.end_date = this.customDateFilter.endDate;
    }
    this.taskService.getAllTasks(
      params,
      () => {
        this.tasks = this.taskService.tasks;
        this.loadingTasks = false;
      },
      this.pageUrl
    );
  }

  addTask() {
    this.ModalFactory.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: this.entityType,
          entity_id: this.entityId,
          pageUrl: this.pageUrl,
        },
      },
    });
  }

  editTask(task) {
    task.pageUrl = this.pageUrl;
    this.ModalFactory.invoke('manage-task', {
      initialState: {
        task,
      },
    });
  }

  markTaskAsComplete(task) {
    task.is_complete = true;
    this.http.put(`todos/${task.id}`, task).subscribe((response: any) => {
      task.completed_at = new Date();
      const message = 'The task has been marked as completed!';
      this.toaster.success('', message);
      task = response;
      const taskIndex = this.tasks.findIndex(
        (taskItem) => taskItem.id === task.id
      );
      this.tasks.splice(taskIndex, 1);
    });
  }

  deleteTask(task, resolve) {
    this.http
      .delete(`todos/${task.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        const message = 'The task has been marked as deleted!';
        this.toaster.success('', message);
        const taskIndex = this.tasks.findIndex(
          (taskItem) => taskItem.id === task.id
        );
        this.tasks.splice(taskIndex, 1);
        swal.close();
      });
  }

  confirmDeleteTask(task) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this task?',
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteTask(task, resolve);
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
