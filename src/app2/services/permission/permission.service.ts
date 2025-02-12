import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { USER_ROLES } from 'src/app2/shared/constants/constant';
import { BaseDataService } from '../base-data.service';
import { UtilsService } from '../utils.service';
import { ITeam } from './permission.type';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  permissionSub = new Subject();
  disabledRedirectionMessage = `Projects which are either 'Sent', 'Withdrawn' or 'Deleted' can not be accessed.`;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly UtilsService: UtilsService
  ) {}

  allRoles = [];
  allPermission = [];
  allTeams = [];
  allUsers = [];

  getRoles(id, success, failure) {
    if (this.allRoles.length > 0) return success(this.allRoles);
    this.http.get(`firms/${id}/roles?include_admins=false`).subscribe(
      (response: any) => {
        this.allRoles = response;
        success(response);
      },
      (error) => failure()
    );
  }

  getTeams(id, success, failure) {
    this.http.get(`firms/${id}/teams`).subscribe(
      (response: any) => {
        success(response);
        this.allTeams = response;
      },
      (error) => failure()
    );
  }

  getTeamByuserid(id, userId, success, failure) {
    this.http.get(`firms/${id}/users/${userId}/TeamMemberships`).subscribe(
      (response: any) => {
        success(response);
      },
      (error) => failure()
    );
  }

  createTeam(id, params, success, failure) {
    this.http.post(`firms/${id}/teams`, params).subscribe(
      (response: ITeam) => {
        success(response);
        this.toaster.success('Team created successfully');
      },
      (error) => failure()
    );
  }

  updateTeam(
    id,
    params,
    success,
    failure,
    isUpdate = false,
    message = 'Team updated successfully'
  ) {
    this.http.put(`firms/${id}/teams/${params.id}`, params).subscribe(
      (response: ITeam) => {
        success(response);
        if (isUpdate) {
          this.permissionSub.next();
        }
        this.toaster.success(message);
      },
      (error) => failure(error)
    );
  }

  updateTeamMembers(id, params, success, failure, isUpdate = false) {
    this.http.put(`firms/${id}/teams/${params.id}`, params).subscribe(
      (response: any) => {
        success(response);
        const message = params.members[0].is_active
          ? 'Members added successfully'
          : 'User removed successfully';
        this.toaster.success(message);
        if (isUpdate) this.permissionSub.next();
      },
      (error) => {
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
          return this.UtilsService.logError('Edit team failed', error);
        }
        failure();
      }
    );
  }

  getExistingTeamMembers(id, teamId, success, failure) {
    this.http.get(`firms/${id}/teams/${teamId}/TeamMemberships`).subscribe(
      (response: any) => {
        success(response);
      },
      (error) => failure()
    );
  }

  getUser(id, success, failure) {
    this.http.get(`firms/${id}/users`).subscribe(
      (response: any) => {
        response = response.filter(
          (r) => r.firmwide_role_name.toLowerCase() !== USER_ROLES.SECURITYADMIN
        );
        success(response);
        this.allUsers = response;
      },
      (error) => failure()
    );
  }

  getPermissionLevel(success, failure) {
    if (this.allPermission.length > 0) return success(this.allPermission);
    this.http.get(`PermissionLevels`).subscribe(
      (response: any) => {
        this.allPermission = response;
        success(response);
      },
      (error) => failure()
    );
  }

  getResources(firmId, id, type, success, failure) {
    this.http
      .get(`firms/${firmId}/${type}/${id}/ResourcePermissions`)
      .subscribe(
        (res) => success(res),
        (err) => failure()
      );
  }

  firm_preferences(success, failure) {
    this.http.get(`firm_preferences`).subscribe(
      (res) => success(res),
      (err) => failure()
    );
  }

  createResourcePermissions(id, params, success, failure, isNewTeam = false) {
    this.http.post('firms/' + id + '/ResourcePermissions', params).subscribe(
      (res) => {
        this.toaster.success('Resources assigned successfully');
        success(res);
        !isNewTeam && this.permissionSub.next(res);
      },
      (error) => {
        let avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!avoid_error_logging_statuses.includes(error.status)) {
          this.UtilsService.logError('Error while updating permission', error);
        }
        failure();
      }
    );
  }

  updateResourcePermissions(id, params, success, failure) {
    this.http
      .put('firms/' + id + '/ResourcePermissions/' + params.id, params)
      .subscribe(
        (res) => {
          this.toaster.success('Resources assigned successfully');
          success(res);
          this.permissionSub.next(res);
        },
        (error) => {
          let message = 'Something went wrong. Please try again.';
          if (error.data && error.data.message) message = error.data.message;
          this.toaster.error(message);
          let avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (!avoid_error_logging_statuses.includes(error.status)) {
            this.UtilsService.logError(
              'Error while updating permission',
              error
            );
          }
          failure();
        }
      );
  }

  deleteResourcePermissions(firmId, entityId, success, failure) {
    this.http
      .delete('firms/' + firmId + '/ResourcePermissions/' + entityId)
      .subscribe(
        () => {
          success();
        },
        () => {
          failure();
        }
      );
  }

  getMyPermissionGridRowData(firmId, id, entityType, isUser = true) {
    return this.http
      .get(
        `firms/${firmId}/${
          isUser ? 'users' : 'teams'
        }/${id}/ResourcePermissions`,
        { params: { entity_type: entityType } }
      )
      .pipe(
        map((response: any) =>
          response.map((resource) => ({
            name: resource.entity_name,
            assigned_to: resource.assigned_to_name,
            role: resource.role_name,
            visibility: resource.access_level,
            entity_id: resource.entity_id,
            entity_type: entityType,
          }))
        )
      );
  }
}
