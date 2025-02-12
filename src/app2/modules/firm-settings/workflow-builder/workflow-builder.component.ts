import { Select, Store } from '@ngxs/store';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
// import { UserState } from 'src/app2/store/states/user.state';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { WorkflowService } from 'src/app2/services/workflow/workflow.service';
import { UserState } from 'src/app2/store/user/user.state';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  GetCurrentUser,
  GetTeamMembers,
} from 'src/app2/store/user/user.action';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-workflow-builder',
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.css'],
})
export class WorkflowBuilderComponent implements OnInit, OnDestroy {
  @Input() readonlyMode?: boolean = false;
  @Input() id?;
  workflow_steps = [];
  loading_workflow_steps = false;
  selectedStep;
  step;
  loading_workflow_actions;
  workflowactions;
  new_todo;
  readonly_mode: boolean;
  workflow_steps_loading: boolean;
  assignedUsers;
  workflowId: any;
  sortableOptions;
  reorder_resource: any;
  all_workflows_list: any;
  action_types: any;
  teamMembers: any;
  workflow: any;
  route_change_nagger: any;
  saving_action: boolean;
  duration_types: any;
  isCollapsed = false;
  workFlowForm: FormGroup;
  workflows: FormArray;
  currentWorkSub: any;
  current_user: any;
  functions;
  state;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getTeamMembersData) teamMembers$;

  dragStartIndex;

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly ModalFactory: CustomModalService,
    private readonly WorkflowService: WorkflowService,
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          this.initialize();
        }
      });
  }

  initialize() {
    this.workFlowForm = new FormGroup({
      workflows: new FormArray([]),
    });
    this.workflows = this.workFlowForm.get('workflows') as FormArray;
    this.readonly_mode = this.readonlyMode;
    this.workflow_steps_loading = false;
    this.assignedUsers = [];
    this.state = this.routerService.getState();
    this.workflowId = this.state?.params?.workflowId;
    this.loading_workflow_steps = true;
    this.currentWorkSub = this.WorkflowService.currWorkSub.subscribe(
      (workflow) => {
        if (workflow) {
          this.workflow = workflow;
          forkJoin([
            this.http.get('workflow_actions'),
            this.http.get('duration_types'),
            this.http.get('function_assignments', {
              params: {
                entity_id: this.current_user.firmInfo.id,
                entity_type: 'Firm',
              },
            }),
          ]).subscribe((response) => {
            this.action_types = response[0];
            this.duration_types = response[1];
            this.functions = response[2];
            this.workflow_steps = this.workflow.steps;
            if (this.workflow_steps.length > 0) {
              this.getWorkflowStepActions(
                this.workflow_steps[
                  this.workflow.index ? this.workflow.index : 0
                ]
              );
            }
            if (this.workflow_steps.length === 0) {
              this.workflowactions = null;
            }
          });
        }
        this.loading_workflow_steps = false;
      }
    );
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
          this.teamMembers = teamMembers.map((teamMember) => {
            const teamMemberCopy = { ...teamMember };
            teamMemberCopy.fullname = `${teamMember.firstName} ${teamMember.lastName}`;
            return teamMemberCopy;
          });
        }
      }),
      (this.sortableOptions = {
        axis: 'y',
        handle: '.sort-handle',
        cursor: 'move',
        placeholder: 'sortable-placeholder',
      });
    this.reorder_resource = this.http.get('workflows/' + this.workflowId);
  }

  addNewTodo(event, action, newTodo) {
    if (newTodo && newTodo.length > 1) {
      if (event.which === 13 || event.keyCode === 13) {
        const todo = {
          text: newTodo,
          is_complete: false,
          is_active: true,
          entity_id: action.id,
          entity_type: 'Workflow_action',
        };
        action.checklist.push(todo);
        action.new_todo = '';
        this.actionChanged(action, 'checklist');
        event.preventDefault();
      }
    }
    if (event.which === 13 || event.keyCode === 13) {
      event.preventDefault();
    }
  }

  getWorkflow(id: any) {
    this.http.get('workflows/' + id).subscribe((response: any) => {
      this.workflow = response;
      this.getWorkflowSteps(id);
    });
  }

  getWorkflowSteps(workflowId: any) {
    this.loading_workflow_steps = true;
    this.http
      .get(`workflows/${workflowId}/workflow_steps`)
      .subscribe((response: any) => {
        this.workflow_steps = response;
        this.loading_workflow_steps = false;
        if (this.workflow_steps.length > 0) {
          this.getWorkflowStepActions(this.workflow_steps[0]);
        }
      });
  }

  getWorkflowStepActions(step: { id: any }) {
    this.loading_workflow_actions = true;
    this.selectedStep = step;
    this.http
      .get(
        `workflows/${this.workflowId}/workflow_steps/${step.id}/workflow_steps_actions`
      )
      .subscribe((response: any) => {
        this.workflowactions = response;
        this.loading_workflow_actions = false;
        this.workflows.clear();
        this.workflowactions.forEach((action, index) => {
          if (index === 0) {
            action.isOpen = true;
          } else {
            action.isOpen = false;
          }
          this.getAssignedUserList(action);
          this.convertHoursToDays(action);
          action.unsaved = {};
          action.previous = { ...action };
          action.previous.assigned_users_id = [...action.assigned_users_id];
          /* action.assigned_users_id = action.assigned_users_id.filter((id) =>
            this.teamMembers.some((member) => member.id === id)
          ); */
          this.workflows.push(
            new FormGroup({
              actionNameControl: new FormControl(action.action_id || '', [
                Validators.required,
              ]),
              assignOwnerControl: new FormControl(
                action.assigned_users_id || []
              ),
              processOwnerControl: new FormControl(
                action.is_owner_task || false
              ),
              durationDaysControl: new FormControl(action.duration_days || '', [
                Validators.required,
                Validators.pattern(/^[\d]*$/),
                Validators.min(1),
              ]),
              durationTypeControl: new FormControl(action.duration_type || '', [
                Validators.required,
              ]),
              todoControl: new FormControl(),
            })
          );
        });
      });
  }

  getWorkflowActions(step) {
    if (this.selectedStep !== step) {
      const unsavedActions = this.getUnsavedActions();
      if (unsavedActions.length > 0) {
        this.SweetAlert.confirm({
          title: 'Are you sure you want to continue?',
          text:
            'You have ' +
            unsavedActions.length +
            ' unsaved change. All your changes will be lost',
          confirmButtonText: 'Save and exit',
          cancelButtonText: 'Do not Save',
          showCloseButton: true,
          focusCancel: false,
          showLoaderOnConfirm: true,
          preConfirm: () => {
            const promises = [];
            unsavedActions.forEach((action, index) => {
              const promise = this.getWorkflowSavePromises(
                action,
                action.formIndex
              );
              if (promise) {
                promises.push(promise);
              }
            });
            if (promises.length === unsavedActions.length) {
              forkJoin(promises)
                .pipe(finalize(() => swal.close()))
                .subscribe(() => {
                  this.toaster.success('Changes saved successfully');
                  this.getWorkflowStepActions(step);
                });
            } else {
              this.toaster.error('Some of your changes failed validation');
              swal.close();
            }
          },
        }).then((isConfirm: { dismiss: string }) => {
          if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
            this.getWorkflowStepActions(step);
          }
        });
      } else {
        this.getWorkflowStepActions(step);
      }
    }
  }

  getWorkflowSavePromises(action, index) {
    let param: any;
    if (!action.is_owner_task) {
      this.setAssignedUsers(action, index);
    }
    if (action.is_owner_task) {
      this.resetAssignedUsers(action);
    }
    this.convertDaysToHours(action);
    this.removeRouteChangeNagger();
    if (action.id) {
      param = {
        id: action.id,
        duration_type: action.duration_type,
        duration_hours: action.duration_hours,
        action_id: action.action_id,
        users: action.users,
        workflow_audit_id: action.workflow_audit_id,
        workflow_steps_actions_id: action.workflow_steps_actions_id,
        workflow_steps_id: action.workflow_steps_id,
        checklist: action.checklist,
        is_owner_task: this.workflows.controls[index].get('processOwnerControl')
          .value,
      };
      return this.http.put(
        `workflows/${this.workflowId}/workflow_steps/${this.selectedStep.id}/workflow_steps_actions/${action.id}`,
        param
      );
    } else {
      param = {
        action_id: action.action_id,
        duration_type: action.duration_type,
        duration_hours: action.duration_hours,
        users: action.users,
        workflow_steps_id: action.workflow_steps_id,
        checklist: action.checklist,
        is_owner_task: action.is_owner_task,
      };
      return this.http.post(
        `workflows/${this.workflowId}/workflow_steps/${this.selectedStep.id}/workflow_steps_actions`,
        param
      );
    }
  }

  getUnsavedActions() {
    const unsavedActions = [];
    this.workflowactions?.forEach((action, index) => {
      if (action.has_unsaved_changes) {
        action.formIndex = index;
        unsavedActions.push(action);
      }
    });
    return unsavedActions;
  }

  convertHoursToDays(action) {
    action.duration_days = parseInt(action.duration_hours) / 24;
  }

  convertDaysToHours(action) {
    action.duration_hours = action.duration_days * 24;
  }

  getAssignedUserList(action) {
    // action.assigned_users_id = action.users.map((user) => user.user_id);
    action.assigned_users_id = [];
    action.users.forEach((user) => {
      if (user.user_id) {
        const teammember = this.teamMembers.find(
          (member) => member.id === user.user_id
        );
        if (teammember) {
          teammember.type = 'user';
          action.assigned_users_id.push(teammember);
        }
      } else if (user.function_id) {
        const func = this.functions.find(
          (func) => func.function_id === user.function_id
        );
        if (func) {
          action.assigned_users_id.push({
            id: func.function_id,
            fullName: func.function_name,
            type: 'function',
          });
        }
      }
    });
  }

  manageWorkflowStep(step?, index?) {
    let stepChanges;
    if (step) {
      stepChanges = { ...step };
    } else {
      stepChanges = {
        name: '',
        description: '',
        workflow_id: this.workflowId,
      };
    }
    this.ModalFactory.invoke('manage-workflow-step', {
      initialState: {
        allSteps: this.workflow_steps,
        workflowId: this.workflowId,
        edit_mode: false,
        step: stepChanges,
        successCallback: (response) => {
          const index = this.workflow_steps.findIndex(
            (x) => x.id == response.id
          );
          this.workflow_steps[index].name = response.name;
          this.workflow_steps[index].description = response.description;
          this.selectedStep = this.workflow_steps[index];
        },
      },
      class: 'modal-lg',
    });
  }

  confirmRemoveStep(step) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this step?',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.removeStep(step);
      },
    });
  }

  removeStep(step) {
    this.WorkflowService.deleteWorkflowStep(
      step,
      () => {
        this.toaster.success('Workflow Step deleted successfully');
        const index = this.workflow_steps.indexOf(step);
        this.workflow_steps.splice(index, 1);
        if (step.id == this.selectedStep.id) {
          this.removeRouteChangeNagger();
          this.workflowactions = null;
        }
        if (this.workflow_steps.length > 0) {
          this.getWorkflowActions(this.workflow_steps[0]);
        }
      },
      () => {}
    );
  }

  removeRouteChangeNagger() {
    // This function is called when chanegs are saved
    // remove the beforeunload listner
    window.onbeforeunload = null;
    // if check is there is a nagger (route change listner)
    if (this.route_change_nagger != null) {
      this.route_change_nagger(); //deregisters the listener
      this.route_change_nagger = null;
    }
  }

  addRouteChangeNagger() {
    if (this.route_change_nagger != null) {
      return;
    }
    // get unsaved changes
    const unsavedActions = this.getUnsavedActions();
    if (unsavedActions.length > 0) {
      let leaving_state = false;
      const getTitle = () => 'You have unsaved change';
      // beforeunload event is fired when the window, the document and its resources are about to be unloaded.
      // The document is still visible and the event is still cancelable at this point
      window.onbeforeunload = () =>
        `${getTitle()}. All your unsaved changes will be lost`;
      // here we are listen to route/state change event. Before state is changed this event is fired
      // TODO
      /* return (this.route_change_nagger = this.$scope.$on(
        '$stateChangeStart',
        (
          event: { preventDefault: () => void },
          toState: { name: any },
          toParams: any
        ) => {
          if (leaving_state) {
            return;
          }
          event.preventDefault();
          return this.SweetAlert.confirm({
            title: 'Are you sure you want to continue?',
            text:
              'You have ' +
              unsavedActions.length +
              ' unsaved change. All your changes will be lost',
            confirmButtonText: 'Save and exit',
            cancelButtonText: 'Do not Save',
            showCloseButton: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
              const promises = [];
              _(unsavedActions).each(
                (action: { formIndex: any }, index: any) => {
                  const promise = this.getWorkflowSavePromises(
                    action,
                    action.formIndex
                  );
                  if (promise) {
                    return promises.push(promise);
                  }
                }
              );
              if (promises.length === unsavedActions.length) {
                return this.$q.all(promises).then(() => {
                  swal.close();
                  this.toaster.pop('success', '', 'Changes saved successfully');
                  leaving_state = true;
                  return this.$timeout(() => {
                    // pass state name with params, if we don't pass to params it will create problems
                    return this.$state.go(toState.name, toParams);
                  });
                });
              } else {
                swal.close();
                leaving_state = true;
                this.toaster.pop(
                  'error',
                  '',
                  'Some of your changes failed validation'
                );
                return this.$timeout(() => {
                  return this.$state.go(toState.name, toParams);
                });
              }
            },
          }).then((isConfirm: { dismiss: string }) => {
            if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
              swal.close();
              leaving_state = true;
              return this.$timeout(() => {
                return this.$state.go(toState.name, toParams);
              });
            }
          });
        }
      )); */
    }
  }

  saveWorkflowAction(action, index, resolve = null) {
    const promise = this.getWorkflowSavePromises(action, index);
    if (!promise) {
      return;
    }
    this.saving_action = true;
    if (action.id) {
      promise
        .pipe(
          finalize(() => {
            this.saving_action = false;
            if (resolve) {
              resolve();
            }
          })
        )
        .subscribe((response: any) => {
          this.workflowactions[index] = response;
          this.toaster.success('Action updated successfully');
          this.getAssignedUserList(this.workflowactions[index]);
          this.convertHoursToDays(this.workflowactions[index]);
          this.workflowactions[index].unsaved = {};
          this.workflowactions[index].previous = {
            ...this.workflowactions[index],
          };
          this.workflowactions[index].isOpen = true;
        });
    } else {
      promise
        .pipe(
          finalize(() => {
            this.saving_action = false;
            if (resolve) {
              resolve();
            }
          })
        )
        .subscribe((response: any) => {
          this.workflowactions[index] = response;
          this.toaster.success('Action added successfully');
          this.getAssignedUserList(this.workflowactions[index]);
          this.convertHoursToDays(this.workflowactions[index]);
          this.workflowactions[index].unsaved = {};
          this.workflowactions[index].previous = {
            ...this.workflowactions[index],
          };
          this.workflowactions[index].isOpen = true;
        });
    }
  }

  resetAssignedUsers(action) {
    if (action.id) {
      action.users.forEach((user) => {
        user.is_active = false;
      });
    } else {
      action.users = [];
    }
  }

  setAssignedUsers(action, index) {
    const assignedUsers = [...action.assigned_users_id];
    action.users.forEach((user) => {
      const userIndex = assignedUsers.findIndex((assignedUser) => {
        return (
          user.user_id === assignedUser.id ||
          user.function_id === assignedUser.id
        );
      });
      if (userIndex > -1) {
        assignedUsers.splice(userIndex, 1);
      } else {
        user.is_active = false;
      }
    });
    assignedUsers.forEach((user) => {
      const newUser: any = {
        user_id: user.type === 'user' ? user.id : null,
        function_id: user.type === 'function' ? user.id : null,
        is_active: true,
      };
      if (action.id) {
        newUser.workflow_steps_actions_id = action.id;
      }
      action.users.push(newUser);
    });
  }

  confirmRemoveAction(action, index?) {
    const title = 'Are you sure you want to delete this action?';
    if (this.workflowactions.length > 1) {
      this.SweetAlert.confirm({
        title,
        text: '',
        confirmButtonText: 'Okay',
        focusCancel: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          this.deleteStepAction(action);
        },
      });
    }
  }

  deleteStepAction(action, index?) {
    if (action.id) {
      this.http
        .delete(
          `workflows/${this.workflowId}/workflow_steps/${this.selectedStep.id}/workflow_steps_actions/${action.id}`
        )
        .subscribe(() => {
          swal.close();
          this.toaster.success('Workflow deleted successfully');
          this.workflowactions.splice(index, 1);
        });
    } else {
      swal.close();
      this.workflowactions.splice(index, 1);
    }
  }

  removeTask(action, task, index) {
    if (task.id) {
      task.is_active = false;
    } else {
      action.checklist.splice(index, 1);
    }
  }

  addNewAction() {
    const newAction = {
      action_id: null, //if we initialse to "" then it creates problem with the chosen directive.
      checklist: [],
      duration_days: 1,
      duration_hours: 24,
      duration_type: 'Day',
      is_owner_task: false,
      users: [],
      workflow_steps_id: this.selectedStep.id,
      isOpen: true,
      has_unsaved_changes: true,
      unsaved: {},
      assigned_users_id: [],
    };
    this.workflowactions.push(newAction);
    this.workflows.push(
      new FormGroup({
        actionNameControl: new FormControl(null, [Validators.required]),
        assignOwnerControl: new FormControl([]),
        processOwnerControl: new FormControl(false),
        durationDaysControl: new FormControl(1, [Validators.required]),
        durationTypeControl: new FormControl('Day', [Validators.required]),
        todoControl: new FormControl(),
      })
    );
  }

  cancelUpdate(action, index) {
    if (action.has_unsaved_changes) {
      this.SweetAlert.confirm({
        title: 'Are you sure you want to continue?',
        text: 'You have 1 unsaved change. All your changes will be lost',
        showCloseButton: true,
        cancelButtonText: 'Do Not Save',
        confirmButtonText: 'Save & Exit',
        showLoaderOnConfirm: true,
        preConfirm: () => {
          this.saveWorkflowAction(action, index);
          swal.close();
        },
      }).then((isConfirm: { dismiss: string }) => {
        if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
          this.resetAction(action, index);
        }
      });
    } else {
      this.resetAction(action, index);
    }
  }

  actionChanged(action, attribute, index?) {
    if (attribute === 'duration_days') {
      action[attribute] = this.workflows.controls[index].get(
        'durationDaysControl'
      ).value;
    }
    if (attribute === 'action_id') {
      action.action_id =
        this.workflows.controls[index].get('actionNameControl').value;
    }
    if (attribute === 'is_owner_task') {
      action.is_owner_task = this.workflows.controls[index].get(
        'processOwnerControl'
      ).value;
    }
    if (!action.id) {
      return;
    }
    if (attribute === 'assigned_users_id') {
      const assignedUserIds = action.assigned_users_id.map((user) => user.id);
      const previousAssignedUserIds = action.previous.assigned_users_id.map(
        (user) => user.id
      );
      if (this.compareAssignedUsers(previousAssignedUserIds, assignedUserIds)) {
        action.unsaved[attribute] = true;
      } else {
        delete action.unsaved[attribute];
      }
    } else if (attribute === 'checklist') {
      if (this.compareCheckList(action.previous.checklist, action.checklist)) {
        action.unsaved[attribute] = true;
      } else {
        action.has_unsaved_changes = false;
      }
    } else if (action[attribute] !== action.previous[attribute]) {
      action.unsaved[attribute] = true;
    } else {
      delete action.unsaved[attribute];
    }
    action.has_unsaved_changes = this.checkActionUnsavedChanges(action);
  }

  checkActionUnsavedChanges(action) {
    const unsavedAttributes = Object.keys(action.unsaved);
    if (unsavedAttributes.length > 0) {
      return unsavedAttributes.reduce(
        (has_unsaved, attribute) => action.unsaved[attribute] || has_unsaved,
        false
      );
    } else {
      return false;
    }
  }

  compareAssignedUsers(previous, current) {
    if (!current) {
      current = [];
    }
    if (!previous) {
      previous = [];
    }
    if (previous.length !== current.length) {
      return true;
    }
    if (current.filter((x) => !previous.includes(x)).length) {
      return true;
    }
    return false;
  }

  compareCheckList(previous, current) {
    if (previous.length !== current.length) {
      return true;
    }
    let status = false;
    if (previous.length === current.length) {
      current.forEach((task) => {
        if (task.id) {
          const oldTask = previous.find((old) => old.id === task.id);
          if (
            oldTask.text !== task.text ||
            oldTask.is_active !== task.is_active
          ) {
            status = true;
          }
        } else {
          status = true;
        }
      });
    }
    return status;
  }

  resetAction(action, index) {
    if (action.id) {
      this.workflowactions[index] = { ...this.workflowactions[index].previous };
      this.getAssignedUserList(this.workflowactions[index]);
      this.convertHoursToDays(this.workflowactions[index]);
      this.workflowactions[index].previous = { ...this.workflowactions[index] };
      this.workflowactions[index].isOpen = false;
    } else {
      this.workflowactions.splice(index, 1);
    }
  }

  isOpenChange(event, action) {
    action.isOpen = event;
  }

  ngOnDestroy() {
    this.currentWorkSub.unsubscribe();
  }

  handleUpdateList(step, list, index) {
    const params = {
      name: list[index].name,
      description: list[index].description,
      workflow_id: list[index].workflow_id,
      id: list[index].id,
      order: list[index].order,
      destination_index: index,
    };
    this.selectedStep = step;
    this.WorkflowService.upateWorkflowSteps(
      this.workflowId,
      params,
      () => {
        this.toaster.success('Workflow Step reordered successfully');
      },
      () => {}
    );
  }
}
