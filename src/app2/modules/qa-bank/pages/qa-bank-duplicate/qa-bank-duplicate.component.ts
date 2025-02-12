import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import {
  diligenceStatusConstant,
  entityApiMap,
  entity_types_manager,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { QABulkService } from '../../service/qa-bulk.service';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { Select } from '@ngxs/store';
import { take, finalize } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { Questions } from '../../types/qa-bank.model';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-qa-bank-duplicate',
  templateUrl: './qa-bank-duplicate.component.html',
  styleUrls: ['./qa-bank-duplicate.component.css'],
})

/*
This is first page in duplicates story, which deals with displaying (grouped) duplicate questions (grouped key=[questionText-ResponseText]),
Also responsible for making any API calls of actions performed on duplicates and edit the duplicate array likewise
*/
export class QaBankDuplicateComponent implements OnInit {
  entity_types = entity_types_manager;
  entityTypeSelected: string;
  entityIdSelected: number;
  entity_names = [];
  entity_name_params = {
    include_contacts: false,
    include_custom_fields: false,
    include_dates: true,
    is_active: true,
    filters: {},
    search_for: '',
  };
  entity_loading = false;
  currUser: CurrentUserModel;
  keywordConstants = keywordConstants;
  questionList = []; // This question list will be a mapp of questionText-responseText : {questionObj}
  allQuestionList = [];
  view: 'duplicatesMain' | 'duplicatesSecondary' = 'duplicatesMain'; // duplicateMain is the main question list view and secondary is the one with primary question view
  duplicates: Questions[];
  start_point = 0;
  end_point = 10;
  questionsTotalCount = 0;
  @Select(UserState.getCurrentUserData) userData;
  primaryQuestion: Questions;
  loading: boolean;
  loadingQuestions;
  questionDisplayCount: number = 0;
  removeAllDuplicateLoader: boolean = false;
  uniqueQuestionList: any = {};
  constructor(
    private router: RouterService,
    private qaBank: QABulkService,
    private sweetAlert: SweetAlertService,
    private toaster: ToastrService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.init();
  }

