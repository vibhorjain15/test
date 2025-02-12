import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { DropdownDefault } from '../../constants/questions-container.constant';
import { ResponseType } from '../../constants/Response-type.constant';
import {
  GetQuestionData,
  UpdateActiveSection,
  UpdateLocalGridMap,
  UpdateLocalQuestionMap,
} from '../../store/questionnaire.action';
import {
  DefaultQuestionState,
  LocalQuestionMapHelper,
  UpdateLocalQuestionState,
} from '../../store/questionnaire.util';
import { isNestedQuestionValid } from 'src/app2/modules/questionnaire/util/question-status.util';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'questionnaire-print-preview',
  templateUrl: './questionnaire-print-preview.component.html',
  styleUrls: ['./questionnaire-print-preview.component.css'],
})
export class QuestionnairePrintPreviewComponent implements OnInit {
  @Input() section: any;
  @Input() catName: string;
  @Input() searchText: string;
  @Input() filterType: 'Search' | 'ResponseSearch' = 'Search';
  sequenceDropdown;
  loading;
  sequenceQuestionData;
  localGridMap = {};
  questionData;
  subCatTitle;
  parentQuestionCount;
  firmPreferences;
  @Select(UserState.getFirmPreferenceData) firmPref;

  constructor(private readonly store: Store, private dvDatePipe: DvDatePipe) {}

