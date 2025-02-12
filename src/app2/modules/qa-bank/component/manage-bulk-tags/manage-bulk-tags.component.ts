import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
@Component({
  selector: 'manage-bulk-tags',
  templateUrl: './manage-bulk-tags.component.html',
  styleUrls: ['./manage-bulk-tags.component.css'],
})
export class ManageBulkTagsComponent implements OnInit {
  @Input() questions = [];
  @Input() dropdownData = [];
  @Input() type: 'sme' | 'tags' | 'expiryDate' = 'tags';
  @Output() onChangeTags = new EventEmitter();
  @Output() onDateChange = new EventEmitter();
  @Output() OnRemoveQuestions = new EventEmitter();
  @Output() OnBulkRemoveQuestions = new EventEmitter();
  showAllTag: boolean;
  tagType = 'question_sme';
  tagLimit = 'limit_to_sme';
  noDataLable = 'No SME';
  minDate = new Date();

  markedToRemoveWIthQuestions = [];
  markedToRemoveBulk = [];
  downloadedDataCopy:any = [];
  ngOnInit(): void {
    if (this.type === 'sme') {
      this.tagType = 'question_sme';
      this.tagLimit = 'limit_to_sme';
      this.noDataLable = 'No SME';
    } else if (this.type === 'tags') {
      this.tagType = 'tags';
      this.tagLimit = 'limit_to';
      this.noDataLable = 'No Tag';
    } else {
      this.tagType = 'expiry_date';
      this.noDataLable = '';
    }
  
  }

  addTagsToDropdown() {
    this.questions.forEach((question) => {
      question.smeIds = [];
      question[this.tagType].map((val) => {
        question.smeIds.push(val.id);
      });
    });
  }

  onProductChange(question) {
    this.onChangeTags.emit(this.questions);
  }

  handleTagChange() {
    this.addTagsToDropdown();
    this.onChangeTags.emit(this.questions);
  }

  markRemoveFromCurrentQuestion(tag, question, index) {
    let isMatched = false;
    this.markedToRemoveWIthQuestions.map((val, i) => {
      if (val.tag.id === tag.id) {
        this.markedToRemoveWIthQuestions[i].question.push(question);
        isMatched = true;
      }
    });
    if (!isMatched) {
      let tagsParams = {
        tag: tag,
        question: [question],
      };
      this.markedToRemoveWIthQuestions.push(tagsParams);
    }
    question[this.tagType].splice(index, 1);
    question[this.tagType] = JSON.parse(JSON.stringify(question[this.tagType]));
    this.OnRemoveQuestions.emit(this.markedToRemoveWIthQuestions);
    this.handleTagChange();
  }

  markRemoveExpiryFromCurrentQuestion(question, index) {
    this.markedToRemoveWIthQuestions.push(question);
    this.OnRemoveQuestions.emit(this.markedToRemoveWIthQuestions);
    question.expiry_date = '';
  }

  markRemoveBulk(tag) {
    let count = 0;
    let questionList = [];
    this.questions.forEach((question) => {
      if (question[this.tagType]) {
        question[this.tagType].map((tempVal, index) => {
          if (question[this.tagType][index].id === tag.id) {
            question[this.tagType].splice(index, 1);
            question.smeIds.splice(index, 1);
            question.tags_text.splice(index, 1);
            questionList.push(question);
            count++;
          }
        });
      }
    });

    this.questions = this.questions;
    this.markedToRemoveBulk.push({
      tag,
      count,
      question: questionList,
    });
    this.OnBulkRemoveQuestions.emit(this.markedToRemoveBulk);
    this.handleTagChange();
  }

  handleTagToggle(question) {
    question.showTags = !question.showTags;
    question.smeIds = [];
    if (this.type !== 'expiryDate') {
      question[this.tagType].map((val) => {
        question.smeIds.push(val.id);
      });
    }
    if (this.dropdownData?.length) {
      this.setMembersOptions();
    }
  }

  handleExpiryChange(date, question, index) {
    question.temp_expiry_date = date;
    this.onDateChange.emit({ index, question });
  }

  removeMarkedToRemoveWIthQuestions(index) {
    this.questions.map((question, i) => {
      this.markedToRemoveWIthQuestions[index].question.map(
        (removedQuestion) => {
          if (question.question_id == removedQuestion.question_id) {
            this.questions[i][this.tagType].push(
              this.markedToRemoveWIthQuestions[index].tag
            );
          }
        }
      );
    });
    this.markedToRemoveWIthQuestions.splice(index, 1);
    this.OnRemoveQuestions.emit(this.markedToRemoveWIthQuestions);
    this.handleTagChange();
  }

  toggleShowAllTags(question) {
    question[this.tagLimit] = question[this.tagType].length;
    question.showAllTag = !question.showAllTag;
  }
  removedMarkedToRemoveBulk(index) {
    let allQuestionsIds = this.markedToRemoveBulk[index].question.map(
      (val) => val.question_id
    );

    this.questions.map((question, i) => {
      if (allQuestionsIds.includes(question.question_id)) {
        this.questions[i][this.tagType].push(
          this.markedToRemoveBulk[index].tag
        );
      }
    });
    this.markedToRemoveBulk.splice(index, 1);
    this.OnBulkRemoveQuestions.emit(this.markedToRemoveBulk);
    this.handleTagChange();
  }

  setMembersOptions() {
    this.downloadedDataCopy = this.dropdownData.map((member) => {
      return {
        id: member.id,
        name: this.type === 'tags' ? member.name : member.fullName,
      };
    });
  }
}