  init() {
    this.loading = true;

    this.userData
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.loading = false;
          this.currUser = user;
        }
      });
  }

  handleGoBack() {
    this.router.navigate('app.content.questions');
  }

  // When an entity type is changed we get the new type and match it to make an API call to get entity names of that type
  handleEntityChange(entityTypeName) {
    this.entityTypeSelected = entityTypeName;
    this.entity_loading = true;
    this.entityIdSelected = null;
    this.entity_names = [];
    this.questionList = [];
    this.duplicates = null;
    this.start_point = 0;
    this.end_point = 10;
    this.questionDisplayCount = 0;
    this.questionsTotalCount = 0;
    if (entityTypeName !== keywordConstants.MyFirm) {
      this.entity_name_params.search_for =
        this.entityTypeSelected.toLowerCase();
      this.qaBank
        .getEntityNames(
          this.entity_name_params,
          entityApiMap[this.entityTypeSelected.toLowerCase()]
        )
        .subscribe(
          (response: any) => {
            this.entity_names = response.data;
            this.entity_loading = false;
          },
          (err) => (this.entity_loading = false)
        );
    } else {
      this.entityIdSelected = this.currUser.firmInfo.id;
      this.entityTypeSelected = keywordConstants.MyFirm;
    }
  }

  // When entity name is selected
  handleEntityNameChange(entityNameId) {
    this.entityIdSelected = entityNameId;
    this.questionList = [];
    this.duplicates = null;
    this.start_point = 0;
    this.end_point = 10;
    this.questionDisplayCount = 0;
    this.questionsTotalCount = 0;
  }

  // Fetching duplicates form an entity by sending entity id
  getDuplicates() {
    let params = {
      entity_type: EntityType[this.entityTypeSelected],
      entity_id: this.entityIdSelected,
    };
    this.qaBank.getDuplicates(params).subscribe(
      (duplicates: Questions[]) => {
        this.duplicates = this.utils.sortByDate(
          duplicates,
          'response_created_at'
        );
        this.duplicates = duplicates;

        if (duplicates?.length) this.createQuestionList(true);

        this.sweetAlert.close();
      },
      (error: any) => {
        this.sweetAlert.close();
      }
    );
  }

  // here we create a dictionary for grouping question with same question text and answer text and response type (for displaying purposes)
  createQuestionList(firstTime = false) {
    this.uniqueQuestionList = {};
    this.duplicates.forEach((question: Questions) => {
      let key =
        question.question_text +
        JSON.stringify(question.response_text) +
        question.response_type;

      if (!this.uniqueQuestionList[key]) {
        this.uniqueQuestionList[key] = [];
      }

      this.uniqueQuestionList[key].push(question);
    });

    this.questionsTotalCount = Object.keys(this.uniqueQuestionList).length;
    let unsortedQuestionList = Object.values(this.uniqueQuestionList);

    // Making sure that latest response is shown at the top
    this.allQuestionList = unsortedQuestionList
      .sort((a, b) => {
        if (a[0].response_created_at < b[0].response_created_at) return -1;
        else if (a[0].response_created_at > b[0].response_created_at) return 1;
        else return 0;
      })
      .reverse();

    //This function is to sort the grouped questions to show the
    // 1. Approved Q/A first.
    // 2. Newly created Q/A first.
    this.allQuestionList.forEach((questions: Questions[]) => {
      questions = questions.sort((a, b) => {
        // First, compare the 'verified' property (true comes before false)
        if (
          a.response_status ===
            diligenceStatusConstant.ReviewPassed.toLocaleLowerCase() &&
          b.response_status !==
            diligenceStatusConstant.ReviewPassed.toLocaleLowerCase()
        ) {
          return -1;
        } else if (
          a.response_status !==
            diligenceStatusConstant.ReviewPassed.toLocaleLowerCase() &&
          b.response_status ===
            diligenceStatusConstant.ReviewPassed.toLocaleLowerCase()
        ) {
          return 1;
        } else {
          // If 'verified' properties are the same, compare by creation date
          const dateA = new Date(a.response_created_at).getTime();
          const dateB = new Date(b.response_created_at).getTime();
          return dateB - dateA;
        }
      });
    });

    this.end_point =
      this.end_point < this.questionsTotalCount
        ? this.end_point
        : this.questionsTotalCount;

    this.questionList = [];
    let totalDuplicatesFound: number =
      this.duplicates?.length - this.allQuestionList?.length;
    for (let i = this.start_point; i < this.end_point; i++) {
      this.questionList.push(this.allQuestionList[i][0]);
    }

    if (totalDuplicatesFound && firstTime)
      this.toaster.info(
        `Found ${totalDuplicatesFound} exact duplicate${
          totalDuplicatesFound > 1 ? 's' : ''
        }`
      );
  }

  handleChangeView(view: 'duplicatesMain' | 'duplicatesSecondary', question) {
    this.view = view;
    this.primaryQuestion = question;
  }

  handleFindDuplicates() {
    this.questionList = [];
    this.sweetAlert.loaderAlert({
      title: 'Finding all duplicates for this entity.',
      html: 'Please wait for this process to complete.',
      timer: 10000,
    });
    this.start_point = 0;
    this.end_point = 10;
    this.getDuplicates();
  }

  // Any action performed on duplicates is handled here
  manageDuplicates({ type, duplicates, listOfQuestionInvolved, resolve }) {
    let manageDuplicateParams = {
      request_type: 'remove', // changed for different types ( default is for type = deactivate)
      responses_info: {
        response_id: this.primaryQuestion.response_id,
        duplicate_response_ids: duplicates.map(
          (question: Questions) => question.response_id
        ),
      },
    };

    switch (type) {
      case 'deactivate':
        this.qaBank
          .manageDuplicates(manageDuplicateParams)
          .pipe(finalize(() => resolve()))
          .subscribe((res: any) => {
            this.removeDuplicates(duplicates, listOfQuestionInvolved);
            this.toaster.success('Responses successfully archived');
          });
        break;
      case 'merge':
        manageDuplicateParams.request_type = 'merge';
        this.qaBank
          .manageDuplicates(manageDuplicateParams)
          .pipe(finalize(() => resolve()))
          .subscribe((res: any) => {
            this.removeDuplicates(duplicates, listOfQuestionInvolved);
            this.copyTagsSMESToPrimary(duplicates);
            this.primaryQuestion.response_created_at =
              new Date().toLocaleDateString();
            this.toaster.success('Responses successfully merged and archived');
          });
        break;
      case 'notDuplicate':
        manageDuplicateParams.request_type = 'non_duplicates';
        this.qaBank
          .manageDuplicates(manageDuplicateParams)
          .pipe(finalize(() => resolve()))
          .subscribe((res: any) => {
            this.removeDuplicates(duplicates, listOfQuestionInvolved);
            this.toaster.success(
              'Responses successfully marked as not duplicates'
            );
          });
        break;
      case 'copy':
        this.primaryQuestion = duplicates[0];
        this.createQuestionList();
        resolve();
        break;
    }
  }

  removeDuplicates(duplicates, listOfQuestionInvolved) {
    // deleting all the selected duplicates from the main duplicate array
    this.duplicates = this.duplicates.filter((question) => {
      return !duplicates.find(
        (ques) => ques.response_id == question.response_id
      );
    });

    //Removing the id from every questions exact and semi duplicate list
    let involvedQuestion = this.duplicates.filter((question: any) =>
      listOfQuestionInvolved.find(
        (dup: any) => dup.question_id === question.question_id
      )
    );
    involvedQuestion.forEach((duplicate) => {
      duplicate.exact_duplicates = duplicate.exact_duplicates.filter(
        (x) => !duplicates.find((question) => x === question.response_id)
      );

      duplicate.semi_duplicates = duplicate.semi_duplicates.filter(
        (x) => !duplicates.find((question) => x === question.response_id)
      );
    });

    // editing the parent duplicate question
    this.duplicates.find((duplicate) => {
      if (duplicate.response_id == this.primaryQuestion.response_id) {
        duplicate.exact_duplicates = duplicate.exact_duplicates.filter(
          (x) => !duplicates.find((question) => x === question.response_id)
        );

        duplicate.semi_duplicates = duplicate.semi_duplicates.filter(
          (x) => !duplicates.find((question) => x === question.response_id)
        );
      }
    });

    // only keeping those duplicates which have exact or semi duplicates
    this.duplicates = this.duplicates.filter(
      (duplicate) =>
        duplicate.exact_duplicates.length || duplicate.semi_duplicates.length
    );

    this.createQuestionList();
  }

  copyTagsSMESToPrimary(duplicates: Questions[], replace = false) {
    duplicates.forEach((duplicate) => {
      if (!replace) {
        // Pushing Tags to the primary response which are not present
        duplicate.tags.forEach((dupTag) => {
          if (
            !this.primaryQuestion.tags.find(
              (primTag) => primTag.id === dupTag.id
            )
          )
            this.primaryQuestion.tags.push(dupTag);
        });

        // Pushing SMES to the primary response which are not present
        duplicate.question_sme.forEach((sme) => {
          if (
            !this.primaryQuestion.question_sme.find(
              (prim_sme) => prim_sme.id === sme.id
            )
          )
            this.primaryQuestion.question_sme.push(sme);
        });
      } else {
        this.primaryQuestion.tags = duplicate.tags;
        this.primaryQuestion.question_sme = duplicate.question_sme;
      }
    });
  }

  goToPrevious() {
    this.loadingQuestions = true;
    this.start_point = this.start_point - 10;
    this.end_point = this.end_point - 10;

    this.questionList = [];
    for (let i = this.start_point; i < this.end_point; i++) {
      this.questionList.push(this.allQuestionList[i][0]);
    }

    this.loadingQuestions = false;
  }

  goToNext() {
    this.loadingQuestions = true;
    this.start_point = this.start_point + 10;
    this.end_point = Math.min(this.end_point + 10, this.allQuestionList.length);
    let temp_end_point =
      this.end_point < this.questionsTotalCount
        ? this.end_point
        : this.questionsTotalCount;

    this.questionList = [];
    for (let i = this.start_point; i < this.end_point; i++) {
      this.questionList.push(this.allQuestionList[i][0]);
    }
    // this.createQuestionList();

    this.loadingQuestions = false;
  }

  handleResetSelection() {
    this.entity_names = [];
    this.entity_loading = false;
    this.entityTypeSelected = null;
    this.entityIdSelected = null;
    this.questionList = null;
    this.allQuestionList = null;
    this.duplicates = null;
    this.start_point = 0;
    this.end_point = 10;
    this.questionDisplayCount = 0;
    this.questionsTotalCount = 0;
  }

  handleDeleteDuplicates() {
    let params = {
      entity_type: EntityType[this.entityTypeSelected],
      entity_id: this.entityIdSelected,
    };
    this.removeAllDuplicateLoader = true;
    this.qaBank
      .getExactDuplicateArray(params)
      .subscribe((exactDuplicates: any) => {
        if (exactDuplicates.response_ids?.length) {
          this.removeAllDuplicateLoader = false;
          this.sweetAlert.confirm({
            title: `Are you sure you want to archive ${exactDuplicates.response_ids.length} exact duplicate responses`,
            text: 'It will archive all Q&As which have exactly same question and answer text. It will only keep the most recent response out of all duplicate pairs as a unique response.',
            preConfirm: () => {
              return new Promise<void>((resolve) => {
                this.qaBank
                  .removeExactDuplicate({
                    response_ids: exactDuplicates.response_ids,
                  })
                  .pipe(finalize(() => (this.removeAllDuplicateLoader = false)))
                  .subscribe((res) => {
                    resolve();
                    this.toaster.success('All duplicates have been removed');
                    this.duplicates = null;
                    this.handleFindDuplicates();
                  });
              });
            },
          });
        } else {
          this.removeAllDuplicateLoader = false;
          this.toaster.info('No exact duplicates found');
        }
      });
  }
}


