import { Component, Input, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { QABulkService } from '../../service/qa-bulk.service';
import { QAState } from '../../store/qa.state';

@Component({
  selector: 'assign-expiry-date-bulk',
  templateUrl: './assign-expiry-date-bulk.component.html',
  // styleUrls: ['./add-notes.component.css'],
})
export class AssignExpiryDateBulkComponent implements OnInit {
  @Select(QAState.getSelectedQAList) storeQuestions;
  @Input() onSuccess;
  questions = [];
  questionsCopy = [];
  removedQuestions = [];
  bulkRemovedQuestions = [];
  loadingData;
  IsRemoveAllTagsOption;
  expiryDate;
  minDate = new Date();
  constructor(
    private readonly bulkUpdateService: QABulkService,
    private readonly SweetAlert: SweetAlertService,
    private readonly modal: CustomModalService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.storeQuestions.pipe(take(1)).subscribe((questions) => {
      this.questions = JSON.parse(JSON.stringify(questions));
      this.questionsCopy = JSON.parse(JSON.stringify(questions));
      this.questionsCopy.forEach((question) => {
        question.expiryDate = [];
        question.question_sme.map((val) => {
          question.expiryDate.push(val.id);
        });
      });
    });
    this.IsRemoveAllTagsOption = this.checkIfEmpty();
  }

  checkIfEmpty() {
    let expiryDate = [];
    this.questions.forEach((question) => {
      if (question.hasOwnProperty('expiry_date') && question.expiry_date) {
        expiryDate.push(question.expiry_date);
      }
    });
    return expiryDate.length > 0;
  }

  handleAsOfDateChange(date) {
    this.expiryDate = date;
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

  removeAllExpiry() {
    return this.SweetAlert.confirm({
      title: 'Are you sure you want to remove all the expiry dates?',
      confirmButtonText: 'Yes',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.loadingData = true;
        const params = {
          field: 'expiry_date',
          request_type: 'remove_all',
          ids: this.questions.map((val) => val.response_id),
          values: null,
        };

        this.bulkUpdateService.bulkUpdate(params).subscribe(() => {
          this.loadingData = false;
          this.onSuccess(true);
          this.modal.close();
          // return this.close(smeUpdationParamas);
        });
      }
    });
  }

  addexpiryDate(question: {
    hasOwnProperty: (arg0: string) => any;
    temp_expiry_date: any;
    response_id: any;
  }) {
    if (
      question.hasOwnProperty('temp_expiry_date') &&
      question.temp_expiry_date
    ) {
      const params = {
        field: 'expiry_date',
        request_type: 'add',
        ids: [question.response_id],
        values: this.Utils.getToDateTimeFormatted(question.temp_expiry_date),
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }

  addexpiryDateBulk() {
    if (this.expiryDate) {
      const params = {
        field: 'expiry_date',
        request_type: 'add',
        ids: this.questions.map((val) => val.response_id),
        values: this.Utils.getToDateTimeFormatted(this.expiryDate),
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }

  removeExpiryDate(question: { response_id: any; expiry_date: any }) {
    const params = {
      field: 'expiry_date',
      request_type: 'remove',
      ids: [question.response_id],
      values: question.expiry_date,
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  updateDatesBulkData(cb) {
    this.loadingData = true;
    const promise = [];
    this.removedQuestions.map((question) => {
      promise.push(this.removeExpiryDate(question));
    });
    if (this.expiryDate) {
      promise.push(this.addexpiryDateBulk());
    } else {
      this.questions.map((question) => {
        promise.push(this.addexpiryDate(question));
      });
    }
    let localPro = [];
    promise.map((val) => {
      if (val !== undefined) {
        localPro.push(val);
      }
    });
    if (localPro.length === 0) {
      this.loadingData = false;
      this.onSuccess();
      cb();
    }
    forkJoin(localPro).subscribe(() => {
      this.loadingData = false;
      this.onSuccess();
      cb();
    });
  }

  handleDateChange(quesObj) {
    this.questions[quesObj.index] = quesObj.question;
  }
}
