import { Component, Input, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { QABulkService } from '../../service/qa-bulk.service';
import { QAState } from '../../store/qa.state';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'assign-sme-bulk',
  templateUrl: './assign-sme-bulk.component.html',
  // styleUrls: ['./add-notes.component.css'],
})
export class AssignSmeBulkComponent implements OnInit {
  @Select(QAState.getSelectedQAList) storeQuestions;
  @Select(UserState.getTeamMembersData) storeTeamMembers;
  @Input() onSuccess;
  questions = [];
  teamMembers = [];
  smeBulkIds = [];
  IsRemoveAllTagsOption;
  removedQuestions = [];
  bulkRemovedQuestions = [];
  loadingData;

  questionsCopy;
  constructor(
    private readonly bulkUpdateService: QABulkService,
    private readonly SweetAlert: SweetAlertService,
    private readonly modal: CustomModalService
  ) {}
  ngOnInit(): void {
    this.storeQuestions.pipe(take(1)).subscribe((questions) => {
      this.questions = JSON.parse(JSON.stringify(questions));
      this.questionsCopy = JSON.parse(JSON.stringify(questions));
      this.questionsCopy.forEach((question, i) => {
        question.smeIds = [];
        this.questions[i].smeIds = [];
        question.question_sme.map((val) => {
          question.smeIds.push(val.id);
          this.questions[i].smeIds.push(val.id);
        });
      });
    });
    this.storeTeamMembers.pipe(take(1)).subscribe((member) => {
      this.teamMembers = JSON.parse(JSON.stringify(member));
    });
    this.IsRemoveAllTagsOption = this.checkIfEmpty();
  }

  checkIfEmpty() {
    let smesList = [];
    this.questions.forEach((question) => {
      if (
        question.hasOwnProperty('question_sme') &&
        question.question_sme.length > 0
      ) {
        question.question_sme.map((sme) => {
          smesList.push(sme);
        });
      }
    });
    return smesList.length > 0;
  }

  handleChangetags(questions) {
    this.questions = questions;
  }

  handleRemoveQuestions(questions) {
    this.removedQuestions = questions;
  }
  handleBulkRemoveQuestions(questions) {
    this.bulkRemovedQuestions = questions;
  }

  removeSmeFromCurrentQuestion(sme: { id: any }, question: any) {
    const id_list = [];
    question.map((question_data) => {
      const id_list_param = {
        question_id: question_data.question_id,
        diligence_id: question_data.duediligence_id,
      };
      id_list.push(id_list_param);
    });
    const params = {
      field: 'sme',
      request_type: 'remove',
      ids: id_list,
      values: [sme.id],
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  removeSmesForAllQuestionsBulk(sme: { id: any }, questions_list: any) {
    const id_list = [];
    questions_list.map((question) => {
      const id_list_param = {
        question_id: question.question_id,
        diligence_id: question.duediligence_id,
      };
      id_list.push(id_list_param);
    });
    const params = {
      field: 'sme',
      request_type: 'remove',
      ids: id_list,
      values: [sme.id],
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  removeAllSme() {
    return this.SweetAlert.confirm({
      title: 'Are you sure you want to remove all the SME(s)?',
      confirmButtonText: 'Yes',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.loadingData = true;
        const id_list = [];
        for (let question of Array.from(this.questions)) {
          const id_list_param = {
            question_id: question.question_id,
            diligence_id: question.duediligence_id,
          };
          id_list.push(id_list_param);
        }
        const params = {
          field: 'sme',
          request_type: 'remove_all',
          ids: id_list,
          values: [],
        };
        this.bulkUpdateService.bulkUpdate(params).subscribe((response: any) => {
          this.loadingData = false;
          this.onSuccess(true);
          this.modal.close();
          // return this.close(smeUpdationParamas);
        });
      }
    });
  }

  addSme(question) {
    let index: number;
    let smesToBeAddedList = [];
    if (question.hasOwnProperty('question_sme')) {
      smesToBeAddedList = question.question_sme.map((val) => val.id);
    } else {
      smesToBeAddedList = [];
    }
    const indexesToBeRemoved = [];
    for (index = 0; index < question.smeIds.length; index++) {
      const sme = question.smeIds[index];
      if (sme && smesToBeAddedList.indexOf(sme.id) !== -1) {
        indexesToBeRemoved.push(index);
      }
    }
    for (index of Array.from(indexesToBeRemoved)) {
      question.smeIds.splice(index, 1);
    }
    if (question.smeIds.length > 0) {
      const id_list_param = {
        question_id: question.question_id,
        diligence_id: question.duediligence_id,
      };
      const params = {
        field: 'sme',
        request_type: 'add',
        ids: [id_list_param],
        values: question.smeIds,
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }

  addSmeBulk() {
    const id_list = [];
    for (let question of Array.from(this.questions)) {
      const id_list_param = {
        question_id: question.question_id,
        diligence_id: question.duediligence_id,
      };
      id_list.push(id_list_param);
    }
    const params = {
      field: 'sme',
      request_type: 'add',
      ids: id_list,
      values: this.smeBulkIds,
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  handleOnClick(cb) {
    this.loadingData = true;
    const addPromise = [];
    const RemovePromise = [];
    if (this.smeBulkIds?.length > 0) addPromise.push(this.addSmeBulk());
    this.questions.map((question, i) => {
      addPromise.push(this.addSme(question));
      RemovePromise.push(this.removeSmeForRespectiveQuestion(question));
    });

    this.removedQuestions.map((data) => {
      RemovePromise.push(
        this.removeSmeFromCurrentQuestion(data.tag, data.question)
      );
    });
    this.bulkRemovedQuestions.map((data) => {
      RemovePromise.push(
        this.removeSmesForAllQuestionsBulk(data.tag, data.question)
      );
    });

    let localRemove = [];
    let localAdd = [];
    RemovePromise.map((val) => {
      if (val !== undefined) {
        localRemove.push(val);
      }
    });

    addPromise.map((val) => {
      if (val !== undefined) {
        localAdd.push(val);
      }
    });

    if (localRemove.length === 0 && localAdd.length === 0) {
      this.loadingData = false;
      this.onSuccess();
      cb();
    }
    if (localRemove.length) {
      forkJoin([...localRemove, ...localAdd]).subscribe(() => {
        this.loadingData = false;
        this.onSuccess();
        cb();
      });
    } else {
      forkJoin(localAdd).subscribe(() => {
        this.loadingData = false;
        this.onSuccess();
        cb();
      });
    }
  }

  removeSmeForRespectiveQuestion(question) {
    let index: number, tagsInQuestionIds: { indexOf?: any }[];
    const tagsToBeRemovedList = [];
    if (question.hasOwnProperty('question_sme')) {
      tagsInQuestionIds = question.question_sme.map((val) => val.id);
    } else {
      tagsInQuestionIds = [];
    }
    for (index = 0; index < tagsInQuestionIds.length; index++) {
      const tag = question.question_sme[index];
      if (tag && question.smeIds.indexOf(tag.id) === -1) {
        const tag_obj = {
          id: tag.id,
          value: tag.value,
        };
        tagsToBeRemovedList.push(tag_obj);
      }
    }
    if (tagsToBeRemovedList.length > 0) {
      const params = {
        field: 'sme',
        request_type: 'remove',
        ids: [
          {
            question_id: question.question_id,
            diligence_id: question.duediligence_id,
          },
        ],
        values: tagsToBeRemovedList.map((tag) => tag.id),
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }
}
