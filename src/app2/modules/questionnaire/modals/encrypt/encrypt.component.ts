import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Subscription } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import {
  ErrorStatusCode,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { TaskType } from '../../constants/question-status.constant';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';

@Component({
  selector: 'app-encrypt',
  templateUrl: './encrypt.component.html',
  styleUrls: ['./encrypt.component.css'],
})
export class EncryptModal implements OnInit, OnDestroy {
  loading: boolean = false;
  encrypt_options_form: FormGroup;
  selected_category;
  is_subcategory_selected: boolean;
  selected_subcategory;
  is_question_selected: boolean;
  selected_questions;
  questions = [];
  categories;
  is_content_selection_mode: boolean = true;
  users;
  functions;
  user_function_options = [];
  is_encrypting: boolean = false;
  is_questions_loading: boolean = false;
  selected_users_and_functions;
  observableSubscriptions: Subscription[] = [];
  postReviewConstants = TaskType.Evaluation;
  preCompletionConstant = TaskType.Inreview;
  @Input() firm_id;
  @Input() diligence: DiligenceType;

  constructor(
    private readonly http: HttpClient,
    private readonly questionnaire_service: QuestionnaireService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit() {
    this.loadCategoryAndSubcategoryData();
    this.encrypt_options_form = new FormGroup({
      category_control: new FormControl(null, Validators.required),
      is_subcategory_selected_control: new FormControl(false),
      subcategory_control: new FormControl(null),
      is_question_selected_control: new FormControl(false),
      question_control: new FormControl(null),
    });

    this.observableSubscriptions.push(
      this.encrypt_options_form
        .get('is_subcategory_selected_control')
        .valueChanges.subscribe((val) => (this.is_subcategory_selected = val))
    );

    this.observableSubscriptions.push(
      this.encrypt_options_form
        .get('is_question_selected_control')
        .valueChanges.subscribe((val) => {
          this.is_question_selected = val;
          if (this.is_question_selected) {
            if (this.selected_subcategory.questions == null) {
              this.loadQuestions();
            } else {
              this.questions = this.selected_subcategory.questions;
            }
          }
        })
    );

    this.observableSubscriptions.push(
      this.encrypt_options_form
        .get('question_control')
        .valueChanges.subscribe((val) => (this.selected_questions = val))
    );
  }

  ngOnDestroy(): void {
    this.observableSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
  }

  loadCategoryAndSubcategoryData() {
    // we are loading it in store
    // this.loading = true;
    // this.questionnaire_service
    //   .getCategoriesList(this.diligence.id)
    //   .subscribe((response) => {
    //     let sections_data = (response as any).data;
    //     this.categories = sections_data
    //       .filter((section) => section?.attributes?.isParent)
    //       .map((category) => {
    //         return {
    //           id: category.id,
    //           name: category.attributes.name,
    //           subcategories: sections_data
    //             .filter(
    //               (section) => section?.attributes?.parentID === category.id
    //             )
    //             .map((subcategory) => {
    //               return {
    //                 id: subcategory.id,
    //                 name: subcategory.attributes.name,
    //                 questions: null,
    //               };
    //             }),
    //         };
    //       });
    //     this.loading = false;
    //   });
  }

  loadQuestions() {
    this.is_questions_loading = true;
    let task_type =
      this.diligence.status === diligenceStatusConstant.Completed ||
      this.diligence.status === diligenceStatusConstant.Evaluation
        ? this.postReviewConstants
        : this.preCompletionConstant;
    this.questionnaire_service
      .getQuestionData(
        this.diligence.id,
        this.selected_subcategory.id,
        task_type
      )
      .subscribe((response) => {
        this.selected_subcategory.questions = (response as any).included
          .filter((item) => item.type === 'questions')
          .map((question) => {
            return { id: question.id, name: question.attributes.text };
          });
        this.questions = this.selected_subcategory.questions;
        this.is_questions_loading = false;
      });
  }

  handleFirstButtonClick(close) {
    if (this.is_content_selection_mode) {
      this.is_content_selection_mode = false;
      this.loading = true;
      let users_observable = this.getUsers(this.firm_id);
      let functions_observable = this.getFunctions(this.firm_id);

      forkJoin(users_observable, functions_observable, (users, functions) => ({
        users,
        functions,
      })).subscribe((response) => {
        this.users = response.users;
        this.functions = response.functions;
        this.user_function_options = this.user_function_options.concat(
          this.functions.map((user_role) => {
            return {
              id: user_role.function_id,
              name: user_role.function_name,
              type: 'User Roles',
            };
          })
        );

        this.user_function_options = this.user_function_options.concat(
          this.users.map((user) => {
            return {
              id: user.id,
              name: user.fullName,
              type: 'Users',
            };
          })
        );
        this.loading = false;
      });
    } else {
      this.is_encrypting = true;
      let params: any = {
        diligence_id: this.diligence.id,
        assigned_to_ids: this.selected_users_and_functions
          .filter((item) => item.type == 'Users')
          .map((item) => item.id),
        assigned_to_function_ids: this.selected_users_and_functions
          .filter((item) => item.type == 'User Roles')
          .map((item) => item.id),
      };

      if (this.is_question_selected) {
        params.entity_type = 'question';
        params.entity_ids = this.selected_questions.map(
          (question) => question.id
        );
      } else if (this.is_subcategory_selected) {
        params.entity_type = 'subsection';
        params.entity_ids = [this.selected_subcategory.id];
      } else {
        params.entity_type = 'section';
        params.entity_ids = [this.selected_category.id];
      }

      this.http
        .post(`diligences/${this.diligence.id}/response_encryption`, params)
        .subscribe(
          () => {
            this.is_encrypting = false;
            this.toaster.success(
              'Encrypted View is visible with a lock icon.',
              'Successfully Encrypted Questions'
            );
            close();
          },
          (err) => {
            this.is_encrypting = false;
            if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error(
                '',
                'Something went wrong while encrypting questions. Please try again.'
              );
            }
          }
        );
    }
  }

  getFunctions(firm_id: number) {
    return this.http.get('function_assignments', {
      params: {
        entity_id: this.diligence.entity_id,
        entity_type:
          this.diligence.entity_type == keywordConstants.Review
            ? keywordConstants.Project
            : this.diligence.entity_type,
      },
    });
  }

  setSelectedQuestions(selected_questions) {
    this.selected_questions = selected_questions;
  }

  getUsers(firm_id: number) {
    return this.http.get(`firms/${firm_id}/users`);
  }

  handleSubcategoryChange(val) {
    this.selected_subcategory = val;
  }

  handleCategoryChange(val) {
    this.selected_category = val;
  }

  handleUsersAndFunctionsChange(val) {
    this.selected_users_and_functions = val;
  }

  setFormControlValue(formControlName, value) {
    this.encrypt_options_form.get(formControlName).setValue(value);
  }
}
