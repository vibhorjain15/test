import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { QABulkService } from '../../service/qa-bulk.service';
import { QAState } from '../../store/qa.state';

@Component({
  selector: 'assign-tag-bulk',
  templateUrl: './assign-new-tag-bulk.component.html',
  // styleUrls: ['./add-notes.component.css'],
})
export class AssignNewTagsBulkComponent implements OnInit {
  loadingData: boolean = false;
  tagsToBeAdded: string;
  addNewQuestionToggle: boolean;
  hideRemoveAllTagsOption: boolean;
  tags: any;

  removedQuestions = [];
  bulkRemovedQuestions = [];
  questions = [];
  questionsCopy;
  tagsList = [];
  IsRemoveAllTagsOption;
  tagsMap = {};
  @Select(QAState.getSelectedQAList) storeQuestions;
  @Input() onSuccess;
  constructor(
    private readonly bulkUpdateService: QABulkService,
    private readonly SweetAlert: SweetAlertService,
    private readonly modal: CustomModalService,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    this.storeQuestions.pipe(take(1)).subscribe((questions) => {
      this.questions = JSON.parse(JSON.stringify(questions));
      this.questions.forEach((question) => {
        question.smeIds = [];
        if (question.hasOwnProperty('tags') && question.tags.length > 0) {
          question.tags.map((val) => {
            question.smeIds.push(val.id);
          });
        } else {
          question.tags = [];
        }
      });
      this.questionsCopy = JSON.parse(JSON.stringify(this.questions));
    });

    this.IsRemoveAllTagsOption = this.checkIfEmpty();

    this.loadingData = false;
    this.tagsToBeAdded = '';
    this.addNewQuestionToggle = false;
    const params = { Type: 'Question' };
    this.http.get('tags', { params }).subscribe((response) => {
      this.tags = response;
      this.tags.map((val) => {
        this.tagsMap[val.id] = val;
      });
    });
  }

  checkIfEmpty() {
    let list = [];
    this.questions.forEach((question) => {
      if (question.hasOwnProperty('tags') && question.tags.length > 0) {
        question.tags.map((tag) => {
          list.push(tag);
        });
      }
    });
    return list.length > 0;
  }

  removeTagFromCurrentQuestion(tag: { id: any }, question: any) {
    const params = {
      field: 'tags',
      request_type: 'remove',
      ids: question.map((val) => val.response_id),
      values: [tag.id],
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  removeAllTags(tag: any) {
    return this.SweetAlert.confirm({
      title: 'Are you sure you want to remove all the tags?',
      confirmButtonText: 'Yes',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.loadingData = true;
        const params = {
          field: 'tags',
          request_type: 'remove_all',
          ids: this.questions.map((val) => val.response_id),
          values: null,
        };
        return this.bulkUpdateService.bulkUpdate(params).subscribe(() => {
          this.loadingData = false;
          this.onSuccess(true);
          this.modal.close();
        });
      }
    });
  }

  addTagsForRespectiveQuestion(question) {
    let index: number, tagsInQuestionIds: { indexOf?: any };
    const tagsToBeAddedList = [];
    if (question.hasOwnProperty('tags')) {
      tagsInQuestionIds = question.tags.map((val) => val.id);
    } else {
      tagsInQuestionIds = [];
    }
    for (index = 0; index < question.smeIds.length; index++) {
      const tag = this.tagsMap[question.smeIds[index]];
      if (tag && tagsInQuestionIds.indexOf(tag.id) === -1) {
        const tag_obj = {
          id: tag.id,
          value: tag.name,
        };
        tagsToBeAddedList.push(tag_obj);
      }
    }
    if (tagsToBeAddedList.length > 0) {
      const params = {
        field: 'tags',
        request_type: 'add',
        ids: [question.response_id],
        values: tagsToBeAddedList,
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }

  removeTagsForRespectiveQuestion(question) {
    let index: number, tagsInQuestionIds: { indexOf?: any }[];
    const tagsToBeRemovedList = [];
    if (question.hasOwnProperty('tags')) {
      tagsInQuestionIds = question.tags.map((val) => val.id);
    } else {
      tagsInQuestionIds = [];
    }
    for (index = 0; index < tagsInQuestionIds.length; index++) {
      const tag = question.tags[index];
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
        field: 'tags',
        request_type: 'remove',
        ids: [question.response_id],
        values: tagsToBeRemovedList.map((tag) => tag.id),
      };
      return this.bulkUpdateService.bulkUpdate(params);
    }
  }

  addTagsBulk() {
    const tagsToBeAddedList = [];
    this.tagsList.map((tag) => {
      const { id, name } = this.tagsMap[tag];
      tagsToBeAddedList.push({
        id,
        value: name,
      });
    });
    // not required currently
    // this.tagsToBeAdded.split(',').map((tag) => {
    //   if (tag) {
    //     tag_obj = {
    //       id: 0,
    //       value: tag,
    //     };
    //   }
    //   tagsToBeAddedList.push(tag_obj);
    // });
    const params = {
      field: 'tags',
      request_type: 'add',
      ids: this.questions.map((val) => val.response_id),
      values: tagsToBeAddedList,
    };
    return this.bulkUpdateService.bulkUpdate(params);
  }

  filterTags(query: any) {
    if (!query) {
      return this.tags;
    }
    const regex = new RegExp(query, 'i');
    return this.tags.filter((tag: { name: any }) => regex.test(tag.name));
  }

  updateTagsBulkData(cb) {
    this.loadingData = true;

    const RemovePromise = [];
    const addPromise = [];
    if (this.tagsList.length > 0) addPromise.push(this.addTagsBulk());
    this.questions.map((question, i) => {
      RemovePromise.push(this.removeTagsForRespectiveQuestion(question));
      addPromise.push(this.addTagsForRespectiveQuestion(question));
    });

    this.removedQuestions.map((data) => {
      RemovePromise.push(
        this.removeTagFromCurrentQuestion(data.tag, data.question)
      );
    });
    this.bulkRemovedQuestions.map((data) => {
      RemovePromise.push(
        this.removeTagFromCurrentQuestion(data.tag, data.question)
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

  handleChangetags(questions) {
    this.questions = questions;
  }

  handleRemoveQuestions(questions) {
    this.removedQuestions = questions;
  }
  handleBulkRemoveQuestions(questions) {
    this.bulkRemovedQuestions = questions;
  }
}
