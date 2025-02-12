import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Select } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'benchmarking-questionnaire',
  templateUrl: './benchmarking-questionnaire.component.html',
})
export class BenchmarkingQuestionnaireComponent implements OnInit {
  @Input() noResponseControls: boolean;
  @Input() analyticsMode: boolean;
  @Input() templateId: number;
  @Input() sectionId: number;
  @Input() tagId: number;
  @Input() startDate;
  @Input() endDate;
  @Input() questionCount;
  questionForm: FormGroup;
  spinner_text: any;
  allSection = [];
  questionsPerSection = new Map();
  questionResponse = [];
  is_investor: any;
  is_manager: any;
  isLoading : boolean;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly http: HttpClient,
    private readonly TemplateDataService: TemplateDataService,
  ) {}

  ngOnInit(): void {
    this.spinner_text = 'Populating the questionnaire';
    this.user.pipe(take(1))
      .subscribe((currentUser) => {
        if (currentUser) {
          this.is_investor = currentUser.isInvestor;
          this.is_manager = currentUser.isManager;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes?.sectionId && changes.sectionId.currentValue) {
      this.getSectionData();
    }
  }

  getSectionData() {
    this.isLoading = true
    this.http
      .get(`templates/${this.templateId}/sections`, {
        params: {
          StatusFilter: 'Default',
          parentID: this.sectionId,
        },
      })
      .subscribe((res: any[]) => {

        this.allSection = res;
        this.allSection.map((section) => (section.questionResponse = []));
        setTimeout(() => {
          this.isLoading = false
        }, 1000);
        this.getQuestionsData();
      });
  }

  getQuestionsData() {
    const observables = [];
    this.allSection.map((section) => {
      observables.push(
        this.TemplateDataService.getQuestions({
          params: { sectionID: section.id },
        })
      );
    });
    forkJoin(observables).subscribe((questionsList: Array<any[]>) => {
      questionsList.map((questions: any[]) => {
        for (let i = 0; i < questions.length; i++) {
          this.questionCount += 1;
          questions[i]['index'] = this.questionCount;
        }
        if (questions?.length) {
          this.questionsPerSection.set(questions[0].sectionID, questions);
        }
      });
      this.allSection.map((section) => {
        section.questionResponse =
          this.questionsPerSection.get(section.id) ?? [];
      });
    });
  }
}