  ngOnInit(): void {
    this.loading = true;
    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });
    this.store.dispatch(new GetQuestionData(this.section)).subscribe((res) => {
      this.loadQuestionData();
      this.store.selectSnapshot(
        (state) =>
          (this.parentQuestionCount =
            state.questionnaire.parentQuestionCount[this.section.id])
      );
    });
  }

  loadQuestionData() {
    let localQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    );
    this.sequenceDropdown = [...DropdownDefault];
    const { questions } = this.store.selectSnapshot(
      (state) => state.questionnaire
    );
    if (!questions[this.section.id]) {
      this.loading = false;
      return;
    }
    let localSectionId = JSON.parse(
      JSON.stringify(Object.values(questions[this.section.id]))
    );
    this.sequenceQuestionData = localSectionId.sort((left, right) =>
      left.index < right.index ? -1 : 1
    );
    let sequenceMap: Set<any> = new Set();
    let localGridMap = {};
    localSectionId.forEach((ques: any) => {
      sequenceMap.add(ques.sequenceID);
      // Ganesh - LocalGridMap is probably not required for print preview. It's only used for updates. Can check and skip this.
      this.initializeLocalGridMap(ques, localGridMap);
      ques.showComment = !(
        ques.responseType == ResponseType.TextEmail ||
        ques.responseType == ResponseType.Text ||
        ques.responseType == ResponseType.TextMultiLine ||
        ques.responseType == ResponseType.BooleanPlus ||
        ques.responseType == ResponseType.BooleanPlus ||
        ques.responseType == ResponseType.NoPlus
      );
      if (ques.nestedQuestions.length) {
        this.updatNestedViewLogic(ques.nestedQuestions, ques, localQuestionMap);
      }
    });
    if (this.section.isMultiple) {
      let stateSequenceMap = JSON.parse(
        JSON.stringify(
          this.store.selectSnapshot((state) => state.questionnaire.sequenceMap)
        )
      );
      this.questionData = [...this.sequenceQuestionData];
      [...sequenceMap].forEach((val) => {
        if (val in stateSequenceMap) {
          delete stateSequenceMap[val];
        }
      });
      let localQuestionMap = {};
      Object.keys(stateSequenceMap).forEach((sequenceID, index) => {
        let copySequenceQuestionData = JSON.parse(
          JSON.stringify(this.sequenceQuestionData)
        );

        'responses' in stateSequenceMap[sequenceID] &&
          Object.keys(stateSequenceMap[sequenceID]['responses']).forEach(
            (questionID) => {
              localQuestionMap[
                `${sequenceID}-${this.section.id}-${questionID}`
              ] = stateSequenceMap[sequenceID]['responses'][questionID];
            }
          );
        copySequenceQuestionData = copySequenceQuestionData.map((question) => {
          if (
            `${sequenceID}-${this.section.id}-${question.id}` in
              localQuestionMap &&
            stateSequenceMap[sequenceID]['responses'] &&
            question.id in stateSequenceMap[sequenceID]['responses']
          ) {
            this.setSequenceProperties(
              question,
              sequenceID,
              stateSequenceMap[sequenceID]['responses']
            );
          } else {
            question = {
              ...question,
              isSequence: true,
              sequenceID,
              assignedUser: {
                attributes: {
                  assigned_to: null,
                },
              },
              answer: {
                attributes: DefaultQuestionState(),
              },
            };
            this.store.dispatch(
              new UpdateLocalQuestionMap(
                `${sequenceID}-${question.sectionID}-${question.id}`,
                LocalQuestionMapHelper(question.answer)
              )
            );
          }
          if (question.nestedQuestions.length) {
            this.updatNestedViewLogic(
              question.nestedQuestions,
              question,
              localQuestionMap
            );
          }
          if (
            question.responseType === ResponseType.Grid ||
            question.responseType === ResponseType.DynamicGrid
          ) {
            this.initializeLocalGridMap(question, localGridMap);
          }
          return question;
        });
        this.sequenceDropdown.splice(this.sequenceDropdown.length - 1, 0, {
          label: `${this.subCatTitle}`,
          key: sequenceID,
          rightIcon: 'trashcan',
        });
        this.questionData = [...this.questionData, ...copySequenceQuestionData];
      });
    } else {
      this.questionData = localSectionId.sort((left, right) =>
        left.index < right.index ? -1 : 1
      );
    }
    this.store.dispatch(new UpdateLocalGridMap(localGridMap));
    this.loading = false;
  }

  initializeLocalGridMap(question, localGridMap) {
    let id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    if (!localGridMap[id]) {
      localGridMap[id] = {};
    }
    question?.answer?.attributes?.localgrid_responses?.map(
      ({
        row_id,
        column_id,
        value,
        mode,
        row_group_id,
        column_group_id,
        formula,
        is_aggregated,
      }) => {
        localGridMap[id][`${row_id}-${column_id}`] = {
          row_id,
          column_id,
          value,
          row_group_id,
          column_group_id,
          formula,
          is_aggregated,
        };
        if (mode) {
          localGridMap[id][`${row_id}-${column_id}`]['mode'] = mode;
        }
      }
    );
  }

  setSequenceProperties(question, sequenceId, sequenceResponseMap) {
    if (question != null) {
      question.sequenceID = sequenceId;
      question.isSequence = true;
      if (question.id in sequenceResponseMap) {
        question.answer = sequenceResponseMap[question.id];
      } else {
        question = {
          ...question,
          assignedUser: {
            attributes: {
              assigned_to: null,
            },
          },
          answer: {
            attributes: DefaultQuestionState(),
          },
        };
      }
    }

    question?.nestedQuestions?.forEach((nestedQuestion) => {
      if (nestedQuestion && nestedQuestion.nestedID) {
        this.setSequenceProperties(
          nestedQuestion.nestedID,
          sequenceId,
          sequenceResponseMap
        );
      }
    });

    this.store.dispatch(
      new UpdateLocalQuestionMap(
        `${sequenceId}-${question.sectionID}-${question.id}`,
        LocalQuestionMapHelper(question.answer)
      )
    );
  }

  updatNestedViewLogic(questions, parent, localQuestionMap, ids = []) {
    questions.forEach((nested) => {
      nested.nestedID.isValid = isNestedQuestionValid(
        parent,
        nested.operatorID,
        nested.value,
        localQuestionMap
      );
      if (!nested.nestedID.isValid) {
        const id = `${nested.nestedID.sequenceID}-${nested.nestedID.sectionID}-${nested.nestedID.id}`;
        ids.push(id);
        UpdateLocalQuestionState(nested.nestedID.answer, this.dvDatePipe);
      }
      this.updatNestedViewLogic(
        nested.nestedID.nestedQuestions,
        nested.nestedID,
        localQuestionMap,
        ids
      );
    });
  }
}
