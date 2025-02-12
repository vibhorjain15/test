import { Injectable, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { take, tap, map, takeUntil } from 'rxjs/operators';
import { UserModel } from 'src/app2/store/user/user.model';
import * as moment from 'moment';
import { Store } from '@ngxs/store';
import {
  GetDiligenceSectionData,
  GetQuestionCount,
  getReviewAssignments,
} from '../../store/questionnaire.action';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';

@Injectable({
  providedIn: 'root',
})
export class AssignReviewerService implements OnInit {
  diligence: DiligenceType;
  user: UserModel;
  dueDate: any = moment().add(10, 'days').toDate();
  activeSection;
  isFree: boolean;
  constructor(
    private readonly questionnaire: QuestionnaireService,
    private readonly store: Store,
    private readonly toaster: ToastrService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {}

  updateData(diligence, user) {
    this.diligence = diligence;
    this.user = user;
    this.activeSection = this.store.selectSnapshot(
      (state) => state.questionnaire.activeSection
    );

    this.isFree = this.utils.isFreeSubscription();
  }

  startReviewProcess() {
    let status;
    if (this.diligence?.is_internal) {
      if (this.diligence.status == diligenceStatusConstant.Completed)
        status = diligenceStatusConstant.Evaluation;
      else status = diligenceStatusConstant.InReview;
    } else {
      if (this.user.currentUser.firmInfo.id == this.diligence.fromfirm_id)
        status = diligenceStatusConstant.Evaluation;
      else if (this.user.currentUser.firmInfo.id == this.diligence.tofirm_id)
        status = diligenceStatusConstant.InReview;
    }

    return this.questionnaire.updateDiligenceStatus(this.diligence.id, {
      status: status,
    });
  }

  getFunctions() {
    let params;
    let team_role_list = [];
    if (this.diligence.entity_type == 'Review')
      params = {
        entity_type: 'Duediligence',
        entity_id: this.diligence.id,
      };
    else
      params = {
        entity_type: this.diligence.entity_type,
        entity_id: this.diligence.entity_id,
      };
    return this.questionnaire.getFunctionAssignment(params).pipe(
      map((res: any) => {
        team_role_list = team_role_list.concat(
          res.map((user_role) => ({
            id: user_role.function_id,
            name: user_role.function_name,
            type: 'User Roles',
            is_mandatory: true,
            duration: null,
            assigned_to_function_id: user_role.function_id,
            dueDate: this.dueDate,
          }))
        );

        team_role_list = team_role_list.concat(
          Object.values(this.user.teamMembers).map((user: any) => ({
            id: user.id,
            name: user.fullName,
            type: 'Users',
            firstName: user.firstName,
            lastName: user.lastName,
            assigned_to_user_id: user.id,
            is_mandatory: true,
            duration: null,
            dueDate: this.dueDate,
          }))
        );
        return team_role_list;
      })
    );
  }

  getCategories(categories) {
    let categoryCopy = [];
    if (!categories.length)
      this.store
        .dispatch(new GetDiligenceSectionData())
        .pipe(take(2))
        .subscribe((res) => {
          let cat = Object.values(
            JSON.parse(JSON.stringify(res.questionnaire.categories))
          );
          cat.sort(
            (a: any, b: any) => a.destination_index - b.destination_index
          );
          categoryCopy = cat.map((val: any) => {
            let list = Object.values(val.list);
            list.sort(
              (a: any, b: any) => a.destination_index - b.destination_index
            );
            val.list = list;
            val.isCatSelected = false;
            return val;
          });
          return categoryCopy;
        });
    else {
      categories.sort(
        (a: any, b: any) => a.destination_index - b.destination_index
      );
      categoryCopy = categories.map((val: any) => {
        let list = Object.values(val.list);
        list.sort(
          (a: any, b: any) => a.destination_index - b.destination_index
        );
        val.list = list;
        val.isCatSelected = false;
        return val;
      });
      return categoryCopy;
    }
  }

  assignReviewer(params) {
    return this.questionnaire.assignReviewer(this.diligence.id, params).pipe(
      tap((res) => {
        this.toaster.success(`Reviewer${this.isFree ? '' : '(s)'} assigned`);
        if (this.diligence && this.activeSection) {
          this.store.dispatch(
            new getReviewAssignments(this.diligence.id, this.activeSection.id)
          );
          this.store.dispatch(new GetQuestionCount());
        }
      })
    );
  }
}
